using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;
using AppDaemonStudio.Configuration;

namespace AppDaemonStudio.Services;

public sealed class LspService : ILspService, IHostedService, IDisposable
{
    private const string PylspPath = "/opt/pylsp-venv/bin/pylsp";
    private const int LspPort = 2087;
    private const int MaxBackoffSeconds = 30;

    private readonly ILogger<LspService> _logger;
    private readonly AppSettings _settings;
    private readonly IHttpClientFactory _httpClientFactory;
    private Process? _process;
    private CancellationTokenSource _cts = new();
    private Task _monitorTask = Task.CompletedTask;
    private volatile bool _isReady;

    public bool IsReady => _isReady;

    public LspService(ILogger<LspService> logger, AppSettings settings, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _settings = settings;
        _httpClientFactory = httpClientFactory;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(PylspPath))
        {
            _logger.LogWarning("pylsp not found at {Path} — LSP disabled", PylspPath);
            return Task.CompletedTask;
        }

        _cts = new CancellationTokenSource();
        // StartAsync must return quickly; all work runs in the background monitor task
        _monitorTask = MonitorAsync(_cts.Token);
        return Task.CompletedTask;
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _isReady = false;
        await _cts.CancelAsync();

        KillProcess();

        try { await _monitorTask.WaitAsync(TimeSpan.FromSeconds(5), cancellationToken); }
        catch (OperationCanceledException) { }
        catch (TimeoutException) { }
    }

    /// <summary>
    /// Collects extra Python packages from all sources:
    /// 1. AppDaemon addon options via Supervisor API (python_packages list)
    /// 2. requirements.txt in the apps directory
    /// Returns deduplicated list.
    /// </summary>
    private async Task<List<string>> CollectExtraPackagesAsync(CancellationToken ct)
    {
        var packages = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // ── Source 1: AppDaemon addon options via Supervisor API ──────────
        if (_settings.SupervisorToken is { } token && _settings.AddonSlug is { } slug)
        {
            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.BaseAddress = new Uri("http://supervisor/");
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
                client.Timeout = TimeSpan.FromSeconds(10);

                var response = await client.GetAsync($"addons/{slug}/info", ct);
                if (response.IsSuccessStatusCode)
                {
                    var doc = await response.Content.ReadFromJsonAsync<JsonDocument>(ct);
                    var dataProp = doc?.RootElement.TryGetProperty("data", out var data) == true ? data : doc?.RootElement;

                    if (dataProp?.TryGetProperty("options", out var opts) == true &&
                        opts.TryGetProperty("python_packages", out var pkgs) == true)
                    {
                        foreach (var pkg in pkgs.EnumerateArray())
                        {
                            var name = pkg.GetString();
                            if (!string.IsNullOrWhiteSpace(name)) packages.Add(name);
                        }
                        _logger.LogInformation("Found {Count} package(s) in AppDaemon addon options", packages.Count);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not read AppDaemon addon options from Supervisor API");
            }
        }

        // ── Source 2: requirements.txt in apps directory ──────────────────
        var requirementsPath = Path.Combine(_settings.AppsDir, "requirements.txt");
        if (File.Exists(requirementsPath))
        {
            var lines = await File.ReadAllLinesAsync(requirementsPath, ct);
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                // Skip blank lines and comments
                if (!string.IsNullOrEmpty(trimmed) && !trimmed.StartsWith('#'))
                    packages.Add(trimmed);
            }
            _logger.LogInformation("Found {Count} package(s) total after reading requirements.txt", packages.Count);
        }

        return [.. packages];
    }

    private async Task SyncPackagesAsync(List<string> packages, CancellationToken ct)
    {
        if (packages.Count == 0) return;

        _logger.LogInformation("Installing {Count} extra package(s) into pylsp venv: {Packages}",
            packages.Count, string.Join(", ", packages));
        try
        {
            var pip = Process.Start(new ProcessStartInfo
            {
                FileName = "/opt/pylsp-venv/bin/pip",
                Arguments = $"install {string.Join(' ', packages.Select(p => $"\"{p}\""))}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            })!;

            await pip.WaitForExitAsync(ct);

            if (pip.ExitCode != 0)
            {
                var err = await pip.StandardError.ReadToEndAsync(ct);
                _logger.LogWarning("pip install exited {Code}: {Err}", pip.ExitCode, err);
            }
            else
            {
                _logger.LogInformation("Package sync complete");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Package sync failed — continuing without it");
        }
    }

    private async Task MonitorAsync(CancellationToken ct)
    {
        // Collect and install extra packages before starting pylsp so Jedi can resolve imports.
        // Reads from AppDaemon addon options (Supervisor API) + requirements.txt.
        var packages = await CollectExtraPackagesAsync(ct);
        await SyncPackagesAsync(packages, ct);

        int backoffSeconds = 1;

        while (!ct.IsCancellationRequested)
        {
            try
            {
                StartProcess();
                _logger.LogInformation("pylsp started (pid {Pid})", _process!.Id);
                _isReady = true;
                backoffSeconds = 1;

                await _process.WaitForExitAsync(ct);

                _isReady = false;
                _logger.LogWarning("pylsp exited with code {Code}", _process.ExitCode);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _isReady = false;
                _logger.LogError(ex, "pylsp process error");
            }

            if (ct.IsCancellationRequested) break;

            _logger.LogInformation("Restarting pylsp in {Backoff}s", backoffSeconds);
            await Task.Delay(TimeSpan.FromSeconds(backoffSeconds), ct).ConfigureAwait(false);
            backoffSeconds = Math.Min(backoffSeconds * 2, MaxBackoffSeconds);
        }
    }

    private void StartProcess()
    {
        KillProcess();
        _process = Process.Start(new ProcessStartInfo
        {
            FileName = PylspPath,
            Arguments = $"--tcp --host 127.0.0.1 --port {LspPort}",
            RedirectStandardOutput = false,
            RedirectStandardError = false,
            UseShellExecute = false,
        }) ?? throw new InvalidOperationException("Failed to start pylsp");
    }

    private void KillProcess()
    {
        if (_process is null) return;
        try
        {
            if (!_process.HasExited)
            {
                _process.Kill(entireProcessTree: true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Error killing pylsp process");
        }
        _process.Dispose();
        _process = null;
    }

    public void Dispose()
    {
        _cts.Dispose();
        KillProcess();
    }
}

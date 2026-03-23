using System.Net;
using System.Net.Http.Json;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public class AppDaemonApiService(
    AppSettings settings,
    ISupervisorClient supervisor,
    IHttpClientFactory httpClientFactory,
    ILogger<AppDaemonApiService> logger) : IAppDaemonApiService
{
    private const int DefaultAdPort = 5050;

    // Cached after first successful probe; null = not yet resolved / unreachable
    private volatile string? _resolvedUrl;
    private readonly SemaphoreSlim _discoverLock = new(1, 1);

    public bool IsConfigured => settings.AdHttpUrl != null || supervisor.IsAvailable;

    // ── Public API ────────────────────────────────────────────────────────────

    public Task<(bool Success, string? Error)> RestartAppAsync(string appName) =>
        CallAppServiceAsync("restart", appName);

    public Task<(bool Success, string? Error)> StartAppAsync(string appName) =>
        CallAppServiceAsync("start", appName);

    public Task<(bool Success, string? Error)> StopAppAsync(string appName) =>
        CallAppServiceAsync("stop", appName);

    public Task<(bool Success, string? Error)> ReloadAppsAsync() =>
        CallAppServiceAsync("reload", appName: null);

    public async Task<AppRuntimeStatus> GetAppStatusAsync(string appName)
    {
        if (!IsConfigured)
            return new AppRuntimeStatus(Available: false, State: null,
                Error: "AppDaemon HTTP API is not configured");

        var url = await ResolveUrlAsync();
        if (url == null)
            return new AppRuntimeStatus(Available: false, State: null,
                Error: "Could not reach AppDaemon HTTP API");

        try
        {
            using var client = CreateAdClient();
            var resp = await client.GetAsync($"{url}/api/appdaemon/state/admin/{appName}");

            if (resp.StatusCode == HttpStatusCode.NotFound)
                return new AppRuntimeStatus(Available: true, State: "unknown");

            if (!resp.IsSuccessStatusCode)
                return new AppRuntimeStatus(Available: true, State: null,
                    Error: $"AppDaemon returned {(int)resp.StatusCode}");

            using var doc = await System.Text.Json.JsonDocument.ParseAsync(
                await resp.Content.ReadAsStreamAsync());

            // Response shape: {"state": {"state": "running", "attributes": {...}}}
            string? state = null;
            if (doc.RootElement.TryGetProperty("state", out var outer))
            {
                if (outer.ValueKind == System.Text.Json.JsonValueKind.Object &&
                    outer.TryGetProperty("state", out var inner))
                    state = inner.GetString();
                else if (outer.ValueKind == System.Text.Json.JsonValueKind.String)
                    state = outer.GetString();
            }

            return new AppRuntimeStatus(Available: true, State: state);
        }
        catch (TaskCanceledException)
        {
            return new AppRuntimeStatus(Available: false, State: null,
                Error: "Timeout contacting AppDaemon HTTP API");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error getting runtime status for {AppName}", appName);
            return new AppRuntimeStatus(Available: false, State: null, Error: ex.Message);
        }
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private async Task<(bool Success, string? Error)> CallAppServiceAsync(string action, string? appName)
    {
        var url = await ResolveUrlAsync();
        if (url == null)
            return (false,
                "Could not find AppDaemon HTTP API. " +
                "Ensure the HTTP API is enabled in appdaemon.yaml (api_port: 5050).");

        try
        {
            using var client = CreateAdClient();
            var body = appName != null
                ? JsonContent.Create(new { app = appName })
                : JsonContent.Create(new { });
            var resp = await client.PostAsync(
                $"{url}/api/appdaemon/service/admin/app/{action}", body);

            if (resp.IsSuccessStatusCode) return (true, null);

            var responseBody = await resp.Content.ReadAsStringAsync();
            return (false, $"AppDaemon returned {(int)resp.StatusCode}: {responseBody}");
        }
        catch (TaskCanceledException)
        {
            return (false, "Timeout contacting AppDaemon HTTP API");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling app/{Action} for {AppName}", action, appName ?? "(all)");
            return (false, ex.Message);
        }
    }

    // ── URL resolution ────────────────────────────────────────────────────────

    private async Task<string?> ResolveUrlAsync()
    {
        // 1. Manual override always wins
        if (settings.AdHttpUrl is { } manual) return manual.TrimEnd('/');

        // 2. Already discovered
        if (_resolvedUrl != null) return _resolvedUrl;

        // 3. Auto-discover via supervisor
        if (!supervisor.IsAvailable) return null;

        await _discoverLock.WaitAsync();
        try
        {
            if (_resolvedUrl != null) return _resolvedUrl;

            _resolvedUrl = await DiscoverUrlAsync();
            if (_resolvedUrl != null)
                logger.LogInformation("Auto-discovered AppDaemon HTTP API at {Url}", _resolvedUrl);
            else
                logger.LogWarning("Could not auto-discover AppDaemon HTTP API");

            return _resolvedUrl;
        }
        finally { _discoverLock.Release(); }
    }

    private async Task<string?> DiscoverUrlAsync()
    {
        var slug = await supervisor.FindAddonSlugAsync();
        if (slug == null) return null;

        var info = await supervisor.GetAddonInfoAsync(slug);
        if (info is not { } data) return null;

        var hostname = data.TryGetProperty("hostname", out var h) ? h.GetString() : null;
        if (string.IsNullOrEmpty(hostname)) return null;

        var candidate = $"http://{hostname}:{DefaultAdPort}";
        return await ProbeAsync(candidate) ? candidate : null;
    }

    private async Task<bool> ProbeAsync(string baseUrl)
    {
        try
        {
            using var client = CreateAdClient();
            client.Timeout = TimeSpan.FromSeconds(3);
            var resp = await client.GetAsync($"{baseUrl}/api/appdaemon");
            // 200 = open API, 401 = password required — both confirm the API is reachable
            return resp.IsSuccessStatusCode || resp.StatusCode == HttpStatusCode.Unauthorized;
        }
        catch { return false; }
    }

    private HttpClient CreateAdClient()
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        if (settings.AdHttpToken != null)
            client.DefaultRequestHeaders.Add("x-ad-access", settings.AdHttpToken);
        return client;
    }
}

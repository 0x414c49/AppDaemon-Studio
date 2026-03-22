using System.Text.Json;
using AppDaemonStudio.Configuration;

namespace AppDaemonStudio.Services;

public class AppDaemonApiService(
    AppSettings settings,
    IHttpClientFactory httpClientFactory,
    ILogger<AppDaemonApiService> logger) : IAppDaemonApiService
{
    private const int DefaultAdPort = 5050;

    // Cached after first successful discovery; null = not yet discovered / not available
    private volatile string? _resolvedUrl;
    private readonly SemaphoreSlim _discoverLock = new(1, 1);

    // True when a manual URL is set, or when we're in addon mode (supervisor present)
    // and auto-discovery is possible. The restart button shows; errors surface on use.
    public bool IsConfigured =>
        settings.AdHttpUrl != null || settings.SupervisorToken != null;

    public async Task<(bool Success, string? Error)> RestartAppAsync(string appName)
    {
        var url = await ResolveUrlAsync();
        if (url == null)
            return (false, "Could not find AppDaemon HTTP API. Ensure the HTTP API is enabled in appdaemon.yaml and APPDAEMON_HTTP_URL is set if using a non-default port.");

        try
        {
            using var client = CreateClient();
            var resp = await client.PostAsync($"{url}/AD/apps/{appName}", content: null);
            if (resp.IsSuccessStatusCode) return (true, null);
            var body = await resp.Content.ReadAsStringAsync();
            return (false, $"AppDaemon returned {(int)resp.StatusCode}: {body}");
        }
        catch (TaskCanceledException)
        {
            return (false, "Timeout contacting AppDaemon HTTP API");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error restarting app {AppName} via AppDaemon API", appName);
            return (false, ex.Message);
        }
    }

    // ── URL resolution ────────────────────────────────────────────────────────

    private async Task<string?> ResolveUrlAsync()
    {
        // 1. Manual override always wins
        if (settings.AdHttpUrl is { } manual)
            return manual.TrimEnd('/');

        // 2. Already discovered
        if (_resolvedUrl != null)
            return _resolvedUrl;

        // 3. Auto-discover via supervisor (addon mode only)
        if (settings.SupervisorToken == null)
            return null;

        await _discoverLock.WaitAsync();
        try
        {
            if (_resolvedUrl != null) return _resolvedUrl; // double-check after lock

            _resolvedUrl = await DiscoverViaAddonInfoAsync(settings.SupervisorToken);
            if (_resolvedUrl != null)
                logger.LogInformation("Auto-discovered AppDaemon HTTP API at {Url}", _resolvedUrl);
            else
                logger.LogWarning("Could not auto-discover AppDaemon HTTP API");

            return _resolvedUrl;
        }
        finally
        {
            _discoverLock.Release();
        }
    }

    private async Task<string?> DiscoverViaAddonInfoAsync(string supervisorToken)
    {
        try
        {
            var slug = settings.AddonSlug ?? await FindAddonSlugAsync(supervisorToken);
            if (slug == null) return null;

            using var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supervisorToken}");

            var resp = await client.GetAsync($"http://supervisor/addons/{slug}/info");
            if (!resp.IsSuccessStatusCode) return null;

            using var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync());

            // Supervisor wraps the actual payload in a "data" envelope
            var root = doc.RootElement;
            if (root.TryGetProperty("data", out var data))
                root = data;

            if (!root.TryGetProperty("hostname", out var hostnameEl)) return null;
            var hostname = hostnameEl.GetString();
            if (string.IsNullOrEmpty(hostname)) return null;

            var candidate = $"http://{hostname}:{DefaultAdPort}";

            // Probe the candidate URL — AD returns 200/401 on the root, not a connection error
            if (await ProbeAsync(candidate))
                return candidate;

            return null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error during AppDaemon API auto-discovery");
            return null;
        }
    }

    private async Task<bool> ProbeAsync(string baseUrl)
    {
        try
        {
            using var client = CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);
            var resp = await client.GetAsync($"{baseUrl}/AD/state");
            // 200 = open API, 401 = token required — both mean the API is reachable
            return resp.IsSuccessStatusCode || resp.StatusCode == System.Net.HttpStatusCode.Unauthorized;
        }
        catch { return false; }
    }

    private async Task<string?> FindAddonSlugAsync(string supervisorToken)
    {
        try
        {
            using var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supervisorToken}");

            var resp = await client.GetAsync("http://supervisor/addons");
            if (!resp.IsSuccessStatusCode) return null;

            using var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync());
            var root = doc.RootElement;

            JsonElement addonsEl;
            if (!root.TryGetProperty("addons", out addonsEl))
                if (!root.TryGetProperty("data", out var data) || !data.TryGetProperty("addons", out addonsEl))
                    return null;

            foreach (var addon in addonsEl.EnumerateArray())
            {
                var name = addon.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var slug = addon.TryGetProperty("slug", out var s) ? s.GetString() ?? "" : "";
                if (name.Contains("appdaemon", StringComparison.OrdinalIgnoreCase) ||
                    slug.Contains("appdaemon", StringComparison.OrdinalIgnoreCase))
                    return slug;
            }
        }
        catch (Exception ex) { logger.LogWarning(ex, "Error finding AppDaemon addon slug"); }
        return null;
    }

    private HttpClient CreateClient()
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        if (settings.AdHttpToken != null)
            client.DefaultRequestHeaders.Add("x-ad-access", settings.AdHttpToken);
        return client;
    }
}

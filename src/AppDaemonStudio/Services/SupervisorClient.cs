using System.Text.Json;
using AppDaemonStudio.Configuration;

namespace AppDaemonStudio.Services;

public sealed class SupervisorClient(
    AppSettings settings,
    IHttpClientFactory httpClientFactory,
    ILogger<SupervisorClient> logger) : ISupervisorClient
{
    private const string Base = "http://supervisor/";

    private volatile string? _cachedSlug;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public bool IsAvailable => settings.SupervisorToken != null;

    // ── Slug discovery ────────────────────────────────────────────────────────

    public async Task<string?> FindAddonSlugAsync(CancellationToken ct = default)
    {
        // Manual override always wins
        if (settings.AddonSlug is { } configured) return configured;
        if (_cachedSlug != null) return _cachedSlug;
        if (!IsAvailable) return null;

        await _lock.WaitAsync(ct);
        try
        {
            if (_cachedSlug != null) return _cachedSlug; // double-check after lock
            _cachedSlug = await DiscoverSlugAsync(ct);
            if (_cachedSlug != null)
                logger.LogInformation("Auto-discovered AppDaemon addon slug: {Slug}", _cachedSlug);
            else
                logger.LogWarning("Could not auto-discover AppDaemon addon slug");
            return _cachedSlug;
        }
        finally { _lock.Release(); }
    }

    // ── Addon info ────────────────────────────────────────────────────────────

    public async Task<JsonElement?> GetAddonInfoAsync(string slug, CancellationToken ct = default)
    {
        if (!IsAvailable) return null;
        try
        {
            using var client = CreateClient();
            var resp = await client.GetAsync($"addons/{slug}/info", ct);
            if (!resp.IsSuccessStatusCode) return null;

            using var doc = await JsonDocument.ParseAsync(
                await resp.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

            var root = doc.RootElement;
            // Supervisor wraps payload in {"data": {...}}
            return (root.TryGetProperty("data", out var data) ? data : root).Clone();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error fetching addon info for {Slug}", slug);
            return null;
        }
    }

    // ── Logs ──────────────────────────────────────────────────────────────────

    public async Task<string?> GetAddonLogsRawAsync(string slug, CancellationToken ct = default)
    {
        if (!IsAvailable) return null;
        try
        {
            using var client = CreateClient();
            client.DefaultRequestHeaders.Accept
                .Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("text/plain"));
            var resp = await client.GetAsync($"addons/{slug}/logs", ct);
            if (!resp.IsSuccessStatusCode)
            {
                logger.LogWarning("Supervisor returned {Status} fetching logs for {Slug}", resp.StatusCode, slug);
                return null;
            }
            return await resp.Content.ReadAsStringAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error fetching logs for {Slug}", slug);
            return null;
        }
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private async Task<string?> DiscoverSlugAsync(CancellationToken ct)
    {
        try
        {
            using var client = CreateClient();
            var resp = await client.GetAsync("addons", ct);
            if (!resp.IsSuccessStatusCode) return null;

            using var doc = await JsonDocument.ParseAsync(
                await resp.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

            var root = doc.RootElement;
            if (!root.TryGetProperty("addons", out var addons) &&
                (!root.TryGetProperty("data", out var data) || !data.TryGetProperty("addons", out addons)))
                return null;

            foreach (var addon in addons.EnumerateArray())
            {
                var name = addon.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var slug = addon.TryGetProperty("slug", out var s) ? s.GetString() ?? "" : "";
                if (name.Contains("appdaemon", StringComparison.OrdinalIgnoreCase) ||
                    slug.Contains("appdaemon", StringComparison.OrdinalIgnoreCase))
                    return slug;
            }
        }
        catch (Exception ex) { logger.LogWarning(ex, "Error listing addons from supervisor"); }
        return null;
    }

    private HttpClient CreateClient()
    {
        var client = httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(Base);
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {settings.SupervisorToken}");
        return client;
    }
}

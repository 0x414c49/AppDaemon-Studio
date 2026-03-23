using System.Reflection;
using System.Text.Json;

namespace AppDaemonStudio.Configuration;

public class AppSettings
{
    // ── HA addon options (/data/options.json) with env-var fallback ───────────
    // In addon mode HA writes options.json; env vars work for standalone/dev.

    private static readonly Lazy<Dictionary<string, JsonElement>> _options = new(() =>
    {
        const string path = "/data/options.json";
        if (!File.Exists(path)) return [];
        try
        {
            using var doc = JsonDocument.Parse(File.ReadAllText(path));
            return doc.RootElement.EnumerateObject()
                .ToDictionary(p => p.Name, p => p.Value.Clone());
        }
        catch { return []; }
    });

    private static string? Opt(string key) =>
        _options.Value.TryGetValue(key, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString()
            : null;

    private static string? Get(string optKey, string envKey) =>
        Opt(optKey) ?? Environment.GetEnvironmentVariable(envKey);

    // ── Paths ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// AppDaemon apps directory (contains *.py files and apps.yaml).
    /// Set via the addon "apps_folder" option or the APPS_DIR env var.
    /// Defaults to /config/apps (standard HA AppDaemon setup with config volume).
    /// </summary>
    public string AppsDir => Get("apps_folder", "APPS_DIR") ?? "/config/apps";

    public string AppsYaml => Path.Combine(AppsDir, "apps.yaml");
    public string VersionsDir => Path.Combine(AppsDir, ".versions");

    // ── Supervisor / HA ───────────────────────────────────────────────────────

    /// <summary>HA Supervisor token (injected automatically in addon mode).</summary>
    public string? SupervisorToken =>
        Environment.GetEnvironmentVariable("SUPERVISOR_TOKEN") ??
        Environment.GetEnvironmentVariable("HASSIO_TOKEN");

    public string? HaUrl => Environment.GetEnvironmentVariable("HA_URL");
    public string? HaToken => Environment.GetEnvironmentVariable("HA_TOKEN");

    /// <summary>AppDaemon addon slug. Resolved automatically if not set.</summary>
    public string? AddonSlug => Get("appdaemon_addon_slug", "APPDAEMON_ADDON_SLUG");

    // ── AppDaemon HTTP API ────────────────────────────────────────────────────

    /// <summary>AppDaemon HTTP API base URL. Auto-discovered in addon mode if not set.</summary>
    public string? AdHttpUrl => Environment.GetEnvironmentVariable("APPDAEMON_HTTP_URL");

    /// <summary>
    /// AppDaemon HTTP API password (api_password in appdaemon.yaml).
    /// Leave blank if the API has no password (default).
    /// Set via the addon "api_password" option or APPDAEMON_HTTP_TOKEN env var.
    /// </summary>
    public string? AdHttpToken =>
        Get("api_password", "APPDAEMON_HTTP_TOKEN") is { Length: > 0 } t ? t : null;

    // ── Misc ──────────────────────────────────────────────────────────────────

    public string Version
    {
        get
        {
            var v = typeof(AppSettings).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
                ?.InformationalVersion ?? "unknown";
            var plus = v.IndexOf('+');
            return plus > 0 ? v[..plus] : v;
        }
    }
}

using System.Reflection;

namespace AppDaemonStudio.Configuration;

public class AppSettings
{
    /// <summary>Root config directory. Defaults to /config. Apps live at {AppsDir}/apps/</summary>
    public string ConfigDir => Environment.GetEnvironmentVariable("APPS_DIR") ?? "/config";

    public string AppsDir => Path.Combine(ConfigDir, "apps");
    public string AppsYaml => Path.Combine(AppsDir, "apps.yaml");
    public string VersionsDir => Path.Combine(AppsDir, ".versions");

    /// <summary>HA Supervisor token (addon mode). Checks SUPERVISOR_TOKEN then HASSIO_TOKEN.</summary>
    public string? SupervisorToken =>
        Environment.GetEnvironmentVariable("SUPERVISOR_TOKEN") ??
        Environment.GetEnvironmentVariable("HASSIO_TOKEN");

    public string? HaUrl => Environment.GetEnvironmentVariable("HA_URL");
    public string? HaToken => Environment.GetEnvironmentVariable("HA_TOKEN");
    public string? AddonSlug => Environment.GetEnvironmentVariable("APPDAEMON_ADDON_SLUG");
    public string? LogFilePath => Environment.GetEnvironmentVariable("APPDAEMON_LOG_FILE");
    public string Version
    {
        get
        {
            var v = typeof(AppSettings).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
                ?.InformationalVersion ?? "unknown";
            // Strip the +<commithash> build metadata that .NET appends automatically
            var plus = v.IndexOf('+');
            return plus > 0 ? v[..plus] : v;
        }
    }
}

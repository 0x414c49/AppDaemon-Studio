using System.Text.Json;

namespace AppDaemonStudio.Services;

/// <summary>
/// Abstracts all HTTP calls to the HA Supervisor API.
/// Singleton — caches the auto-discovered AppDaemon addon slug.
/// </summary>
public interface ISupervisorClient
{
    /// <summary>True when SUPERVISOR_TOKEN / HASSIO_TOKEN is available.</summary>
    bool IsAvailable { get; }

    /// <summary>
    /// Returns the AppDaemon addon slug, using the configured override first,
    /// then auto-discovering via the Supervisor addon list (result cached).
    /// </summary>
    Task<string?> FindAddonSlugAsync(CancellationToken ct = default);

    /// <summary>
    /// Returns the "data" section of GET /addons/{slug}/info, or null on failure.
    /// </summary>
    Task<JsonElement?> GetAddonInfoAsync(string slug, CancellationToken ct = default);

    /// <summary>
    /// Returns the raw log text from GET /addons/{slug}/logs, or null on failure.
    /// </summary>
    Task<string?> GetAddonLogsRawAsync(string slug, CancellationToken ct = default);
}

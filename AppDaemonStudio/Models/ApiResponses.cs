namespace AppDaemonStudio.Models;

// ── Error shapes ───────────────────────────────────────────────────────────────
public record ErrorResponse(string Detail);
public record LogsErrorResponse(string Error);

// ── Generic success ───────────────────────────────────────────────────────────
public record SuccessResponse(bool Success, string Message);

// ── Apps ──────────────────────────────────────────────────────────────────────
public record AppListResponse(List<AppInfo> Apps, int Count);

// ── Versions ──────────────────────────────────────────────────────────────────
public record VersionListResponse(List<VersionInfo> Versions, int Count);

// ── Entities ──────────────────────────────────────────────────────────────────
public record EntityListResponse(
    List<HaEntity> Entities,
    SortedDictionary<string, List<HaEntity>> Grouped,
    int Count,
    string[] Domains,
    string Timestamp,
    bool Available,
    string? Error = null);

// ── Logs ──────────────────────────────────────────────────────────────────────
public record LogsResponse(List<LogEntry> Logs);

// ── Health ────────────────────────────────────────────────────────────────────
public record HealthResponse(
    string Status,
    string Timestamp,
    string Version,
    bool HaConfigured);

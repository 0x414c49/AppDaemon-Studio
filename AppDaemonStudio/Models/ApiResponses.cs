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
public record EnvironmentInfo(
    bool HasSupervisorToken,
    bool HasHassioToken,
    string SupervisorTokenSource,
    string DotnetEnv,
    string? Hostname,
    List<string> AllEnvVars);

public record RequestHeadersInfo(
    bool HasXIngressPath,
    bool HasXRemoteUser,
    bool HasXHassUserId,
    bool HasAuthorization,
    string ContentType,
    string UserAgent);

public record HealthResponse(
    string Status,
    string Timestamp,
    string Version,
    EnvironmentInfo Environment,
    RequestHeadersInfo RequestHeaders);

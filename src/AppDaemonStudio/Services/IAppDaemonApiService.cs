using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public interface IAppDaemonApiService
{
    bool IsConfigured { get; }
    Task<(bool Success, string? Error)> RestartAppAsync(string appName);
    Task<(bool Success, string? Error)> StartAppAsync(string appName);
    Task<(bool Success, string? Error)> StopAppAsync(string appName);
    Task<(bool Success, string? Error)> ReloadAppsAsync();
    Task<AppRuntimeStatus> GetAppStatusAsync(string appName);
}

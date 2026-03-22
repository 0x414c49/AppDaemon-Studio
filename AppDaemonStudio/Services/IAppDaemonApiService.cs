namespace AppDaemonStudio.Services;

public interface IAppDaemonApiService
{
    bool IsConfigured { get; }
    Task<(bool Success, string? Error)> RestartAppAsync(string appName);
}

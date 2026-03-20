using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public interface IFileManagerService
{
    Task<List<AppInfo>> ListAppsAsync();
    Task<AppInfo> CreateAppAsync(CreateAppRequest request);
    Task DeleteAppAsync(string name);
    Task<FileContent> ReadPythonFileAsync(string appName);
    Task WritePythonFileAsync(string appName, string content);
    Task<FileContent> ReadAppsYamlAsync();
    Task WriteAppsYamlAsync(string content);
}

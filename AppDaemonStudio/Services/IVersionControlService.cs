using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public interface IVersionControlService
{
    Task<string> CreateVersionAsync(string appName, string content);
    Task<List<VersionInfo>> ListVersionsAsync(string appName);
    Task<FileContent> GetVersionAsync(string appName, string version);
    Task<FileContent> RestoreVersionAsync(string appName, string version);
    Task DeleteVersionAsync(string appName, string version);
}

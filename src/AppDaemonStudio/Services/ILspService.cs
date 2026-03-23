using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public interface ILspService
{
    bool IsReady { get; }
    int Port { get; }
    PackageSyncStatus? SyncStatus { get; }
}

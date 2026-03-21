namespace AppDaemonStudio.Services;

public interface ILspService
{
    bool IsReady { get; }
    int Port { get; }
}

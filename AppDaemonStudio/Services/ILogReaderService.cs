using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public interface ILogReaderService
{
    List<LogEntry> ParseLogs(string raw);
}

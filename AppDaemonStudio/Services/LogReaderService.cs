using System.Text.RegularExpressions;
using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public partial class LogReaderService : ILogReaderService
{
    [GeneratedRegex(@"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+) (INFO|WARNING) (\w+): (.*)$")]
    private static partial Regex InfoWarningRegex();

    [GeneratedRegex(@"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+) ERROR Error: (.*)$")]
    private static partial Regex ErrorRegex();

    [GeneratedRegex(@"\x1B\[[0-9;]*[mK]")]
    private static partial Regex AnsiRegex();

    public List<LogEntry> ParseLogs(string raw)
    {
        var entries = new List<LogEntry>();
        var span = raw.AsSpan();
        while (!span.IsEmpty)
        {
            int nl = span.IndexOf('\n');
            var lineSpan = nl >= 0 ? span[..nl] : span;
            span = nl >= 0 ? span[(nl + 1)..] : ReadOnlySpan<char>.Empty;

            var line = lineSpan.ToString();
            var entry = ParseLine(AnsiRegex().Replace(line, ""));
            if (entry != null) entries.Add(entry);
        }
        return entries;
    }

    private static LogEntry? ParseLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line)) return null;

        var infoMatch = InfoWarningRegex().Match(line);
        if (infoMatch.Success)
        {
            return new LogEntry(
                Raw: line,
                Timestamp: infoMatch.Groups[1].Value,
                Level: infoMatch.Groups[2].Value,
                Source: infoMatch.Groups[3].Value,
                Message: infoMatch.Groups[4].Value
            );
        }

        var errorMatch = ErrorRegex().Match(line);
        if (errorMatch.Success)
        {
            return new LogEntry(
                Raw: line,
                Timestamp: errorMatch.Groups[1].Value,
                Level: "ERROR",
                Source: "Error",
                Message: errorMatch.Groups[2].Value
            );
        }

        return null;
    }
}

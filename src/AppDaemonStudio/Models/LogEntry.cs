namespace AppDaemonStudio.Models;

public record LogEntry(string Raw, string Timestamp, string Level, string Source, string Message);

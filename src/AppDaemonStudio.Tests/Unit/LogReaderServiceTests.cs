using AppDaemonStudio.Services;
using Xunit;

namespace AppDaemonStudio.Tests.Unit;

public class LogReaderServiceTests
{
    private readonly LogReaderService _sut = new();

    [Fact]
    public void ParseLogs_EmptyString_ReturnsEmpty()
    {
        var result = _sut.ParseLogs("");
        Assert.Empty(result);
    }

    [Fact]
    public void ParseLogs_WhitespaceOnly_ReturnsEmpty()
    {
        var result = _sut.ParseLogs("   \n\n\t\n");
        Assert.Empty(result);
    }

    [Fact]
    public void ParseLogs_InfoLine_ParsedCorrectly()
    {
        const string line = "2024-01-15 10:30:00.123 INFO my_app: Hello world";
        var result = _sut.ParseLogs(line);
        var entry = Assert.Single(result);
        Assert.Equal("2024-01-15 10:30:00.123", entry.Timestamp);
        Assert.Equal("INFO", entry.Level);
        Assert.Equal("my_app", entry.Source);
        Assert.Equal("Hello world", entry.Message);
        Assert.Equal(line, entry.Raw);
    }

    [Fact]
    public void ParseLogs_WarningLine_ParsedCorrectly()
    {
        const string line = "2024-01-15 10:30:00.456 WARNING scheduler: Callback overdue";
        var result = _sut.ParseLogs(line);
        var entry = Assert.Single(result);
        Assert.Equal("WARNING", entry.Level);
        Assert.Equal("scheduler", entry.Source);
        Assert.Equal("Callback overdue", entry.Message);
    }

    [Fact]
    public void ParseLogs_ErrorLine_ParsedCorrectly()
    {
        const string line = "2024-01-15 10:30:00.789 ERROR Error: Something broke";
        var result = _sut.ParseLogs(line);
        var entry = Assert.Single(result);
        Assert.Equal("ERROR", entry.Level);
        Assert.Equal("Error", entry.Source);
        Assert.Equal("Something broke", entry.Message);
    }

    [Fact]
    public void ParseLogs_UnrecognizedLine_Ignored()
    {
        var result = _sut.ParseLogs("some random garbage line");
        Assert.Empty(result);
    }

    [Fact]
    public void ParseLogs_AnsiEscapeCodes_StrippedBeforeParsing()
    {
        const string line = "\x1B[32m2024-01-15 10:30:00.123 INFO my_app: Green text\x1B[0m";
        var result = _sut.ParseLogs(line);
        var entry = Assert.Single(result);
        Assert.Equal("INFO", entry.Level);
        Assert.Equal("my_app", entry.Source);
        Assert.Equal("Green text", entry.Message);
    }

    [Fact]
    public void ParseLogs_MultipleLines_AllParsed()
    {
        const string raw = """
            2024-01-15 10:30:00.100 INFO app_a: Message A
            2024-01-15 10:30:00.200 WARNING app_b: Message B
            2024-01-15 10:30:00.300 ERROR Error: Message C
            """;
        var result = _sut.ParseLogs(raw);
        Assert.Equal(3, result.Count);
        Assert.Equal("INFO", result[0].Level);
        Assert.Equal("WARNING", result[1].Level);
        Assert.Equal("ERROR", result[2].Level);
    }

    [Fact]
    public void ParseLogs_BlankLinesBetweenEntries_BlankLinesIgnored()
    {
        const string raw = "2024-01-15 10:30:00.100 INFO app: Msg\n\n\n2024-01-15 10:30:00.200 INFO app: Msg2";
        var result = _sut.ParseLogs(raw);
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void ParseLogs_WindowsLineEndings_Handled()
    {
        const string raw = "2024-01-15 10:30:00.100 INFO app: Msg\r\n2024-01-15 10:30:00.200 INFO app: Msg2";
        var result = _sut.ParseLogs(raw);
        Assert.Equal(2, result.Count);
        Assert.Equal("Msg", result[0].Message);
        Assert.Equal("Msg2", result[1].Message);
    }

    [Fact]
    public void ParseLogs_InfoLineWithColonInMessage_MessagePreserved()
    {
        const string line = "2024-01-15 10:30:00.000 INFO app: key: value: extra";
        var result = _sut.ParseLogs(line);
        var entry = Assert.Single(result);
        Assert.Equal("key: value: extra", entry.Message);
    }

    [Fact]
    public void ParseLogs_RealFormatWithMicroseconds_ParsedCorrectly()
    {
        const string line = "2026-03-21 10:26:58.036625 INFO solar_raw_data: solar_data.json updated";
        var result = _sut.ParseLogs(line);
        var entry = Assert.Single(result);
        Assert.Equal("2026-03-21 10:26:58.036625", entry.Timestamp);
        Assert.Equal("INFO", entry.Level);
        Assert.Equal("solar_raw_data", entry.Source);
        Assert.Equal("solar_data.json updated", entry.Message);
    }

    [Fact]
    public void ParseLogs_S6RcLines_AreIgnored()
    {
        const string raw = "s6-rc: info: service legacy-services: stopping\ns6-rc: info: service appdaemon: stopping";
        var result = _sut.ParseLogs(raw);
        Assert.Empty(result);
    }

    [Fact]
    public void ParseLogs_BannerLines_AreIgnored()
    {
        const string raw = "-----------------------------------------------------------\n App: AppDaemon\n-----------------------------------------------------------";
        var result = _sut.ParseLogs(raw);
        Assert.Empty(result);
    }

    [Fact]
    public void ParseLogs_HassWarningFormat_Parsed()
    {
        const string line = "2026-03-22 06:24:29.863914 WARNING HASS: Error with websocket result: unknown_error: Cannot connect";
        var result = _sut.ParseLogs(line);
        var entry = Assert.Single(result);
        Assert.Equal("WARNING", entry.Level);
        Assert.Equal("HASS", entry.Source);
        Assert.Contains("Cannot connect", entry.Message);
    }

    [Fact]
    public void ParseLogs_ShortTimestampDecimal_Parsed()
    {
        // Some AD log lines have only 3 decimal places
        const string line = "2026-03-23 08:10:18.225 INFO AppDaemon: 172.30.33.1 [23/Mar/2026:08:10:18 +0100] \"GET /api/appdaemon HTTP/1.1\" 200 191";
        var result = _sut.ParseLogs(line);
        var entry = Assert.Single(result);
        Assert.Equal("INFO", entry.Level);
        Assert.Equal("AppDaemon", entry.Source);
    }
}

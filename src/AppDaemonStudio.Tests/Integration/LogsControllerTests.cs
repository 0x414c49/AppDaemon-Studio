using System.Net;
using System.Text.Json;
using NSubstitute;
using Xunit;

namespace AppDaemonStudio.Tests.Integration;

public sealed class LogsControllerTests : IAsyncDisposable
{
    private readonly TestWebAppFactory _factory = new();

    private const string SampleLogs =
        "2024-01-15 10:30:00.123 INFO my_app: Hello\n" +
        "2024-01-15 10:30:01.000 WARNING sched: Overdue\n";

    // ── GET /api/appdaemon-logs ───────────────────────────────────────────────

    [Fact]
    public async Task GetLogs_SupervisorNotAvailable_Returns503()
    {
        _factory.Supervisor.IsAvailable.Returns(false);

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/appdaemon-logs");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task GetLogs_SlugNotFound_Returns404()
    {
        _factory.Supervisor.IsAvailable.Returns(true);
        _factory.Supervisor.FindAddonSlugAsync(Arg.Any<CancellationToken>())
            .Returns((string?)null);

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/appdaemon-logs");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetLogs_LogsFetchFails_Returns502()
    {
        _factory.Supervisor.IsAvailable.Returns(true);
        _factory.Supervisor.FindAddonSlugAsync(Arg.Any<CancellationToken>())
            .Returns("appdaemon");
        _factory.Supervisor.GetAddonLogsRawAsync("appdaemon", Arg.Any<CancellationToken>())
            .Returns((string?)null);

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/appdaemon-logs");

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task GetLogs_HappyPath_ReturnsParsedEntries()
    {
        _factory.Supervisor.IsAvailable.Returns(true);
        _factory.Supervisor.FindAddonSlugAsync(Arg.Any<CancellationToken>())
            .Returns("appdaemon");
        _factory.Supervisor.GetAddonLogsRawAsync("appdaemon", Arg.Any<CancellationToken>())
            .Returns(SampleLogs);

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/appdaemon-logs");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var logs = json.RootElement.GetProperty("logs").EnumerateArray().ToList();
        Assert.Equal(2, logs.Count);
        Assert.Equal("INFO", logs[0].GetProperty("level").GetString());
        Assert.Equal("WARNING", logs[1].GetProperty("level").GetString());
    }

    [Fact]
    public async Task GetLogs_SlugOverrideParam_UsesOverride()
    {
        _factory.Supervisor.IsAvailable.Returns(true);
        _factory.Supervisor.GetAddonLogsRawAsync("custom_slug", Arg.Any<CancellationToken>())
            .Returns(SampleLogs);

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/appdaemon-logs?slug=custom_slug");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        // Verify FindAddonSlugAsync was NOT called (slug was provided directly)
        await _factory.Supervisor.DidNotReceive().FindAddonSlugAsync(Arg.Any<CancellationToken>());
    }

    public ValueTask DisposeAsync() => _factory.DisposeAsync();
}

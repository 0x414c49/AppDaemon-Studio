using System.Net;
using System.Text.Json;
using AppDaemonStudio.Services;
using NSubstitute;
using Xunit;

namespace AppDaemonStudio.Tests.Integration;

public sealed class HealthControllerTests : IAsyncDisposable
{
    private readonly TestWebAppFactory _factory = new();

    [Fact]
    public async Task GetHealth_Returns200WithExpectedShape()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("ok", json.RootElement.GetProperty("status").GetString());
        Assert.True(json.RootElement.TryGetProperty("version", out _));
        Assert.True(json.RootElement.TryGetProperty("timestamp", out _));
        Assert.True(json.RootElement.TryGetProperty("lsp_ready", out _));
        Assert.True(json.RootElement.TryGetProperty("ad_api_configured", out _));
    }

    [Fact]
    public async Task GetHealth_LspNotReady_LspReadyFalse()
    {
        _factory.LspService.IsReady.Returns(false);

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/health");
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Assert.False(json.RootElement.GetProperty("lsp_ready").GetBoolean());
    }

    [Fact]
    public async Task GetHealth_AdApiConfigured_ReflectedInResponse()
    {
        _factory.AdApi.IsConfigured.Returns(true);

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/health");
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Assert.True(json.RootElement.GetProperty("ad_api_configured").GetBoolean());
    }

    public async ValueTask DisposeAsync() => await _factory.DisposeAsync();
}

using System.Net;
using System.Text.Json;
using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using NSubstitute;
using Xunit;

namespace AppDaemonStudio.Tests.Integration;

public sealed class EntitiesControllerTests : IAsyncDisposable
{
    private readonly TestWebAppFactory _factory = new();

    private static HaEntity Entity(string id) =>
        new(id, "on", JsonDocument.Parse("{}").RootElement, "", "");

    [Fact]
    public async Task GetEntities_HaAvailable_Returns200WithGrouped()
    {
        _factory.HaService.FetchEntitiesAsync().Returns(new HaFetchResult(
            [Entity("light.kitchen"), Entity("switch.fan"), Entity("light.lamp")],
            Available: true));

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/entities");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.GetProperty("available").GetBoolean());
        Assert.Equal(3, json.RootElement.GetProperty("count").GetInt32());
        // grouped by domain
        Assert.True(json.RootElement.GetProperty("grouped").TryGetProperty("light", out _));
        Assert.True(json.RootElement.GetProperty("grouped").TryGetProperty("switch", out _));
    }

    [Fact]
    public async Task GetEntities_HaUnavailable_Returns200WithAvailableFalse()
    {
        _factory.HaService.FetchEntitiesAsync().Returns(new HaFetchResult(
            [],
            Available: false,
            Error: "No credentials configured"));

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/entities");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.False(json.RootElement.GetProperty("available").GetBoolean());
        Assert.Equal(0, json.RootElement.GetProperty("count").GetInt32());
        Assert.Equal("No credentials configured", json.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task GetEntities_DomainsAreSorted()
    {
        _factory.HaService.FetchEntitiesAsync().Returns(new HaFetchResult(
            [Entity("switch.x"), Entity("binary_sensor.y"), Entity("light.z")],
            Available: true));

        var client = _factory.CreateClient();
        var response = await client.GetAsync("api/entities");
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        var domains = json.RootElement.GetProperty("domains").EnumerateArray()
            .Select(d => d.GetString()).ToList();

        Assert.Equal(["binary_sensor", "light", "switch"], domains);
    }

    public async ValueTask DisposeAsync() => await _factory.DisposeAsync();
}

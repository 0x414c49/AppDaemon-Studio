using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using NSubstitute;
using Xunit;

namespace AppDaemonStudio.Tests.Integration;

public sealed class AppsControllerTests : IAsyncDisposable
{
    private readonly TestWebAppFactory _factory = new();
    private readonly HttpClient _client;

    public AppsControllerTests()
    {
        _client = _factory.CreateClient();
    }

    // ── GET /api/apps ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetApps_EmptyDir_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("api/apps");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(0, json.RootElement.GetProperty("count").GetInt32());
        Assert.Empty(json.RootElement.GetProperty("apps").EnumerateArray());
    }

    [Fact]
    public async Task GetApps_AfterCreate_ReturnsApp()
    {
        await _client.PostAsJsonAsync("api/apps",
            new { name = "list_app", class_name = "ListApp", description = "", icon = "" });

        var response = await _client.GetAsync("api/apps");
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(1, json.RootElement.GetProperty("count").GetInt32());
    }

    // ── POST /api/apps ────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateApp_ValidRequest_Returns201()
    {
        var response = await _client.PostAsJsonAsync("api/apps",
            new { name = "new_app", class_name = "NewApp", description = "desc", icon = "mdi:test" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("new_app", json.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task CreateApp_InvalidName_Returns400()
    {
        var response = await _client.PostAsJsonAsync("api/apps",
            new { name = "Invalid-Name", class_name = "App", description = "", icon = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── POST /api/apps/{name}/restart ─────────────────────────────────────────

    [Fact]
    public async Task RestartApp_ApiConfiguredAndSuccess_Returns200()
    {
        _factory.AdApi.IsConfigured.Returns(true);
        _factory.AdApi.RestartAppAsync("my_app")
            .Returns((true, (string?)null));

        var response = await _client.PostAsync("api/apps/my_app/restart", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RestartApp_ApiNotConfigured_Returns503()
    {
        _factory.AdApi.IsConfigured.Returns(false);
        _factory.AdApi.RestartAppAsync(Arg.Any<string>())
            .Returns((false, "AD API not configured"));

        var response = await _client.PostAsync("api/apps/any/restart", null);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    // ── POST /api/apps/{name}/start ───────────────────────────────────────────

    [Fact]
    public async Task StartApp_Success_Returns200()
    {
        _factory.AdApi.IsConfigured.Returns(true);
        _factory.AdApi.StartAppAsync("my_app").Returns((true, (string?)null));

        var response = await _client.PostAsync("api/apps/my_app/start", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── POST /api/apps/{name}/stop ────────────────────────────────────────────

    [Fact]
    public async Task StopApp_Success_Returns200()
    {
        _factory.AdApi.IsConfigured.Returns(true);
        _factory.AdApi.StopAppAsync("my_app").Returns((true, (string?)null));

        var response = await _client.PostAsync("api/apps/my_app/stop", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── POST /api/apps/reload ─────────────────────────────────────────────────

    [Fact]
    public async Task ReloadApps_Success_Returns200()
    {
        _factory.AdApi.IsConfigured.Returns(true);
        _factory.AdApi.ReloadAppsAsync().Returns((true, (string?)null));

        var response = await _client.PostAsync("api/apps/reload", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ReloadApps_Failure_Returns500()
    {
        _factory.AdApi.IsConfigured.Returns(true);
        _factory.AdApi.ReloadAppsAsync().Returns((false, "AD error"));

        var response = await _client.PostAsync("api/apps/reload", null);
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ── GET /api/apps/{name}/status ───────────────────────────────────────────

    [Fact]
    public async Task GetAppStatus_Available_Returns200WithState()
    {
        _factory.AdApi.GetAppStatusAsync("my_app")
            .Returns(new AppRuntimeStatus(Available: true, State: "running"));

        var response = await _client.GetAsync("api/apps/my_app/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.GetProperty("available").GetBoolean());
        Assert.Equal("running", json.RootElement.GetProperty("state").GetString());
    }

    [Fact]
    public async Task GetAppStatus_Unavailable_Returns200WithAvailableFalse()
    {
        _factory.AdApi.GetAppStatusAsync("my_app")
            .Returns(new AppRuntimeStatus(Available: false, State: null, Error: "not configured"));

        var response = await _client.GetAsync("api/apps/my_app/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.False(json.RootElement.GetProperty("available").GetBoolean());
    }

    // ── POST /api/apps/{name}/disable  /enable ────────────────────────────────

    [Fact]
    public async Task DisableEnableApp_TogglesDisabledInYaml()
    {
        // Create an app first
        await _client.PostAsJsonAsync("api/apps",
            new { name = "toggle_app", class_name = "ToggleApp", description = "", icon = "" });

        var disableResp = await _client.PostAsync("api/apps/toggle_app/disable", null);
        Assert.Equal(HttpStatusCode.OK, disableResp.StatusCode);

        var appsResp = await _client.GetAsync("api/apps");
        var json = JsonDocument.Parse(await appsResp.Content.ReadAsStringAsync());
        var app = json.RootElement.GetProperty("apps").EnumerateArray()
            .First(a => a.GetProperty("name").GetString() == "toggle_app");
        Assert.True(app.GetProperty("disabled").GetBoolean());

        var enableResp = await _client.PostAsync("api/apps/toggle_app/enable", null);
        Assert.Equal(HttpStatusCode.OK, enableResp.StatusCode);
    }

    public async ValueTask DisposeAsync() => await _factory.DisposeAsync();
}

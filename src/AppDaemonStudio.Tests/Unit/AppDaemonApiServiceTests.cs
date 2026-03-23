using System.Net;
using System.Text.Json;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Services;
using AppDaemonStudio.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace AppDaemonStudio.Tests.Unit;

public class AppDaemonApiServiceTests
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private static AppDaemonApiService Build(
        MockHttpMessageHandler http,
        ISupervisorClient? supervisor = null)
    {
        supervisor ??= Substitute.For<ISupervisorClient>();
        return new AppDaemonApiService(
            new AppSettings(), supervisor, new MockHttpClientFactory(http),
            NullLogger<AppDaemonApiService>.Instance);
    }

    // ── IsConfigured ──────────────────────────────────────────────────────────

    [Fact]
    public void IsConfigured_WithManualUrl_True()
    {
        using var env = new EnvScope(("APPDAEMON_HTTP_URL", "http://localhost:5050"));
        Assert.True(Build(new MockHttpMessageHandler()).IsConfigured);
    }

    [Fact]
    public void IsConfigured_WithSupervisorAvailable_True()
    {
        var supervisor = Substitute.For<ISupervisorClient>();
        supervisor.IsAvailable.Returns(true);
        var svc = Build(new MockHttpMessageHandler(), supervisor);
        Assert.True(svc.IsConfigured);
    }

    [Fact]
    public void IsConfigured_NeitherConfigured_False()
    {
        var supervisor = Substitute.For<ISupervisorClient>();
        supervisor.IsAvailable.Returns(false);
        var svc = Build(new MockHttpMessageHandler(), supervisor);
        Assert.False(svc.IsConfigured);
    }

    // ── RestartAppAsync with manual URL ──────────────────────────────────────

    [Fact]
    public async Task RestartAppAsync_ManualUrl_PostsCorrectEndpoint()
    {
        HttpRequestMessage? captured = null;
        var http = new MockHttpMessageHandler()
            .When("/api/appdaemon/service/admin/app/restart", req =>
            {
                captured = req;
                return MockHttpMessageHandler.Json("""{"response":null}""");
            });

        using var env = new EnvScope(("APPDAEMON_HTTP_URL", "http://ad-host:5050"));
        var svc = Build(http);
        var (success, error) = await svc.RestartAppAsync("my_app");

        Assert.True(success);
        Assert.Null(error);
        Assert.NotNull(captured);
        Assert.Equal(HttpMethod.Post, captured!.Method);
        var body = await captured.Content!.ReadAsStringAsync();
        Assert.Contains("my_app", body);
    }

    [Fact]
    public async Task RestartAppAsync_AdReturnsError_ReturnsFailure()
    {
        var http = new MockHttpMessageHandler()
            .WhenAny(_ => MockHttpMessageHandler.Status(HttpStatusCode.InternalServerError));

        using var env = new EnvScope(("APPDAEMON_HTTP_URL", "http://ad-host:5050"));
        var svc = Build(http);
        var (success, error) = await svc.RestartAppAsync("my_app");

        Assert.False(success);
        Assert.Contains("500", error);
    }

    // ── StopAppAsync / StartAppAsync / ReloadAppsAsync ────────────────────────

    [Theory]
    [InlineData("stop")]
    [InlineData("start")]
    public async Task AppLifecycle_PostsCorrectAction(string action)
    {
        string? capturedUrl = null;
        var http = new MockHttpMessageHandler()
            .WhenAny(req =>
            {
                capturedUrl = req.RequestUri?.ToString();
                return MockHttpMessageHandler.Json("""{"response":null}""");
            });

        using var env = new EnvScope(("APPDAEMON_HTTP_URL", "http://ad-host:5050"));
        var svc = Build(http);

        var (success, _) = action == "stop"
            ? await svc.StopAppAsync("my_app")
            : await svc.StartAppAsync("my_app");

        Assert.True(success);
        Assert.Contains($"/app/{action}", capturedUrl);
    }

    [Fact]
    public async Task ReloadAppsAsync_PostsWithNoAppParam()
    {
        string? body = null;
        var http = new MockHttpMessageHandler()
            .When("/app/reload", async (HttpRequestMessage req) =>
            {
                body = await req.Content!.ReadAsStringAsync();
                return MockHttpMessageHandler.Json("""{"response":null}""");
            });

        using var env = new EnvScope(("APPDAEMON_HTTP_URL", "http://ad-host:5050"));
        var svc = Build(http);
        var (success, _) = await svc.ReloadAppsAsync();

        Assert.True(success);
        // Body should be empty object, not contain "app"
        Assert.DoesNotContain("\"app\"", body ?? "");
    }

    // ── GetAppStatusAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetAppStatusAsync_NotConfigured_ReturnsUnavailable()
    {
        var supervisor = Substitute.For<ISupervisorClient>();
        supervisor.IsAvailable.Returns(false);
        var svc = Build(new MockHttpMessageHandler(), supervisor);

        var status = await svc.GetAppStatusAsync("my_app");
        Assert.False(status.Available);
    }

    [Fact]
    public async Task GetAppStatusAsync_RunningApp_ReturnsState()
    {
        // adHttpUrl is set → ResolveUrlAsync returns immediately without probing.
        // Register only the status route; a probe route would shadow it via substring match.
        var http = new MockHttpMessageHandler()
            .When("/api/appdaemon/state/admin/my_app",
                _ => MockHttpMessageHandler.Json("""{"state":{"state":"running","attributes":{}}}"""));

        using var env = new EnvScope(("APPDAEMON_HTTP_URL", "http://ad-host:5050"));
        var svc = Build(http);
        var status = await svc.GetAppStatusAsync("my_app");

        Assert.True(status.Available);
        Assert.Equal("running", status.State);
    }

    [Fact]
    public async Task GetAppStatusAsync_AppNotFound_ReturnsUnknown()
    {
        var http = new MockHttpMessageHandler()
            .When("/api/appdaemon/state/admin/missing",
                _ => MockHttpMessageHandler.Status(HttpStatusCode.NotFound));

        using var env = new EnvScope(("APPDAEMON_HTTP_URL", "http://ad-host:5050"));
        var svc = Build(http);
        var status = await svc.GetAppStatusAsync("missing");

        Assert.True(status.Available);
        Assert.Equal("unknown", status.State);
    }

    // ── No URL — error path ───────────────────────────────────────────────────

    [Fact]
    public async Task RestartAppAsync_NoUrl_NoSupervisor_ReturnsError()
    {
        var supervisor = Substitute.For<ISupervisorClient>();
        supervisor.IsAvailable.Returns(false);
        var svc = Build(new MockHttpMessageHandler(), supervisor);

        var (success, error) = await svc.RestartAppAsync("my_app");
        Assert.False(success);
        Assert.NotNull(error);
    }

    // ── Helper class ──────────────────────────────────────────────────────────

    private sealed class MockHttpClientFactory(MockHttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler);
    }
}

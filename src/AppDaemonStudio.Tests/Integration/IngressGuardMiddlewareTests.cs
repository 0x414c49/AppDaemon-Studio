using System.Net;
using AppDaemonStudio.Tests.Helpers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AppDaemonStudio.Tests.Integration;

public sealed class IngressGuardMiddlewareTests : IAsyncDisposable
{
    // ── Standalone mode (no SUPERVISOR_TOKEN) — all requests pass through ─────

    [Fact]
    public async Task StandaloneMode_NoSupervisorToken_AllowsApiWithoutHeader()
    {
        // Default factory has no SUPERVISOR_TOKEN
        await using var factory = new TestWebAppFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Addon mode (SUPERVISOR_TOKEN set) — guards /api/* ─────────────────────

    [Fact]
    public async Task AddonMode_ApiRequestWithoutUserIdHeader_Returns403()
    {
        await using var factory = new AddonModeFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("api/health");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AddonMode_ApiRequestWithUserIdHeader_Passes()
    {
        await using var factory = new AddonModeFactory();
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Remote-User-Id", "user123");

        var response = await client.GetAsync("api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AddonMode_NonApiRequest_NotBlocked()
    {
        // Static files or the SPA fallback — not guarded
        await using var factory = new AddonModeFactory();
        var client = factory.CreateClient();

        // index.html (SPA fallback) should not be blocked — it's not /api/*
        // The test host won't have a real wwwroot, so we expect 404 (no static files)
        // rather than 403, confirming the middleware didn't block it.
        var response = await client.GetAsync("some-spa-route");
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    // ── Factory that simulates addon mode (SUPERVISOR_TOKEN set) ──────────────

    private sealed class AddonModeFactory : WebApplicationFactory<Program>
    {
        private readonly string _appsDir =
            Path.Combine(Path.GetTempPath(), $"guard_test_{Guid.NewGuid():N}");
        private EnvScope? _envScope;

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            Directory.CreateDirectory(_appsDir);
            // Simulate addon mode — SUPERVISOR_TOKEN triggers the ingress guard
            _envScope = new EnvScope(("SUPERVISOR_TOKEN", "test-token"), ("APPS_DIR", _appsDir));

            builder.ConfigureServices(services =>
            {
                // Stub out all external services
                var stub = new TestWebAppFactory();
                void Replace<T>(T instance) where T : class
                {
                    var d = services.FirstOrDefault(s => s.ServiceType == typeof(T));
                    if (d != null) services.Remove(d);
                    services.AddSingleton(instance);
                }
                Replace(stub.AdApi);
                Replace(stub.Supervisor);
                Replace(stub.HaService);
                // Replace ILspService with stub; LspService hosted service self-disables when pylsp is absent
                Replace(stub.LspService);
            });
        }

        public override async ValueTask DisposeAsync()
        {
            _envScope?.Dispose();
            await base.DisposeAsync();
            if (Directory.Exists(_appsDir))
                Directory.Delete(_appsDir, recursive: true);
        }
    }
}

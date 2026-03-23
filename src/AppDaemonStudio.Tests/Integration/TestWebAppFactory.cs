using AppDaemonStudio.Configuration;
using AppDaemonStudio.Services;
using AppDaemonStudio.Tests.Helpers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace AppDaemonStudio.Tests.Integration;

/// <summary>
/// Base integration-test factory. Uses a unique temp directory per instance
/// so test classes are fully isolated from each other.
/// </summary>
public sealed class TestWebAppFactory : WebApplicationFactory<Program>
{
    public string AppsDir { get; } = Path.Combine(Path.GetTempPath(), $"ads_test_{Guid.NewGuid():N}");
    private EnvScope? _envScope;

    // Stubs swapped in by default — tests can replace them via the factory's service collection
    public IAppDaemonApiService AdApi { get; } = Substitute.For<IAppDaemonApiService>();
    public ISupervisorClient Supervisor { get; } = Substitute.For<ISupervisorClient>();
    public IHomeAssistantService HaService { get; } = Substitute.For<IHomeAssistantService>();
    public ILspService LspService { get; } = Substitute.For<ILspService>();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(AppsDir);

        // Point the app at the temp directory
        builder.UseSetting("APPS_DIR", AppsDir);

        builder.ConfigureServices(services =>
        {
            _envScope = new EnvScope(("APPS_DIR", AppsDir));
            // Replace env-var-based AppSettings with a test-scoped one
            services.AddSingleton(new AppSettings());

            // Swap singletons with stubs
            ReplaceService(services, AdApi);
            ReplaceService(services, Supervisor);
            ReplaceService(services, HaService);
            // Replace ILspService with stub so tests can control IsReady.
            // The concrete LspService (hosted service) is left registered — it self-disables
            // at StartAsync when pylsp is not installed (/opt/pylsp-venv/bin/pylsp absent).
            ReplaceService(services, LspService);
        });
    }

    private static void ReplaceService<T>(IServiceCollection services, T instance) where T : class
    {
        var existing = services.FirstOrDefault(d => d.ServiceType == typeof(T));
        if (existing != null) services.Remove(existing);
        services.AddSingleton(instance);
    }

    public override async ValueTask DisposeAsync()
    {
        _envScope?.Dispose();
        await base.DisposeAsync();
        if (Directory.Exists(AppsDir))
            Directory.Delete(AppsDir, recursive: true);
    }
}

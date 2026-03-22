using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(AppSettings settings, ILspService lspService, IAppDaemonApiService adApi, ILogger<HealthController> logger) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        logger.LogInformation("Health check — AppsDir: {AppsDir}, AddonSlug: {AddonSlug}",
            settings.AppsDir, settings.AddonSlug ?? "(auto-discover)");
        return Ok(new HealthResponse(
            Status: "ok",
            Timestamp: DateTime.UtcNow.ToString("O"),
            Version: settings.Version,
            HaConfigured: settings.SupervisorToken != null || settings.HaToken != null,
            LspReady: lspService.IsReady,
            AdApiConfigured: adApi.IsConfigured,
            PackageSync: lspService.SyncStatus,
            AppsDir: settings.AppsDir));
    }
}

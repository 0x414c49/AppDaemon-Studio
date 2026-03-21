using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(AppSettings settings, ILspService lspService) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() =>
        Ok(new HealthResponse(
            Status: "ok",
            Timestamp: DateTime.UtcNow.ToString("O"),
            Version: settings.Version,
            HaConfigured: settings.SupervisorToken != null || settings.HaToken != null,
            LspReady: lspService.IsReady,
            PackageSync: lspService.SyncStatus));
}

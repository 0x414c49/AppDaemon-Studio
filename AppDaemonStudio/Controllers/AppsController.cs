using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/apps")]
public class AppsController(IFileManagerService fileManager, ILogger<AppsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetApps()
    {
        try
        {
            var apps = await fileManager.ListAppsAsync();
            return Ok(new { apps, count = apps.Count });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error listing apps");
            return StatusCode(500, new { detail = "Failed to list apps" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateApp([FromBody] CreateAppRequest request)
    {
        try
        {
            var app = await fileManager.CreateAppAsync(request);
            return StatusCode(201, app);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating app {Name}", request.Name);
            return BadRequest(new { detail = ex.Message });
        }
    }
}

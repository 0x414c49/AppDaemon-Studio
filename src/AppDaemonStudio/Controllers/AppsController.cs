using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/apps")]
public class AppsController(
    IFileManagerService fileManager,
    IAppDaemonApiService adApi,
    ILogger<AppsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetApps()
    {
        try
        {
            var apps = await fileManager.ListAppsAsync();
            return Ok(new AppListResponse(apps, apps.Count));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error listing apps");
            return StatusCode(500, new ErrorResponse("Failed to list apps"));
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
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{name}/disable")]
    public async Task<IActionResult> DisableApp(string name) => await SetDisabled(name, true);

    [HttpPost("{name}/enable")]
    public async Task<IActionResult> EnableApp(string name) => await SetDisabled(name, false);

    [HttpPost("{name}/restart")]
    public async Task<IActionResult> RestartApp(string name)
    {
        var (success, error) = await adApi.RestartAppAsync(name);
        if (success) return Ok(new SuccessResponse(true, $"App '{name}' restarted"));
        return StatusCode(adApi.IsConfigured ? 500 : 503, new ErrorResponse(error ?? "Unknown error"));
    }

    [HttpPost("{name}/start")]
    public async Task<IActionResult> StartApp(string name)
    {
        var (success, error) = await adApi.StartAppAsync(name);
        if (success) return Ok(new SuccessResponse(true, $"App '{name}' started"));
        return StatusCode(adApi.IsConfigured ? 500 : 503, new ErrorResponse(error ?? "Unknown error"));
    }

    [HttpPost("{name}/stop")]
    public async Task<IActionResult> StopApp(string name)
    {
        var (success, error) = await adApi.StopAppAsync(name);
        if (success) return Ok(new SuccessResponse(true, $"App '{name}' stopped"));
        return StatusCode(adApi.IsConfigured ? 500 : 503, new ErrorResponse(error ?? "Unknown error"));
    }

    [HttpPost("reload")]
    public async Task<IActionResult> ReloadApps()
    {
        var (success, error) = await adApi.ReloadAppsAsync();
        if (success) return Ok(new SuccessResponse(true, "Apps reloaded"));
        return StatusCode(adApi.IsConfigured ? 500 : 503, new ErrorResponse(error ?? "Unknown error"));
    }

    [HttpGet("{name}/status")]
    public async Task<IActionResult> GetAppStatus(string name)
    {
        var status = await adApi.GetAppStatusAsync(name);
        return Ok(status);
    }

    private async Task<IActionResult> SetDisabled(string name, bool disabled)
    {
        try
        {
            await fileManager.SetAppDisabledAsync(name, disabled);
            return Ok(new SuccessResponse(true, $"App '{name}' {(disabled ? "disabled" : "enabled")}"));
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error {Action} app {Name}", disabled ? "disabling" : "enabling", name);
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }
}

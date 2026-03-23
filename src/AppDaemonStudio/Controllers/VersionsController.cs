using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/versions")]
public class VersionsController(IVersionControlService versionControl, ILogger<VersionsController> logger) : ControllerBase
{
    // GET /api/versions/{app}
    [HttpGet("{app}")]
    public async Task<IActionResult> ListVersions(string app)
    {
        try
        {
            var versions = await versionControl.ListVersionsAsync(app);
            return Ok(new VersionListResponse(versions, versions.Count));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error listing versions for {App}", app);
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }

    // GET /api/versions/{app}/{timestamp}
    [HttpGet("{app}/{timestamp}")]
    public async Task<IActionResult> GetVersion(string app, string timestamp)
    {
        try
        {
            var version = await versionControl.GetVersionAsync(app, timestamp);
            return Ok(version);
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting version {Timestamp} for {App}", timestamp, app);
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }

    // PUT /api/versions/{app}  — restore a version
    [HttpPut("{app}")]
    public async Task<IActionResult> RestoreVersion(string app, [FromBody] RestoreRequest body)
    {
        try
        {
            await versionControl.RestoreVersionAsync(app, body.VersionId);
            return Ok(new SuccessResponse(true, "Version restored"));
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error restoring version for {App}", app);
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }

    // DELETE /api/versions/{app}?versionId={id}
    [HttpDelete("{app}")]
    public async Task<IActionResult> DeleteVersion(string app, [FromQuery] string? versionId)
    {
        if (string.IsNullOrEmpty(versionId))
            return BadRequest(new ErrorResponse("Missing versionId"));

        try
        {
            await versionControl.DeleteVersionAsync(app, versionId);
            return Ok(new SuccessResponse(true, "Version deleted"));
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting version for {App}", app);
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }
}

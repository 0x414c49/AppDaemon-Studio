using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/files")]
public class FilesController(
    IFileManagerService fileManager,
    IVersionControlService versionControl,
    ILogger<FilesController> logger) : ControllerBase
{
    // GET /api/files/{app}  and  GET /api/files/{app}/python
    [HttpGet("{app}")]
    [HttpGet("{app}/python")]
    public async Task<IActionResult> GetPython(string app)
    {
        try
        {
            var file = await fileManager.ReadPythonFileAsync(app);
            return Ok(file);
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error reading python file for {App}", app);
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }

    // GET /api/files/{app}/yaml  and  GET /api/files/{app}/yml
    [HttpGet("{app}/yaml")]
    [HttpGet("{app}/yml")]
    public async Task<IActionResult> GetYaml(string app)
    {
        try
        {
            var file = await fileManager.ReadAppsYamlAsync();
            return Ok(file);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error reading yaml for {App}", app);
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }

    // PUT /api/files/{app}  and  PUT /api/files/{app}/python
    [HttpPut("{app}")]
    [HttpPut("{app}/python")]
    public async Task<IActionResult> PutPython(string app, [FromBody] ContentRequest body)
    {
        try
        {
            // Auto-version the existing content before overwriting
            try
            {
                var existing = await fileManager.ReadPythonFileAsync(app);
                await versionControl.CreateVersionAsync(app, existing.Content);
            }
            catch { /* no existing file — skip versioning */ }

            await fileManager.WritePythonFileAsync(app, body.Content);
            return Ok(new SuccessResponse(true, $"Python file for '{app}' updated"));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error writing python file for {App}", app);
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    // PUT /api/files/{app}/yaml
    [HttpPut("{app}/yaml")]
    [HttpPut("{app}/yml")]
    public async Task<IActionResult> PutYaml(string app, [FromBody] ContentRequest body)
    {
        try
        {
            await fileManager.WriteAppsYamlAsync(body.Content);
            return Ok(new SuccessResponse(true, "YAML config updated"));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error writing yaml for {App}", app);
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    // DELETE /api/files/{app}
    [HttpDelete("{app}")]
    public async Task<IActionResult> DeleteApp(string app)
    {
        try
        {
            await fileManager.DeleteAppAsync(app);
            return NoContent();
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting app {App}", app);
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }
}

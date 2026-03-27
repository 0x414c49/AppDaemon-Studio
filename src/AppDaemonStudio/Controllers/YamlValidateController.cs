using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/yaml")]
public class YamlValidateController(IFileManagerService fileManager) : ControllerBase
{
    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ContentRequest body)
    {
        var issues = await fileManager.ValidateAppsYamlAsync(body.Content);
        return Ok(new YamlValidateResponse(issues));
    }
}

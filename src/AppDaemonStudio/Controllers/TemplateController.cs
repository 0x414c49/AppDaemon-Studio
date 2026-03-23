using System.Text;
using System.Text.Json;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/template")]
public class TemplateController(
    AppSettings settings,
    IHttpClientFactory httpClientFactory,
    ILogger<TemplateController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Evaluate([FromBody] TemplateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Template))
            return BadRequest(new ErrorResponse("Template cannot be empty"));

        if (settings.SupervisorToken == null && settings.HaToken == null)
            return StatusCode(503, new ErrorResponse("Home Assistant not configured"));

        try
        {
            using var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            string url;
            if (settings.SupervisorToken != null)
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {settings.SupervisorToken}");
                url = "http://supervisor/core/api/template";
            }
            else
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {settings.HaToken}");
                url = $"{settings.HaUrl!.TrimEnd('/')}/api/template";
            }

            var payload = new StringContent(
                JsonSerializer.Serialize(new { template = request.Template }),
                Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, payload);
            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new ErrorResponse(result));

            return Ok(new TemplateResponse(result));
        }
        catch (TaskCanceledException)
        {
            return StatusCode(500, new ErrorResponse("Timeout evaluating template"));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error evaluating template");
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }
}

using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/entities")]
public class EntitiesController(IHomeAssistantService haService, ILogger<EntitiesController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetEntities()
    {
        try
        {
            var result = await haService.FetchEntitiesAsync();

            if (!result.Available)
            {
                return Ok(new
                {
                    entities = Array.Empty<object>(),
                    grouped = new { },
                    count = 0,
                    domains = Array.Empty<string>(),
                    timestamp = DateTime.UtcNow.ToString("O"),
                    available = false,
                    error = result.Error,
                });
            }

            var grouped = HomeAssistantService.GroupByDomain(result.Entities);

            return Ok(new
            {
                entities = result.Entities,
                grouped,
                count = result.Entities.Count,
                domains = grouped.Keys.ToArray(),
                timestamp = DateTime.UtcNow.ToString("O"),
                available = true,
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching entities");
            return StatusCode(500, new { detail = ex.Message });
        }
    }
}

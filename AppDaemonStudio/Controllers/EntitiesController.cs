using AppDaemonStudio.Models;
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
                return Ok(new EntityListResponse(
                    Entities: [],
                    Grouped: [],
                    Count: 0,
                    Domains: [],
                    Timestamp: DateTime.UtcNow.ToString("O"),
                    Available: false,
                    Error: result.Error));
            }

            var grouped = HomeAssistantService.GroupByDomain(result.Entities);

            return Ok(new EntityListResponse(
                Entities: result.Entities,
                Grouped: grouped,
                Count: result.Entities.Count,
                Domains: [.. grouped.Keys],
                Timestamp: DateTime.UtcNow.ToString("O"),
                Available: true));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching entities");
            return StatusCode(500, new ErrorResponse(ex.Message));
        }
    }
}

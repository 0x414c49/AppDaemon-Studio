using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public record HaFetchResult(List<HaEntity> Entities, bool Available, string? Error = null);

public interface IHomeAssistantService
{
    Task<HaFetchResult> FetchEntitiesAsync();
}

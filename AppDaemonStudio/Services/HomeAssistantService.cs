using System.Text.Json;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public class HomeAssistantService(AppSettings settings, IHttpClientFactory httpClientFactory, ILogger<HomeAssistantService> logger) : IHomeAssistantService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<HaFetchResult> FetchEntitiesAsync()
    {
        if (settings.SupervisorToken is { } token)
            return await FetchFromSupervisorAsync(token);

        if (settings.HaUrl is { } haUrl && settings.HaToken is { } haToken)
            return await FetchFromUrlAsync(haUrl, haToken);

        return new HaFetchResult([], false,
            "No Home Assistant credentials. Set SUPERVISOR_TOKEN (add-on) or HA_URL + HA_TOKEN (standalone).");
    }

    private async Task<HaFetchResult> FetchFromSupervisorAsync(string token)
    {
        try
        {
            using var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");

            var response = await client.GetAsync("http://supervisor/core/api/states");
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                return new HaFetchResult([], false, $"HA API error: {(int)response.StatusCode} - {err}");
            }

            var entities = await DeserializeEntitiesAsync(response);
            return new HaFetchResult(entities, true);
        }
        catch (TaskCanceledException)
        {
            return new HaFetchResult([], false, "Timeout fetching entities from Home Assistant");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching entities from supervisor");
            return new HaFetchResult([], false, ex.Message);
        }
    }

    private async Task<HaFetchResult> FetchFromUrlAsync(string haUrl, string token)
    {
        try
        {
            var url = haUrl.TrimEnd('/');
            using var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");

            var response = await client.GetAsync($"{url}/api/states");
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                return new HaFetchResult([], false, $"HA API error: {(int)response.StatusCode} - {err}");
            }

            var entities = await DeserializeEntitiesAsync(response);
            return new HaFetchResult(entities, true);
        }
        catch (TaskCanceledException)
        {
            return new HaFetchResult([], false, "Timeout fetching entities from Home Assistant");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching entities from HA URL");
            return new HaFetchResult([], false, ex.Message);
        }
    }

    private static async Task<List<HaEntity>> DeserializeEntitiesAsync(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        var raw = JsonSerializer.Deserialize<JsonElement[]>(json, JsonOpts) ?? [];

        var result = new List<HaEntity>(raw.Length);
        foreach (var el in raw)
        {
            var entityId = el.GetProperty("entity_id").GetString() ?? "";
            var state = el.GetProperty("state").GetString() ?? "";
            var attributes = el.GetProperty("attributes");
            var lastChanged = el.TryGetProperty("last_changed", out var lc) ? lc.GetString() ?? "" : "";
            var lastUpdated = el.TryGetProperty("last_updated", out var lu) ? lu.GetString() ?? "" : "";
            result.Add(new HaEntity(entityId, state, attributes, lastChanged, lastUpdated));
        }
        return result;
    }

    public static Dictionary<string, List<HaEntity>> GroupByDomain(List<HaEntity> entities)
    {
        var grouped = new Dictionary<string, List<HaEntity>>();
        foreach (var entity in entities)
        {
            var domain = entity.EntityId.Split('.')[0];
            if (!grouped.TryGetValue(domain, out var list))
                grouped[domain] = list = [];
            list.Add(entity);
        }

        // Sort domains and entities within each domain
        var sorted = new Dictionary<string, List<HaEntity>>();
        foreach (var key in grouped.Keys.Order())
        {
            sorted[key] = [.. grouped[key].OrderBy(e => e.EntityId)];
        }
        return sorted;
    }
}

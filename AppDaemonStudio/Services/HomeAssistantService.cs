using System.Net.Http.Json;
using System.Text.Json;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;
using Microsoft.Extensions.Caching.Memory;

namespace AppDaemonStudio.Services;

public class HomeAssistantService : IHomeAssistantService
{
    private const string CacheKey = "ha_entities";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);

    private readonly AppSettings _settings;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<HomeAssistantService> _logger;
    private readonly IMemoryCache _cache;

    public HomeAssistantService(AppSettings settings, IHttpClientFactory httpClientFactory,
        ILogger<HomeAssistantService> logger, IMemoryCache cache)
    {
        _settings = settings;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _cache = cache;
    }

    public async Task<HaFetchResult> FetchEntitiesAsync()
    {
        if (_cache.TryGetValue(CacheKey, out HaFetchResult? cached) && cached is not null)
            return cached;

        HaFetchResult result;
        if (_settings.SupervisorToken is { } token)
            result = await FetchFromSupervisorAsync(token);
        else if (_settings.HaUrl is { } haUrl && _settings.HaToken is { } haToken)
            result = await FetchFromUrlAsync(haUrl, haToken);
        else
            result = new HaFetchResult([], false,
                "No Home Assistant credentials. Set SUPERVISOR_TOKEN (add-on) or HA_URL + HA_TOKEN (standalone).");

        if (result.Available)
            _cache.Set(CacheKey, result, CacheTtl);

        return result;
    }

    private async Task<HaFetchResult> FetchFromSupervisorAsync(string token)
    {
        try
        {
            using var client = _httpClientFactory.CreateClient();
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
            _logger.LogError(ex, "Error fetching entities from supervisor");
            return new HaFetchResult([], false, ex.Message);
        }
    }

    private async Task<HaFetchResult> FetchFromUrlAsync(string haUrl, string token)
    {
        try
        {
            var url = haUrl.TrimEnd('/');
            using var client = _httpClientFactory.CreateClient();
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
            _logger.LogError(ex, "Error fetching entities from HA URL");
            return new HaFetchResult([], false, ex.Message);
        }
    }

    private static async Task<List<HaEntity>> DeserializeEntitiesAsync(HttpResponseMessage response)
    {
        // Stream directly into JsonElement[] — no intermediate string allocation
        var raw = await response.Content.ReadFromJsonAsync<JsonElement[]>() ?? [];

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

    public static SortedDictionary<string, List<HaEntity>> GroupByDomain(List<HaEntity> entities)
    {
        var sorted = new SortedDictionary<string, List<HaEntity>>(StringComparer.Ordinal);
        foreach (var entity in entities)
        {
            var id = entity.EntityId.AsSpan();
            var dot = id.IndexOf('.');
            var domain = dot >= 0 ? entity.EntityId[..dot] : entity.EntityId;

            if (!sorted.TryGetValue(domain, out var list))
                sorted[domain] = list = [];
            list.Add(entity);
        }

        foreach (var list in sorted.Values)
            list.Sort((a, b) => string.Compare(a.EntityId, b.EntityId, StringComparison.Ordinal));

        return sorted;
    }
}

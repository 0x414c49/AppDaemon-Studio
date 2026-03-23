using System.Net.Http.Json;
using System.Text.Json;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;
using Microsoft.Extensions.Caching.Memory;

namespace AppDaemonStudio.Services;

public class HomeAssistantService(
    AppSettings settings,
    IHttpClientFactory httpClientFactory,
    ILogger<HomeAssistantService> logger,
    IMemoryCache cache) : IHomeAssistantService
{
    private const string CacheKey = "ha_entities";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);

    public async Task<HaFetchResult> FetchEntitiesAsync()
    {
        if (cache.TryGetValue(CacheKey, out HaFetchResult? cached) && cached is not null)
            return cached;

        HaFetchResult result;
        if (settings.SupervisorToken is { } svToken)
            result = await FetchAsync("http://supervisor/core/api/states", svToken);
        else if (settings.HaUrl is { } haUrl && settings.HaToken is { } haToken)
            result = await FetchAsync($"{haUrl.TrimEnd('/')}/api/states", haToken);
        else
            result = new HaFetchResult([], false,
                "No Home Assistant credentials. Set SUPERVISOR_TOKEN (add-on) or HA_URL + HA_TOKEN (standalone).");

        if (result.Available)
            cache.Set(CacheKey, result, CacheTtl);

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

    // ── Internals ─────────────────────────────────────────────────────────────

    private async Task<HaFetchResult> FetchAsync(string url, string token)
    {
        try
        {
            using var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");

            var response = await client.GetAsync(url);
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
            logger.LogError(ex, "Error fetching entities from {Url}", url);
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
}

using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/appdaemon-logs")]
public class LogsController(
    AppSettings settings,
    ILogReaderService logReader,
    IHttpClientFactory httpClientFactory,
    ILogger<LogsController> logger) : ControllerBase
{
    private static readonly string[] CommonSlugs = ["a0d7b954_appdaemon", "core_appdaemon", "appdaemon"];

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] string? slug = null)
    {
        var effectiveSlug = slug ?? settings.AddonSlug;
        var supervisorToken = settings.SupervisorToken;

        // Priority 1: supervisor token (addon mode)
        if (supervisorToken != null)
        {
            var resolvedSlug = effectiveSlug ?? await FindSlugViaSupervisorAsync(supervisorToken);
            if (resolvedSlug == null)
                return NotFound(new LogsErrorResponse("Could not find AppDaemon addon. Make sure AppDaemon is installed."));

            return await FetchViaSupervisorAsync(resolvedSlug, supervisorToken);
        }

        // Priority 2: local log file
        if (settings.LogFilePath != null)
            return await FetchViaFileAsync(settings.LogFilePath);

        // Priority 3: HA_URL + HA_TOKEN
        if (settings.HaToken != null && settings.HaUrl != null)
        {
            var resolvedSlug = effectiveSlug ?? await FindSlugViaHaAsync(settings.HaToken, settings.HaUrl);
            if (resolvedSlug == null)
                return NotFound(new LogsErrorResponse("Could not find AppDaemon addon via HA API."));

            return await FetchViaSupervisorViaHaAsync(resolvedSlug, settings.HaToken, settings.HaUrl);
        }

        return StatusCode(401, new LogsErrorResponse("Logs not available. This feature requires Home Assistant with Supervisor."));
    }

    private async Task<string?> FindSlugViaSupervisorAsync(string token)
    {
        try
        {
            using var client = CreateClient(token);
            var response = await client.GetAsync("http://supervisor/addons");
            if (!response.IsSuccessStatusCode) return null;

            using var doc = await System.Text.Json.JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync());

            var root = doc.RootElement;
            System.Text.Json.JsonElement addonsEl;
            if (!root.TryGetProperty("addons", out addonsEl))
            {
                if (!root.TryGetProperty("data", out var data) || !data.TryGetProperty("addons", out addonsEl))
                    return null;
            }

            foreach (var addon in addonsEl.EnumerateArray())
            {
                var name = addon.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var addonSlug = addon.TryGetProperty("slug", out var s) ? s.GetString() ?? "" : "";
                if (name.Contains("appdaemon", StringComparison.OrdinalIgnoreCase) ||
                    addonSlug.Contains("appdaemon", StringComparison.OrdinalIgnoreCase))
                    return addonSlug;
            }
        }
        catch (Exception ex) { logger.LogError(ex, "Error finding addon slug via supervisor"); }
        return null;
    }

    private async Task<string?> FindSlugViaHaAsync(string token, string haUrl)
    {
        var baseUrl = haUrl.TrimEnd('/');
        foreach (var s in CommonSlugs)
        {
            try
            {
                using var client = CreateClient(token);
                var resp = await client.GetAsync($"{baseUrl}/api/hassio/addons/{s}/logs");
                if (resp.IsSuccessStatusCode) return s;
            }
            catch { }
        }
        return null;
    }

    private async Task<IActionResult> FetchViaSupervisorAsync(string slug, string token)
    {
        try
        {
            using var client = CreateClient(token, acceptText: true);
            var response = await client.GetAsync($"http://supervisor/addons/{slug}/logs");
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode,
                    new LogsErrorResponse($"Failed to fetch logs: {(int)response.StatusCode} - {err}"));
            }
            var raw = await response.Content.ReadAsStringAsync();
            return Ok(new LogsResponse(logReader.ParseLogs(raw)));
        }
        catch (TaskCanceledException)
        {
            return StatusCode(500, new LogsErrorResponse("Timeout fetching logs from AppDaemon"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new LogsErrorResponse(ex.Message));
        }
    }

    private async Task<IActionResult> FetchViaFileAsync(string filePath)
    {
        try
        {
            var content = await System.IO.File.ReadAllTextAsync(filePath);
            return Ok(new LogsResponse(logReader.ParseLogs(content)));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new LogsErrorResponse($"Failed to read log file: {ex.Message}"));
        }
    }

    private async Task<IActionResult> FetchViaSupervisorViaHaAsync(string slug, string token, string haUrl)
    {
        var baseUrl = haUrl.TrimEnd('/');
        var endpoints = new[]
        {
            $"{baseUrl}/api/hassio/addons/{slug}/logs",
            $"{baseUrl}/supervisor/addons/{slug}/logs",
            $"{baseUrl}/hassio/addons/{slug}/logs",
        };

        string lastError = "";
        foreach (var endpoint in endpoints)
        {
            try
            {
                using var client = CreateClient(token, acceptText: true);
                var resp = await client.GetAsync(endpoint);
                if (resp.IsSuccessStatusCode)
                {
                    var raw = await resp.Content.ReadAsStringAsync();
                    return Ok(new LogsResponse(logReader.ParseLogs(raw)));
                }
                lastError = $"HTTP {(int)resp.StatusCode}";
            }
            catch (Exception ex) { lastError = ex.Message; }
        }

        return StatusCode(500, new LogsErrorResponse($"Failed to fetch logs. Last error: {lastError}"));
    }

    private HttpClient CreateClient(string token, bool acceptText = false)
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
        if (acceptText) client.DefaultRequestHeaders.Add("Accept", "text/plain");
        return client;
    }
}

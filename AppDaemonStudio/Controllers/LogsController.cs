using System.Text;
using System.Text.Json;
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
    private static readonly JsonSerializerOptions SseJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    // ── Snapshot ──────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] string? slug = null)
    {
        var token = settings.SupervisorToken;
        if (token == null)
            return StatusCode(503, new LogsErrorResponse("Logs require Home Assistant Supervisor (addon mode)."));

        var resolvedSlug = slug ?? settings.AddonSlug ?? await FindSlugAsync(token);
        if (resolvedSlug == null)
            return NotFound(new LogsErrorResponse("Could not find AppDaemon addon."));

        try
        {
            using var client = CreateClient(token);
            var resp = await client.GetAsync($"http://supervisor/addons/{resolvedSlug}/logs");
            if (!resp.IsSuccessStatusCode)
                return StatusCode((int)resp.StatusCode,
                    new LogsErrorResponse($"Supervisor returned {(int)resp.StatusCode}"));

            var raw = await resp.Content.ReadAsStringAsync();
            return Ok(new LogsResponse(logReader.ParseLogs(raw)));
        }
        catch (TaskCanceledException)
        {
            return StatusCode(504, new LogsErrorResponse("Timeout fetching logs from supervisor."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new LogsErrorResponse(ex.Message));
        }
    }

    // ── SSE stream ────────────────────────────────────────────────────────────

    [HttpGet("stream")]
    public async Task StreamLogs([FromQuery] string? slug, CancellationToken ct)
    {
        Response.ContentType = "text/event-stream; charset=utf-8";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no";
        HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>()
            ?.DisableBuffering();

        // Write immediately so the browser receives the 200 + headers and fires onopen
        await WriteKeepAliveAsync(ct);

        var token = settings.SupervisorToken;
        if (token == null)
        {
            await WriteSseAsync("error", """{"error":"Logs require Home Assistant Supervisor (addon mode)."}""", ct);
            try { await Task.Delay(Timeout.Infinite, ct); } catch (OperationCanceledException) { }
            return;
        }

        var resolvedSlug = slug ?? settings.AddonSlug ?? await FindSlugAsync(token);
        if (resolvedSlug == null)
        {
            await WriteSseAsync("error", """{"error":"Could not find AppDaemon addon."}""", ct);
            try { await Task.Delay(Timeout.Infinite, ct); } catch (OperationCanceledException) { }
            return;
        }

        try
        {
            var lastCount = new int[1];
            int ticksSinceHeartbeat = 0;

            while (!ct.IsCancellationRequested)
            {
                await PollAndPushAsync(token, resolvedSlug, lastCount, ct);

                await Task.Delay(2000, ct);

                if (++ticksSinceHeartbeat >= 10)
                {
                    ticksSinceHeartbeat = 0;
                    await WriteKeepAliveAsync(ct);
                }
            }
        }
        catch (OperationCanceledException) { /* client disconnected */ }
        catch (Exception ex) { logger.LogError(ex, "Error in log SSE stream"); }
    }

    private async Task PollAndPushAsync(string token, string slug, int[] lastCount, CancellationToken ct)
    {
        try
        {
            using var client = CreateClient(token);
            var resp = await client.GetAsync($"http://supervisor/addons/{slug}/logs", ct);
            if (!resp.IsSuccessStatusCode) return;

            var all = logReader.ParseLogs(await resp.Content.ReadAsStringAsync(ct));

            if (lastCount[0] == 0 || all.Count < lastCount[0])
            {
                // First batch or log rotation — send last 200 as init
                var tail = all.Count > 200 ? all.GetRange(all.Count - 200, 200) : all;
                await WriteSseAsync("init", JsonSerializer.Serialize(tail, SseJsonOptions), ct);
                lastCount[0] = all.Count;
                return;
            }

            for (int i = lastCount[0]; i < all.Count; i++)
                await WriteSseAsync("log", JsonSerializer.Serialize(all[i], SseJsonOptions), ct);

            lastCount[0] = all.Count;
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex) { logger.LogWarning(ex, "SSE poll failed"); }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<string?> FindSlugAsync(string token)
    {
        try
        {
            using var client = CreateClient(token);
            var resp = await client.GetAsync("http://supervisor/addons");
            if (!resp.IsSuccessStatusCode) return null;

            using var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync());
            var root = doc.RootElement;

            if (!root.TryGetProperty("addons", out var addons) &&
                (!root.TryGetProperty("data", out var data) || !data.TryGetProperty("addons", out addons)))
                return null;

            foreach (var addon in addons.EnumerateArray())
            {
                var name = addon.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var s = addon.TryGetProperty("slug", out var sl) ? sl.GetString() ?? "" : "";
                if (name.Contains("appdaemon", StringComparison.OrdinalIgnoreCase) ||
                    s.Contains("appdaemon", StringComparison.OrdinalIgnoreCase))
                    return s;
            }
        }
        catch (Exception ex) { logger.LogWarning(ex, "Error finding AppDaemon slug"); }
        return null;
    }

    private HttpClient CreateClient(string token)
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
        client.DefaultRequestHeaders.Add("Accept", "text/plain");
        return client;
    }

    private async Task WriteSseAsync(string eventType, string data, CancellationToken ct)
    {
        var bytes = Encoding.UTF8.GetBytes($"event: {eventType}\ndata: {data}\n\n");
        await Response.Body.WriteAsync(bytes, ct);
        await Response.Body.FlushAsync(ct);
    }

    private async Task WriteKeepAliveAsync(CancellationToken ct)
    {
        var bytes = Encoding.UTF8.GetBytes(": ping\n\n");
        await Response.Body.WriteAsync(bytes, ct);
        await Response.Body.FlushAsync(ct);
    }
}

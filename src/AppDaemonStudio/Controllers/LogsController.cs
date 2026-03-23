using System.Text;
using System.Text.Json;
using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/appdaemon-logs")]
public class LogsController(
    ILogReaderService logReader,
    ISupervisorClient supervisor,
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
        if (!supervisor.IsAvailable)
            return StatusCode(503, new LogsErrorResponse("Logs require Home Assistant Supervisor (addon mode)."));

        var resolvedSlug = slug ?? await supervisor.FindAddonSlugAsync();
        if (resolvedSlug == null)
            return NotFound(new LogsErrorResponse("Could not find AppDaemon addon."));

        var raw = await supervisor.GetAddonLogsRawAsync(resolvedSlug);
        if (raw == null)
            return StatusCode(502, new LogsErrorResponse("Failed to fetch logs from supervisor."));

        return Ok(new LogsResponse(logReader.ParseLogs(raw)));
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

        await WriteKeepAliveAsync(ct);

        if (!supervisor.IsAvailable)
        {
            await WriteSseAsync("error", """{"error":"Logs require Home Assistant Supervisor (addon mode)."}""", ct);
            try { await Task.Delay(Timeout.Infinite, ct); } catch (OperationCanceledException) { }
            return;
        }

        var resolvedSlug = slug ?? await supervisor.FindAddonSlugAsync(ct);
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
                await PollAndPushAsync(resolvedSlug, lastCount, ct);

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

    private async Task PollAndPushAsync(string slug, int[] lastCount, CancellationToken ct)
    {
        try
        {
            var raw = await supervisor.GetAddonLogsRawAsync(slug, ct);
            if (raw == null) return;

            var all = logReader.ParseLogs(raw);

            if (lastCount[0] == 0 || all.Count < lastCount[0])
            {
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

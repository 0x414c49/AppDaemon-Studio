using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/lsp")]
public class LspController(ILspService lspService, ILogger<LspController> logger) : ControllerBase
{
    private const int LspPort = 2087;
    private const int BufferSize = 64 * 1024; // 64 KB

    [HttpGet]
    public async Task Get()
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            await HttpContext.Response.WriteAsync("WebSocket upgrade required");
            return;
        }

        if (!lspService.IsReady)
        {
            HttpContext.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await HttpContext.Response.WriteAsync("{\"detail\":\"LSP not ready\"}");
            return;
        }

        using var ws = await HttpContext.WebSockets.AcceptWebSocketAsync();
        using var tcp = new TcpClient();

        try
        {
            await tcp.ConnectAsync("127.0.0.1", LspPort);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to connect to pylsp on port {Port}", LspPort);
            await ws.CloseAsync(WebSocketCloseStatus.InternalServerError, "LSP unavailable", CancellationToken.None);
            return;
        }

        using var stream = tcp.GetStream();
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(HttpContext.RequestAborted);

        logger.LogDebug("LSP WebSocket proxy connected");

        try
        {
            await Task.WhenAny(
                WsToTcpAsync(ws, stream, cts.Token),
                TcpToWsAsync(stream, ws, cts.Token)
            );
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "LSP proxy error");
        }
        finally
        {
            await cts.CancelAsync();
            if (ws.State == WebSocketState.Open)
            {
                try { await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None); }
                catch { /* best effort */ }
            }
            logger.LogDebug("LSP WebSocket proxy disconnected");
        }
    }

    // WebSocket → TCP: receive raw JSON, prepend Content-Length header
    private static async Task WsToTcpAsync(WebSocket ws, NetworkStream stream, CancellationToken ct)
    {
        var buffer = new byte[BufferSize];
        while (!ct.IsCancellationRequested && ws.State == WebSocketState.Open)
        {
            var result = await ws.ReceiveAsync(buffer, ct);
            if (result.MessageType == WebSocketMessageType.Close) break;

            var header = Encoding.ASCII.GetBytes($"Content-Length: {result.Count}\r\n\r\n");
            await stream.WriteAsync(header, ct);
            await stream.WriteAsync(buffer.AsMemory(0, result.Count), ct);
        }
    }

    // TCP → WebSocket: read Content-Length framed message, forward raw JSON
    private static async Task TcpToWsAsync(NetworkStream stream, WebSocket ws, CancellationToken ct)
    {
        var headerBuf = new byte[BufferSize];

        while (!ct.IsCancellationRequested && ws.State == WebSocketState.Open)
        {
            // Read headers until \r\n\r\n
            int headerLen = 0;
            int contentLength = -1;

            while (!ct.IsCancellationRequested)
            {
                int b = await ReadByteAsync(stream, ct);
                if (b < 0) return;

                headerBuf[headerLen++] = (byte)b;

                // Check for end of headers
                if (headerLen >= 4 &&
                    headerBuf[headerLen - 4] == '\r' &&
                    headerBuf[headerLen - 3] == '\n' &&
                    headerBuf[headerLen - 2] == '\r' &&
                    headerBuf[headerLen - 1] == '\n')
                {
                    var headerText = Encoding.ASCII.GetString(headerBuf, 0, headerLen);
                    contentLength = ParseContentLength(headerText);
                    break;
                }
            }

            if (contentLength <= 0) continue;

            // Read exactly contentLength bytes
            var body = new byte[contentLength];
            int read = 0;
            while (read < contentLength && !ct.IsCancellationRequested)
            {
                int n = await stream.ReadAsync(body.AsMemory(read, contentLength - read), ct);
                if (n == 0) return;
                read += n;
            }

            if (ws.State == WebSocketState.Open)
            {
                await ws.SendAsync(body.AsMemory(0, read), WebSocketMessageType.Text, true, ct);
            }
        }
    }

    private static async Task<int> ReadByteAsync(NetworkStream stream, CancellationToken ct)
    {
        var buf = new byte[1];
        int n = await stream.ReadAsync(buf, ct);
        return n == 0 ? -1 : buf[0];
    }

    private static int ParseContentLength(string headers)
    {
        foreach (var line in headers.Split("\r\n", StringSplitOptions.RemoveEmptyEntries))
        {
            if (line.StartsWith("Content-Length:", StringComparison.OrdinalIgnoreCase))
            {
                var value = line["Content-Length:".Length..].Trim();
                if (int.TryParse(value, out int len)) return len;
            }
        }
        return -1;
    }
}

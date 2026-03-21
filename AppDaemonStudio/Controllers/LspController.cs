using System.Buffers;
using System.Buffers.Text;
using System.Net.Sockets;
using System.Net.WebSockets;
using AppDaemonStudio.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/lsp")]
public class LspController(ILspService lspService, ILogger<LspController> logger) : ControllerBase
{
    private const int WsBufferSize  = 64 * 1024; // max WebSocket message we'll receive
    private const int HeaderBufSize = 256;        // LSP headers are always tiny ("Content-Length: N\r\n\r\n")

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

        using var ws  = await HttpContext.WebSockets.AcceptWebSocketAsync();
        using var tcp = new TcpClient();

        try
        {
            await tcp.ConnectAsync("127.0.0.1", lspService.Port);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to connect to pylsp on port {Port}", lspService.Port);
            await ws.CloseAsync(WebSocketCloseStatus.InternalServerError, "LSP unavailable", CancellationToken.None);
            return;
        }

        using var stream = tcp.GetStream();
        using var cts    = CancellationTokenSource.CreateLinkedTokenSource(HttpContext.RequestAborted);

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
        // Rent both buffers once for the lifetime of this connection
        var wsBuf = ArrayPool<byte>.Shared.Rent(WsBufferSize);
        var hdrBuf = ArrayPool<byte>.Shared.Rent(HeaderBufSize);
        try
        {
            while (!ct.IsCancellationRequested && ws.State == WebSocketState.Open)
            {
                var result = await ws.ReceiveAsync(wsBuf.AsMemory(0, WsBufferSize), ct);
                if (result.MessageType == WebSocketMessageType.Close) break;

                // Write "Content-Length: N\r\n\r\n" with no string/byte[] allocation
                int hdrLen = WriteContentLengthHeader(hdrBuf, result.Count);
                await stream.WriteAsync(hdrBuf.AsMemory(0, hdrLen), ct);
                await stream.WriteAsync(wsBuf.AsMemory(0, result.Count), ct);
            }
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(wsBuf);
            ArrayPool<byte>.Shared.Return(hdrBuf);
        }
    }

    // TCP → WebSocket: read Content-Length framed messages, forward raw JSON
    private static async Task TcpToWsAsync(NetworkStream stream, WebSocket ws, CancellationToken ct)
    {
        // Small fixed header buffer — LSP headers are always < 64 bytes
        var headerBuf = new byte[HeaderBufSize];

        while (!ct.IsCancellationRequested && ws.State == WebSocketState.Open)
        {
            // Read into headerBuf one byte at a time until \r\n\r\n
            // (no per-byte allocation — reads directly into the existing buffer)
            int headerLen = 0;
            int contentLength = -1;

            while (!ct.IsCancellationRequested)
            {
                int n = await stream.ReadAsync(headerBuf.AsMemory(headerLen, 1), ct);
                if (n == 0) return;

                headerLen++;

                if (headerLen >= 4 &&
                    headerBuf[headerLen - 4] == '\r' &&
                    headerBuf[headerLen - 3] == '\n' &&
                    headerBuf[headerLen - 2] == '\r' &&
                    headerBuf[headerLen - 1] == '\n')
                {
                    contentLength = ParseContentLength(headerBuf.AsSpan(0, headerLen));
                    break;
                }
            }

            if (contentLength <= 0) continue;

            // Rent body buffer from pool — avoids LOH pressure for large responses (completions, hover)
            var bodyBuf = ArrayPool<byte>.Shared.Rent(contentLength);
            try
            {
                int read = 0;
                while (read < contentLength && !ct.IsCancellationRequested)
                {
                    int n = await stream.ReadAsync(bodyBuf.AsMemory(read, contentLength - read), ct);
                    if (n == 0) return;
                    read += n;
                }

                if (ws.State == WebSocketState.Open)
                    await ws.SendAsync(bodyBuf.AsMemory(0, read), WebSocketMessageType.Text, true, ct);
            }
            finally
            {
                ArrayPool<byte>.Shared.Return(bodyBuf);
            }
        }
    }

    // Writes "Content-Length: N\r\n\r\n" into buf using UTF-8 literals and Utf8Formatter.
    // Zero heap allocations.
    private static int WriteContentLengthHeader(byte[] buf, int contentLength)
    {
        "Content-Length: "u8.CopyTo(buf.AsSpan());
        Utf8Formatter.TryFormat(contentLength, buf.AsSpan(16), out int written);
        "\r\n\r\n"u8.CopyTo(buf.AsSpan(16 + written));
        return 16 + written + 4;
    }

    // Span-based Content-Length parse — no string allocation
    private static int ParseContentLength(ReadOnlySpan<byte> header)
    {
        ReadOnlySpan<byte> prefix = "Content-Length: "u8;
        int pos = header.IndexOf(prefix);
        if (pos < 0) return -1;

        var rest = header[(pos + prefix.Length)..];
        int end  = rest.IndexOf((byte)'\r');
        if (end < 0) return -1;

        return Utf8Parser.TryParse(rest[..end], out int len, out _) ? len : -1;
    }
}

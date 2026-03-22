using AppDaemonStudio.Configuration;

namespace AppDaemonStudio.Middleware;

/// <summary>
/// When running as an HA addon (SUPERVISOR_TOKEN is set):
///   - Loopback requests (Docker HEALTHCHECK, internal) bypass the guard
///   - Rejects /api/* requests that lack X-Ingress-Path (direct port access)
///   - Rejects /api/* requests from non-admin HA users (X-Hass-Is-Admin != "1")
/// In standalone/dev mode (no SUPERVISOR_TOKEN): passes all requests through.
/// </summary>
public class IngressGuardMiddleware(RequestDelegate next, AppSettings settings)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (settings.SupervisorToken != null && context.Request.Path.StartsWithSegments("/api"))
        {
            var ip = context.Connection.RemoteIpAddress;
            var isLoopback = ip != null && System.Net.IPAddress.IsLoopback(ip);

            if (!isLoopback)
            {
                if (!context.Request.Headers.ContainsKey("X-Ingress-Path"))
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("""{"detail":"Direct access not allowed"}""");
                    return;
                }

                // HA sends "1" for admin users
                var isAdmin = context.Request.Headers["X-Hass-Is-Admin"].ToString();
                if (isAdmin != "1" && isAdmin != "true")
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("""{"detail":"Admin access required"}""");
                    return;
                }
            }
        }

        await next(context);
    }
}

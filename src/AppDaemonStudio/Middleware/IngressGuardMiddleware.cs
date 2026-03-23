using AppDaemonStudio.Configuration;

namespace AppDaemonStudio.Middleware;

/// <summary>
/// When running as an HA addon (SUPERVISOR_TOKEN is set):
///   - Loopback requests (Docker HEALTHCHECK, internal) bypass the guard
///   - Rejects /api/* requests that lack X-Remote-User-Id header
///     (the supervisor ingress proxy sets this from the authenticated session
///      and strips any client-supplied value, so it cannot be spoofed)
///   - Admin enforcement is handled by HA via panel_admin: true in config.json
/// In standalone/dev mode (no SUPERVISOR_TOKEN): passes all requests through.
///
/// Headers actually set by supervisor ingress (supervisor/api/ingress.py):
///   X-Remote-User-Id, X-Remote-User-Name, X-Remote-User-Display-Name
/// Headers that do NOT exist: X-Ingress-Path, X-Hass-Is-Admin
/// </summary>
public class IngressGuardMiddleware(RequestDelegate next, AppSettings settings)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (settings.SupervisorToken != null && context.Request.Path.StartsWithSegments("/api"))
        {
            var ip = context.Connection.RemoteIpAddress;
            var isLoopback = ip != null && System.Net.IPAddress.IsLoopback(ip);

            if (!isLoopback && !context.Request.Headers.ContainsKey("X-Remote-User-Id"))
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("""{"detail":"Direct access not allowed"}""");
                return;
            }
        }

        await next(context);
    }
}

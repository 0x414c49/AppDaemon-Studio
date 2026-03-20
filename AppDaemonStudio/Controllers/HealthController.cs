using AppDaemonStudio.Configuration;
using Microsoft.AspNetCore.Mvc;

namespace AppDaemonStudio.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(AppSettings settings) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var hasSupervisorToken = !string.IsNullOrEmpty(settings.SupervisorToken)
            || System.IO.File.Exists("/tmp/supervisor_token");

        var allEnvVars = System.Environment.GetEnvironmentVariables().Keys
            .Cast<string>()
            .Where(k => !k.Contains("TOKEN") && !k.Contains("SECRET") && !k.Contains("PASSWORD") && !k.Contains("KEY"))
            .Order()
            .ToList();

        return Ok(new
        {
            status = "ok",
            timestamp = DateTime.UtcNow.ToString("O"),
            version = settings.Version,
            environment = new
            {
                hasSupervisorToken,
                hasHassioToken = !string.IsNullOrEmpty(System.Environment.GetEnvironmentVariable("HASSIO_TOKEN")),
                supervisorTokenSource = System.Environment.GetEnvironmentVariable("SUPERVISOR_TOKEN") != null ? "env"
                    : System.IO.File.Exists("/tmp/supervisor_token") ? "file" : "none",
                dotnetEnv = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                hostname = System.Environment.GetEnvironmentVariable("HOSTNAME"),
                allEnvVars,
            },
            requestHeaders = new
            {
                hasXIngressPath = Request.Headers.ContainsKey("x-ingress-path"),
                hasXRemoteUser = Request.Headers.ContainsKey("x-remote-user"),
                hasXHassUserId = Request.Headers.ContainsKey("x-hass-user-id"),
                hasAuthorization = Request.Headers.ContainsKey("Authorization"),
                contentType = Request.Headers.ContentType.ToString(),
                userAgent = Request.Headers.UserAgent.ToString(),
            },
        });
    }
}

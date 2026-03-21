using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;
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

        return Ok(new HealthResponse(
            Status: "ok",
            Timestamp: DateTime.UtcNow.ToString("O"),
            Version: settings.Version,
            Environment: new EnvironmentInfo(
                HasSupervisorToken: hasSupervisorToken,
                HasHassioToken: !string.IsNullOrEmpty(System.Environment.GetEnvironmentVariable("HASSIO_TOKEN")),
                SupervisorTokenSource: System.Environment.GetEnvironmentVariable("SUPERVISOR_TOKEN") != null ? "env"
                    : System.IO.File.Exists("/tmp/supervisor_token") ? "file" : "none",
                DotnetEnv: System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                Hostname: System.Environment.GetEnvironmentVariable("HOSTNAME"),
                AllEnvVars: allEnvVars),
            RequestHeaders: new RequestHeadersInfo(
                HasXIngressPath: Request.Headers.ContainsKey("x-ingress-path"),
                HasXRemoteUser: Request.Headers.ContainsKey("x-remote-user"),
                HasXHassUserId: Request.Headers.ContainsKey("x-hass-user-id"),
                HasAuthorization: Request.Headers.ContainsKey("Authorization"),
                ContentType: Request.Headers.ContentType.ToString(),
                UserAgent: Request.Headers.UserAgent.ToString())));
    }
}

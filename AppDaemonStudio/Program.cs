using System.Text.Json;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Middleware;
using AppDaemonStudio.Services;

var builder = WebApplication.CreateBuilder(args);

// Listen on port 3000 (matches existing ingress_port in config.json)
builder.WebHost.UseUrls($"http://+:{Environment.GetEnvironmentVariable("PORT") ?? "3000"}");

// JSON: snake_case output + input to match frontend expectations
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    o.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower;
});

builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

// CORS for standalone / dev mode
builder.Services.AddCors(opt => opt.AddPolicy("ApiCors", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// App services
builder.Services.AddSingleton<AppSettings>();
builder.Services.AddScoped<IFileManagerService, FileManagerService>();
builder.Services.AddSingleton<IHomeAssistantService, HomeAssistantService>();
builder.Services.AddScoped<IVersionControlService, VersionControlService>();
builder.Services.AddSingleton<ILogReaderService, LogReaderService>();

builder.Services.AddSingleton<IAppDaemonApiService, AppDaemonApiService>();

// LSP service (no-op when pylsp venv is absent)
builder.Services.AddSingleton<LspService>();
builder.Services.AddSingleton<ILspService>(sp => sp.GetRequiredService<LspService>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<LspService>());

var app = builder.Build();

app.UseCors("ApiCors");
app.UseMiddleware<IngressGuardMiddleware>();
app.UseWebSockets();

// Cache-busting: index.html must never be cached (browser would serve stale JS hashes).
// Vite-hashed assets (*.js, *.css) can be cached forever — their hash changes with content.
var staticFileOptions = new Microsoft.AspNetCore.Builder.StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var headers = ctx.Context.Response.Headers;
        if (ctx.File.Name == "index.html")
            headers.CacheControl = "no-store";
        else if (Path.GetExtension(ctx.File.Name) is ".js" or ".css")
            headers.CacheControl = "public, max-age=31536000, immutable";
    }
};

app.UseStaticFiles(staticFileOptions);
app.MapControllers();
app.MapFallbackToFile("index.html", staticFileOptions);

app.Run();

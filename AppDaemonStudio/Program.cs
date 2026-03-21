using System.Text.Json;
using AppDaemonStudio.Configuration;
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

// CORS for standalone / dev mode
builder.Services.AddCors(opt => opt.AddPolicy("ApiCors", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// App services
builder.Services.AddSingleton<AppSettings>();
builder.Services.AddScoped<IFileManagerService, FileManagerService>();
builder.Services.AddScoped<IHomeAssistantService, HomeAssistantService>();
builder.Services.AddScoped<IVersionControlService, VersionControlService>();
builder.Services.AddSingleton<ILogReaderService, LogReaderService>();

// LSP service (no-op when pylsp venv is absent)
builder.Services.AddSingleton<LspService>();
builder.Services.AddSingleton<ILspService>(sp => sp.GetRequiredService<LspService>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<LspService>());

var app = builder.Build();

app.UseCors("ApiCors");
app.UseWebSockets();
app.UseStaticFiles();        // serves wwwroot/
app.MapControllers();
app.MapFallbackToFile("index.html");   // SPA fallback

app.Run();

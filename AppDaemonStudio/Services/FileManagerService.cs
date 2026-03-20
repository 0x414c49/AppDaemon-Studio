using System.Text;
using System.Text.RegularExpressions;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public partial class FileManagerService(AppSettings settings, ILogger<FileManagerService> logger) : IFileManagerService
{
    [GeneratedRegex(@"^[a-z_][a-z0-9_]*$")]
    private static partial Regex AppNameRegex();

    [GeneratedRegex(@"class\s+(\w+)\s*\(")]
    private static partial Regex ClassNameRegex();

    private void ValidateName(string name)
    {
        if (!AppNameRegex().IsMatch(name))
            throw new ArgumentException($"Invalid app name '{name}'. Use only lowercase letters, digits, and underscores.");
    }

    private async Task EnsureAppsDirAsync()
    {
        Directory.CreateDirectory(settings.AppsDir);
        await Task.CompletedTask;
    }

    private async Task EnsureVersionsDirAsync()
    {
        Directory.CreateDirectory(settings.VersionsDir);
        await Task.CompletedTask;
    }

    // ── apps.yaml hand-rolled parser (matches TypeScript behavior) ────────────

    private static Dictionary<string, Dictionary<string, string>> ParseAppsYaml(string content)
    {
        var config = new Dictionary<string, Dictionary<string, string>>();
        string? currentApp = null;
        Dictionary<string, string>? currentConfig = null;

        foreach (var line in content.Split('\n'))
        {
            var trimmed = line.TrimEnd();
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.TrimStart().StartsWith('#'))
                continue;

            if (!line.StartsWith(' ') && trimmed.EndsWith(':'))
            {
                if (currentApp != null && currentConfig != null)
                    config[currentApp] = currentConfig;

                currentApp = trimmed[..^1];
                currentConfig = new Dictionary<string, string> { ["module"] = currentApp, ["class"] = currentApp };
            }
            else if (currentApp != null && currentConfig != null && line.StartsWith("  "))
            {
                var colonIdx = trimmed.TrimStart().IndexOf(':');
                if (colonIdx > 0)
                {
                    var key = trimmed.TrimStart()[..colonIdx].Trim();
                    var value = trimmed.TrimStart()[(colonIdx + 1)..].Trim();
                    currentConfig[key] = value;
                }
            }
        }

        if (currentApp != null && currentConfig != null)
            config[currentApp] = currentConfig;

        return config;
    }

    private static string StringifyAppsYaml(Dictionary<string, Dictionary<string, string>> config)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# AppDaemon Apps Configuration");
        sb.AppendLine($"# Generated: {DateTime.UtcNow:O}");
        sb.AppendLine();

        foreach (var (appName, appConfig) in config)
        {
            sb.AppendLine($"{appName}:");
            if (appConfig.TryGetValue("module", out var module)) sb.AppendLine($"  module: {module}");
            if (appConfig.TryGetValue("class", out var cls)) sb.AppendLine($"  class: {cls}");
            if (appConfig.TryGetValue("description", out var desc) && !string.IsNullOrEmpty(desc)) sb.AppendLine($"  description: {desc}");
            if (appConfig.TryGetValue("icon", out var icon) && !string.IsNullOrEmpty(icon)) sb.AppendLine($"  icon: {icon}");

            foreach (var (key, value) in appConfig)
            {
                if (key is "module" or "class" or "description" or "icon") continue;
                sb.AppendLine($"  {key}: {value}");
            }

            sb.AppendLine();
        }

        return sb.ToString();
    }

    private async Task<Dictionary<string, Dictionary<string, string>>> ReadAppsConfigAsync()
    {
        try
        {
            var content = await File.ReadAllTextAsync(settings.AppsYaml);
            return ParseAppsYaml(content);
        }
        catch
        {
            return new Dictionary<string, Dictionary<string, string>>();
        }
    }

    private async Task WriteAppsConfigAsync(Dictionary<string, Dictionary<string, string>> config)
    {
        await EnsureAppsDirAsync();
        await File.WriteAllTextAsync(settings.AppsYaml, StringifyAppsYaml(config));
    }

    private static async Task<string> ExtractClassNameAsync(string filePath)
    {
        try
        {
            var content = await File.ReadAllTextAsync(filePath);
            var m = ClassNameRegex().Match(content);
            return m.Success ? m.Groups[1].Value : "App";
        }
        catch { return "App"; }
    }

    private static string GeneratePythonTemplate(string name, string className, string? description)
    {
        var desc = string.IsNullOrEmpty(description) ? $"{className} AppDaemon app" : description;
        var sb = new StringBuilder();
        sb.AppendLine("import appdaemon.plugins.hass.hassapi as hass");
        sb.AppendLine();
        sb.AppendLine();
        sb.AppendLine($"class {className}(hass.Hass):");
        sb.AppendLine($"    \"\"\"{desc}\"\"\"");
        sb.AppendLine();
        sb.AppendLine("    def initialize(self):");
        sb.AppendLine($"        self.log(\"Hello from {className}!\")");
        sb.AppendLine();
        return sb.ToString();
    }

    // ── Public interface ───────────────────────────────────────────────────────

    public async Task<List<AppInfo>> ListAppsAsync()
    {
        await EnsureAppsDirAsync();
        var config = await ReadAppsConfigAsync();
        var apps = new List<AppInfo>();

        var pyFiles = Directory.GetFiles(settings.AppsDir, "*.py")
            .Where(f => !Path.GetFileName(f).StartsWith('.'))
            .ToList();

        foreach (var pyFile in pyFiles)
        {
            var appName = Path.GetFileNameWithoutExtension(pyFile);
            config.TryGetValue(appName, out var appConfig);

            string className, description, icon;
            if (appConfig != null)
            {
                appConfig.TryGetValue("class", out var c); className = c ?? appName;
                appConfig.TryGetValue("description", out var d); description = d ?? "";
                appConfig.TryGetValue("icon", out var i); icon = i ?? "mdi:application";
            }
            else
            {
                className = await ExtractClassNameAsync(pyFile);
                description = "";
                icon = "mdi:application";
            }

            var mtime = File.GetLastWriteTimeUtc(pyFile);
            var versionCount = 0;
            try
            {
                await EnsureVersionsDirAsync();
                versionCount = Directory.GetFiles(settings.VersionsDir, $"{appName}_*.py").Length;
            }
            catch { }

            apps.Add(new AppInfo(appName, className, description, true, true, mtime.ToString("O"), versionCount, icon));
        }

        // Apps in yaml but no .py file
        foreach (var (appName, appConfig) in config)
        {
            if (apps.Any(a => a.Name == appName)) continue;
            appConfig.TryGetValue("class", out var cls);
            appConfig.TryGetValue("description", out var desc);
            appConfig.TryGetValue("icon", out var icon);
            apps.Add(new AppInfo(appName, cls ?? appName, desc ?? "", false, true, DateTime.UtcNow.ToString("O"), 0, icon));
        }

        apps.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.Ordinal));
        return apps;
    }

    public async Task<AppInfo> CreateAppAsync(CreateAppRequest request)
    {
        ValidateName(request.Name);

        var pyPath = Path.Combine(settings.AppsDir, $"{request.Name}.py");
        if (File.Exists(pyPath))
            throw new InvalidOperationException($"App '{request.Name}' already exists");

        var config = await ReadAppsConfigAsync();
        config[request.Name] = new Dictionary<string, string>
        {
            ["module"] = request.Name,
            ["class"] = request.ClassName,
            ["description"] = request.Description ?? "",
            ["icon"] = request.Icon ?? "mdi:application",
        };
        await WriteAppsConfigAsync(config);

        var pythonContent = GeneratePythonTemplate(request.Name, request.ClassName, request.Description);
        await File.WriteAllTextAsync(pyPath, pythonContent);
        await EnsureVersionsDirAsync();

        logger.LogInformation("Created app {AppName}", request.Name);
        return new AppInfo(request.Name, request.ClassName, request.Description ?? "", true, true,
            DateTime.UtcNow.ToString("O"), 0, request.Icon);
    }

    public async Task DeleteAppAsync(string name)
    {
        ValidateName(name);

        var pyPath = Path.Combine(settings.AppsDir, $"{name}.py");
        var config = await ReadAppsConfigAsync();

        if (!config.ContainsKey(name) && !File.Exists(pyPath))
            throw new FileNotFoundException($"App '{name}' not found");

        config.Remove(name);
        await WriteAppsConfigAsync(config);

        if (File.Exists(pyPath)) File.Delete(pyPath);
        logger.LogInformation("Deleted app {AppName}", name);
    }

    public async Task<FileContent> ReadPythonFileAsync(string appName)
    {
        ValidateName(appName);
        var filePath = Path.Combine(settings.AppsDir, $"{appName}.py");
        if (!File.Exists(filePath))
            throw new FileNotFoundException($"App '{appName}' not found");

        var content = await File.ReadAllTextAsync(filePath);
        var mtime = File.GetLastWriteTimeUtc(filePath);
        return new FileContent(content, mtime.ToString("O"));
    }

    public async Task WritePythonFileAsync(string appName, string content)
    {
        ValidateName(appName);
        var filePath = Path.Combine(settings.AppsDir, $"{appName}.py");
        await File.WriteAllTextAsync(filePath, content);
    }

    public async Task<FileContent> ReadAppsYamlAsync()
    {
        try
        {
            var content = await File.ReadAllTextAsync(settings.AppsYaml);
            var mtime = File.GetLastWriteTimeUtc(settings.AppsYaml);
            return new FileContent(content, mtime.ToString("O"));
        }
        catch
        {
            return new FileContent("# AppDaemon Apps Configuration\n", DateTime.UtcNow.ToString("O"));
        }
    }

    public async Task WriteAppsYamlAsync(string content)
    {
        await EnsureAppsDirAsync();
        await File.WriteAllTextAsync(settings.AppsYaml, content);
    }
}

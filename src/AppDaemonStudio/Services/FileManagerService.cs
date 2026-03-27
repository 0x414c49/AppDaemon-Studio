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

    private void EnsureAppsDir() => Directory.CreateDirectory(settings.AppsDir);
    private void EnsureVersionsDir() => Directory.CreateDirectory(settings.VersionsDir);

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

    private static List<(string Name, Dictionary<string, string> Fields, int Line)> ParseAppsYamlRaw(string content)
    {
        var result = new List<(string, Dictionary<string, string>, int)>();
        string? currentApp = null;
        Dictionary<string, string>? currentFields = null;
        int currentLine = 0;

        var lines = content.Split('\n');
        for (int i = 0; i < lines.Length; i++)
        {
            var raw = lines[i];
            var trimmed = raw.TrimEnd();
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.TrimStart().StartsWith('#'))
                continue;

            if (!raw.StartsWith(' ') && trimmed.EndsWith(':'))
            {
                if (currentApp != null && currentFields != null)
                    result.Add((currentApp, currentFields, currentLine));
                currentApp = trimmed[..^1];
                currentFields = new Dictionary<string, string>();
                currentLine = i + 1; // 1-based
            }
            else if (currentApp != null && currentFields != null && raw.StartsWith("  "))
            {
                var t = trimmed.TrimStart();
                var colonIdx = t.IndexOf(':');
                if (colonIdx > 0)
                    currentFields[t[..colonIdx].Trim()] = t[(colonIdx + 1)..].Trim();
            }
        }
        if (currentApp != null && currentFields != null)
            result.Add((currentApp, currentFields, currentLine));
        return result;
    }

    private static string StringifyAppsYaml(Dictionary<string, Dictionary<string, string>> config)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# AppDaemon Apps Configuration");
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
        EnsureAppsDir();
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
        EnsureAppsDir();
        logger.LogInformation("Listing apps from {AppsDir}", settings.AppsDir);
        var config = await ReadAppsConfigAsync();
        var apps = new List<AppInfo>();
        var claimedModules = new HashSet<string>(StringComparer.Ordinal);
        EnsureVersionsDir();

        // Primary: yaml entries
        foreach (var (instanceName, appConfig) in config)
        {
            var moduleName = appConfig.TryGetValue("module", out var m) && !string.IsNullOrEmpty(m) ? m : instanceName;
            claimedModules.Add(moduleName);
            appConfig.TryGetValue("class", out var cls);
            appConfig.TryGetValue("description", out var desc);
            appConfig.TryGetValue("icon", out var icon);
            appConfig.TryGetValue("disable", out var dis);
            var pyPath = Path.Combine(settings.AppsDir, $"{moduleName}.py");
            var hasPython = File.Exists(pyPath);
            var mtime = hasPython ? File.GetLastWriteTimeUtc(pyPath).ToString("O") : DateTime.UtcNow.ToString("O");
            var versionCount = Directory.EnumerateFiles(settings.VersionsDir, $"{moduleName}_*.py").Count();
            apps.Add(new AppInfo(instanceName, moduleName, cls ?? instanceName, desc ?? "", hasPython, true, mtime, versionCount, icon ?? "mdi:application", dis == "true"));
        }

        // Secondary: orphaned py files (not claimed by any yaml entry)
        foreach (var pyFile in Directory.EnumerateFiles(settings.AppsDir, "*.py"))
        {
            var fileName = Path.GetFileName(pyFile);
            if (fileName.StartsWith('.')) continue;
            var moduleName = Path.GetFileNameWithoutExtension(pyFile);
            if (claimedModules.Contains(moduleName)) continue;
            var className = await ExtractClassNameAsync(pyFile);
            var mtime = File.GetLastWriteTimeUtc(pyFile);
            var versionCount = Directory.EnumerateFiles(settings.VersionsDir, $"{moduleName}_*.py").Count();
            apps.Add(new AppInfo(moduleName, moduleName, className, "", true, false, mtime.ToString("O"), versionCount, "mdi:application", false));
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
        EnsureVersionsDir();

        logger.LogInformation("Created app {AppName}", request.Name);
        return new AppInfo(request.Name, request.Name, request.ClassName, request.Description ?? "", true, true,
            DateTime.UtcNow.ToString("O"), 0, request.Icon);
    }

    public async Task DeleteAppAsync(string name)
    {
        ValidateName(name);
        var config = await ReadAppsConfigAsync();

        if (config.TryGetValue(name, out var appConfig))
        {
            var moduleName = appConfig.TryGetValue("module", out var m) && !string.IsNullOrEmpty(m) ? m : name;
            config.Remove(name);
            await WriteAppsConfigAsync(config);
            // Only delete py file if no remaining yaml entry references this module
            var stillUsed = config.Values.Any(c => (c.TryGetValue("module", out var mod) ? mod : "") == moduleName);
            if (!stillUsed)
            {
                var pyPath = Path.Combine(settings.AppsDir, $"{moduleName}.py");
                if (File.Exists(pyPath)) File.Delete(pyPath);
            }
            logger.LogInformation("Deleted app {AppName}", name);
            return;
        }

        // Orphaned py file
        var orphanPath = Path.Combine(settings.AppsDir, $"{name}.py");
        if (File.Exists(orphanPath))
        {
            File.Delete(orphanPath);
            logger.LogInformation("Deleted orphaned app {AppName}", name);
            return;
        }

        throw new FileNotFoundException($"App '{name}' not found");
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

    private static IEnumerable<YamlIssue> GetStrayLineIssues(string content)
    {
        var lines = content.Split('\n');
        for (int i = 0; i < lines.Length; i++)
        {
            var raw = lines[i];
            var trimmed = raw.TrimEnd();
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.TrimStart().StartsWith('#'))
                continue;
            if (!raw.StartsWith(' ') && !raw.StartsWith('\t') && trimmed.EndsWith(':'))
                continue;
            if (raw.StartsWith(' ') || raw.StartsWith('\t'))
                continue;
            yield return new YamlIssue("", $"Unexpected content: '{trimmed}'", "error", i + 1);
        }
    }

    public async Task<List<YamlIssue>> ValidateAppsYamlAsync(string content)
    {
        var issues = new List<YamlIssue>();
        issues.AddRange(GetStrayLineIssues(content));
        var entries = ParseAppsYamlRaw(content);
        var existingConfig = await ReadAppsConfigAsync();

        foreach (var (appName, fields, line) in entries)
        {
            if (!fields.TryGetValue("module", out var moduleName) || string.IsNullOrEmpty(moduleName))
            {
                issues.Add(new YamlIssue(appName, $"'{appName}': missing required 'module' field", "error", line));
                continue;
            }
            if (!fields.TryGetValue("class", out var className) || string.IsNullOrEmpty(className))
            {
                issues.Add(new YamlIssue(appName, $"'{appName}': missing required 'class' field", "error", line));
                continue;
            }
            var pyPath = Path.Combine(settings.AppsDir, $"{moduleName}.py");
            if (!File.Exists(pyPath))
            {
                bool isNew = !existingConfig.ContainsKey(appName);
                if (isNew)
                    issues.Add(new YamlIssue(appName, $"'{appName}': module file '{moduleName}.py' will be created on save", "info", line));
                else
                    issues.Add(new YamlIssue(appName, $"'{appName}': module file '{moduleName}.py' not found — did you rename it? Update the 'module' field to match.", "error", line));
            }
        }
        return issues;
    }

    public async Task<List<string>> WriteAppsYamlAsync(string content)
    {
        var oldConfig = await ReadAppsConfigAsync();
        var entries = ParseAppsYamlRaw(content);
        var hardErrors = new List<YamlIssue>();
        hardErrors.AddRange(GetStrayLineIssues(content));
        var createdFiles = new List<string>();

        foreach (var (appName, fields, line) in entries)
        {
            if (!fields.TryGetValue("module", out var moduleName) || string.IsNullOrEmpty(moduleName))
            {
                hardErrors.Add(new YamlIssue(appName, $"'{appName}': missing required 'module' field", "error", line));
                continue;
            }
            if (!fields.TryGetValue("class", out var className) || string.IsNullOrEmpty(className))
            {
                hardErrors.Add(new YamlIssue(appName, $"'{appName}': missing required 'class' field", "error", line));
                continue;
            }
            var pyPath = Path.Combine(settings.AppsDir, $"{moduleName}.py");
            if (!File.Exists(pyPath))
            {
                if (!oldConfig.ContainsKey(appName))
                {
                    EnsureAppsDir();
                    await File.WriteAllTextAsync(pyPath, GeneratePythonTemplate(moduleName, className, null));
                    createdFiles.Add($"{moduleName}.py");
                }
                else
                {
                    hardErrors.Add(new YamlIssue(appName, $"'{appName}': module file '{moduleName}.py' not found — did you rename it? Update the 'module' field to match.", "error", line));
                }
            }
        }

        if (hardErrors.Count > 0)
            throw new YamlValidationException(hardErrors);

        EnsureAppsDir();
        await File.WriteAllTextAsync(settings.AppsYaml, content);
        return createdFiles;
    }

    public async Task SetAppDisabledAsync(string name, bool disabled)
    {
        ValidateName(name);
        var config = await ReadAppsConfigAsync();
        if (!config.TryGetValue(name, out var appConfig))
            throw new FileNotFoundException($"App '{name}' not found");

        if (disabled)
            appConfig["disable"] = "true";
        else
            appConfig.Remove("disable");

        await WriteAppsConfigAsync(config);
        logger.LogInformation("App {AppName} {Action}", name, disabled ? "disabled" : "enabled");
    }
}

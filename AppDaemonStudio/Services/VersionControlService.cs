using System.Text.RegularExpressions;
using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;

namespace AppDaemonStudio.Services;

public partial class VersionControlService(AppSettings settings, ILogger<VersionControlService> logger) : IVersionControlService
{
    [GeneratedRegex(@"^(.+)_(\d{14})\.py$")]
    private static partial Regex VersionFileRegex();

    private void EnsureVersionsDir() => Directory.CreateDirectory(settings.VersionsDir);

    private static string GenerateTimestamp() =>
        DateTime.UtcNow.ToString("yyyyMMddHHmmss");

    private static string FormatTimestamp(string ts)
    {
        // yyyyMMddHHmmss → ISO 8601
        if (ts.Length != 14) return ts;
        return $"{ts[..4]}-{ts[4..6]}-{ts[6..8]}T{ts[8..10]}:{ts[10..12]}:{ts[12..14]}.000Z";
    }

    public async Task<string> CreateVersionAsync(string appName, string content)
    {
        EnsureVersionsDir();
        var timestamp = GenerateTimestamp();
        var versionFile = Path.Combine(settings.VersionsDir, $"{appName}_{timestamp}.py");
        await File.WriteAllTextAsync(versionFile, content);
        logger.LogDebug("Created version {Timestamp} for {AppName}", timestamp, appName);
        return timestamp;
    }

    public Task<List<VersionInfo>> ListVersionsAsync(string appName)
    {
        try
        {
            EnsureVersionsDir();
        }
        catch
        {
            return Task.FromResult(new List<VersionInfo>());
        }

        var versions = new List<VersionInfo>();
        foreach (var file in Directory.GetFiles(settings.VersionsDir, $"{appName}_*.py"))
        {
            var filename = Path.GetFileName(file);
            var m = VersionFileRegex().Match(filename);
            if (!m.Success || m.Groups[1].Value != appName) continue;

            var timestamp = m.Groups[2].Value;
            var size = new FileInfo(file).Length;
            versions.Add(new VersionInfo(timestamp, FormatTimestamp(timestamp), size, filename));
        }

        versions.Sort((a, b) => string.Compare(b.Version, a.Version, StringComparison.Ordinal));
        return Task.FromResult(versions);
    }

    public async Task<FileContent> GetVersionAsync(string appName, string version)
    {
        var versionFile = Path.Combine(settings.VersionsDir, $"{appName}_{version}.py");
        if (!File.Exists(versionFile))
            throw new FileNotFoundException($"Version '{version}' not found");

        var content = await File.ReadAllTextAsync(versionFile);
        var mtime = File.GetLastWriteTimeUtc(versionFile);
        return new FileContent(content, mtime.ToString("O"));
    }

    public async Task<FileContent> RestoreVersionAsync(string appName, string version)
    {
        var versionPath = Path.Combine(settings.VersionsDir, $"{appName}_{version}.py");
        if (!File.Exists(versionPath))
            throw new FileNotFoundException($"Version '{version}' not found");

        var targetPath = Path.Combine(settings.AppsDir, $"{appName}.py");
        var content = await File.ReadAllTextAsync(versionPath);
        await File.WriteAllTextAsync(targetPath, content);
        logger.LogInformation("Restored version {Version} for {AppName}", version, appName);
        return new FileContent(content, DateTime.UtcNow.ToString("O"));
    }

    public Task DeleteVersionAsync(string appName, string version)
    {
        var versionFile = Path.Combine(settings.VersionsDir, $"{appName}_{version}.py");
        if (!File.Exists(versionFile))
            throw new FileNotFoundException($"Version '{version}' not found");

        File.Delete(versionFile);
        return Task.CompletedTask;
    }
}

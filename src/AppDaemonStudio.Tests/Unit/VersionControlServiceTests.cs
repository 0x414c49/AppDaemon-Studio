using AppDaemonStudio.Configuration;
using AppDaemonStudio.Services;
using AppDaemonStudio.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppDaemonStudio.Tests.Unit;

public sealed class VersionControlServiceTests : IDisposable
{
    private readonly string _appsDir = Path.Combine(Path.GetTempPath(), $"vc_test_{Guid.NewGuid():N}");
    private readonly EnvScope _envScope;
    private readonly VersionControlService _sut;

    public VersionControlServiceTests()
    {
        Directory.CreateDirectory(_appsDir);
        _envScope = new EnvScope(("APPS_DIR", _appsDir));
        _sut = new VersionControlService(new AppSettings(), NullLogger<VersionControlService>.Instance);
    }

    public void Dispose()
    {
        _envScope.Dispose();
        if (Directory.Exists(_appsDir)) Directory.Delete(_appsDir, recursive: true);
    }

    [Fact]
    public async Task CreateVersionAsync_WritesVersionFile()
    {
        const string content = "class MyApp: pass\n";
        var ts = await _sut.CreateVersionAsync("my_app", content);

        Assert.Matches(@"^\d{14}$", ts);
        var versionsDir = Path.Combine(_appsDir, ".versions");
        Assert.True(File.Exists(Path.Combine(versionsDir, $"my_app_{ts}.py")));
    }

    [Fact]
    public async Task ListVersionsAsync_NoVersions_ReturnsEmpty()
    {
        var versions = await _sut.ListVersionsAsync("nonexistent_app");
        Assert.Empty(versions);
    }

    [Fact]
    public async Task ListVersionsAsync_MultipleVersions_SortedNewestFirst()
    {
        // Write version files directly with known timestamps — no Task.Delay needed
        var versionsDir = Path.Combine(_appsDir, ".versions");
        Directory.CreateDirectory(versionsDir);
        await File.WriteAllTextAsync(Path.Combine(versionsDir, "app_a_20240101120000.py"), "v1");
        await File.WriteAllTextAsync(Path.Combine(versionsDir, "app_a_20240101120001.py"), "v2");

        var versions = await _sut.ListVersionsAsync("app_a");
        Assert.Equal(2, versions.Count);
        // Sorted newest first (descending string compare of yyyyMMddHHmmss)
        Assert.True(string.Compare(versions[0].Version, versions[1].Version, StringComparison.Ordinal) > 0);
    }

    [Fact]
    public async Task GetVersionAsync_ReturnsCorrectContent()
    {
        const string content = "original content";
        var ts = await _sut.CreateVersionAsync("get_app", content);
        var file = await _sut.GetVersionAsync("get_app", ts);
        Assert.Equal(content, file.Content);
    }

    [Fact]
    public async Task GetVersionAsync_NonExistent_Throws()
    {
        await Assert.ThrowsAsync<FileNotFoundException>(() =>
            _sut.GetVersionAsync("app", "20000101000000"));
    }

    [Fact]
    public async Task RestoreVersionAsync_CopiesContentToAppsDir()
    {
        Directory.CreateDirectory(_appsDir);
        const string content = "restored content";
        var ts = await _sut.CreateVersionAsync("restore_app", content);

        await _sut.RestoreVersionAsync("restore_app", ts);

        var targetPath = Path.Combine(_appsDir, "restore_app.py");
        Assert.True(File.Exists(targetPath));
        Assert.Equal(content, await File.ReadAllTextAsync(targetPath));
    }

    [Fact]
    public async Task RestoreVersionAsync_NonExistent_Throws()
    {
        await Assert.ThrowsAsync<FileNotFoundException>(() =>
            _sut.RestoreVersionAsync("app", "20000101000000"));
    }

    [Fact]
    public async Task DeleteVersionAsync_RemovesFile()
    {
        var ts = await _sut.CreateVersionAsync("del_app", "content");
        await _sut.DeleteVersionAsync("del_app", ts);

        var versions = await _sut.ListVersionsAsync("del_app");
        Assert.Empty(versions);
    }

    [Fact]
    public async Task DeleteVersionAsync_NonExistent_Throws()
    {
        await Assert.ThrowsAsync<FileNotFoundException>(() =>
            _sut.DeleteVersionAsync("app", "20000101000000"));
    }

    [Fact]
    public async Task ListVersionsAsync_DoesNotIncludeOtherApps()
    {
        await _sut.CreateVersionAsync("app_x", "x content");
        await _sut.CreateVersionAsync("app_y", "y content");

        var xVersions = await _sut.ListVersionsAsync("app_x");
        Assert.Single(xVersions);
        Assert.All(xVersions, v => Assert.StartsWith("app_x_", v.Filename));
    }
}

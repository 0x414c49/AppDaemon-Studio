using AppDaemonStudio.Configuration;
using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppDaemonStudio.Tests.Unit;

/// <summary>
/// Tests FileManagerService using a real temp directory — no filesystem mocking needed.
/// </summary>
public sealed class FileManagerServiceTests : IDisposable
{
    private readonly string _appsDir = Path.Combine(Path.GetTempPath(), $"fm_test_{Guid.NewGuid():N}");
    private readonly FileManagerService _sut;

    public FileManagerServiceTests()
    {
        Environment.SetEnvironmentVariable("APPS_DIR", _appsDir);
        _sut = new FileManagerService(new AppSettings(), NullLogger<FileManagerService>.Instance);
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable("APPS_DIR", null);
        if (Directory.Exists(_appsDir)) Directory.Delete(_appsDir, recursive: true);
    }

    // ── ListAppsAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ListAppsAsync_EmptyDir_ReturnsEmpty()
    {
        var result = await _sut.ListAppsAsync();
        Assert.Empty(result);
    }

    [Fact]
    public async Task ListAppsAsync_PythonFileWithNoYaml_AppIncluded()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "my_app.py"),
            "import appdaemon.plugins.hass.hassapi as hass\nclass MyApp(hass.Hass):\n  pass\n");

        var result = await _sut.ListAppsAsync();
        var app = Assert.Single(result);
        Assert.Equal("my_app", app.Name);
        Assert.True(app.HasPython);
    }

    [Fact]
    public async Task ListAppsAsync_HiddenPyFile_Excluded()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, ".hidden.py"), "");

        var result = await _sut.ListAppsAsync();
        Assert.Empty(result);
    }

    [Fact]
    public async Task ListAppsAsync_MultipleApps_SortedByName()
    {
        Directory.CreateDirectory(_appsDir);
        foreach (var name in new[] { "z_app", "a_app", "m_app" })
            await File.WriteAllTextAsync(Path.Combine(_appsDir, $"{name}.py"), "");

        var result = await _sut.ListAppsAsync();
        Assert.Equal(["a_app", "m_app", "z_app"], result.Select(a => a.Name));
    }

    // ── CreateAppAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAppAsync_ValidRequest_CreatesFileAndYaml()
    {
        var req = new CreateAppRequest { Name = "test_app", ClassName = "TestApp", Description = "A test app", Icon = "mdi:test" };
        var app = await _sut.CreateAppAsync(req);

        Assert.Equal("test_app", app.Name);
        Assert.Equal("TestApp", app.ClassName);
        Assert.True(File.Exists(Path.Combine(_appsDir, "test_app.py")));

        var yamlContent = await File.ReadAllTextAsync(Path.Combine(_appsDir, "apps.yaml"));
        Assert.Contains("test_app:", yamlContent);
        Assert.Contains("class: TestApp", yamlContent);
    }

    [Fact]
    public async Task CreateAppAsync_DuplicateName_Throws()
    {
        var req = new CreateAppRequest { Name = "dup_app", ClassName = "DupApp" };
        await _sut.CreateAppAsync(req);
        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CreateAppAsync(req));
    }

    [Fact]
    public async Task CreateAppAsync_InvalidName_Throws()
    {
        var req = new CreateAppRequest { Name = "Invalid-Name", ClassName = "App" };
        await Assert.ThrowsAsync<ArgumentException>(() => _sut.CreateAppAsync(req));
    }

    [Theory]
    [InlineData("valid_name")]
    [InlineData("a")]
    [InlineData("app123")]
    [InlineData("_private")]
    public async Task CreateAppAsync_ValidNames_DoNotThrow(string name)
    {
        var req = new CreateAppRequest { Name = name, ClassName = "App" };
        var app = await _sut.CreateAppAsync(req);
        Assert.Equal(name, app.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData("1starts_with_digit")]
    [InlineData("has-hyphen")]
    [InlineData("has.dot")]
    [InlineData("HAS_UPPER")]
    public async Task CreateAppAsync_InvalidNames_Throw(string name)
    {
        var req = new CreateAppRequest { Name = name, ClassName = "App" };
        await Assert.ThrowsAsync<ArgumentException>(() => _sut.CreateAppAsync(req));
    }

    // ── DeleteAppAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAppAsync_ExistingApp_DeletesFile()
    {
        await _sut.CreateAppAsync(new CreateAppRequest { Name = "del_app", ClassName = "DelApp" });
        await _sut.DeleteAppAsync("del_app");
        Assert.False(File.Exists(Path.Combine(_appsDir, "del_app.py")));
    }

    [Fact]
    public async Task DeleteAppAsync_NonExistentApp_Throws()
    {
        await Assert.ThrowsAsync<FileNotFoundException>(() => _sut.DeleteAppAsync("ghost_app"));
    }

    // ── ReadPythonFileAsync / WritePythonFileAsync ─────────────────────────────

    [Fact]
    public async Task ReadWritePython_RoundTrip()
    {
        await _sut.CreateAppAsync(new CreateAppRequest { Name = "rw_app", ClassName = "RwApp" });
        const string content = "class RwApp: pass\n";
        await _sut.WritePythonFileAsync("rw_app", content);
        var result = await _sut.ReadPythonFileAsync("rw_app");
        Assert.Equal(content, result.Content);
    }

    [Fact]
    public async Task ReadPythonFileAsync_NonExistent_Throws()
    {
        await Assert.ThrowsAsync<FileNotFoundException>(() => _sut.ReadPythonFileAsync("missing_app"));
    }

    // ── ReadAppsYamlAsync / WriteAppsYamlAsync ─────────────────────────────────

    [Fact]
    public async Task ReadAppsYamlAsync_NoFile_ReturnsDefault()
    {
        Directory.CreateDirectory(_appsDir);
        var result = await _sut.ReadAppsYamlAsync();
        Assert.Contains("AppDaemon", result.Content);
    }

    [Fact]
    public async Task WriteAppsYamlAsync_WritesRawContent()
    {
        const string yaml = "my_app:\n  module: my_app\n  class: MyApp\n";
        await _sut.WriteAppsYamlAsync(yaml);
        var result = await _sut.ReadAppsYamlAsync();
        Assert.Equal(yaml, result.Content);
    }

    // ── SetAppDisabledAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task SetAppDisabledAsync_DisablesAndEnables()
    {
        await _sut.CreateAppAsync(new CreateAppRequest { Name = "toggle_app", ClassName = "ToggleApp" });

        await _sut.SetAppDisabledAsync("toggle_app", true);
        var apps = await _sut.ListAppsAsync();
        Assert.True(apps.First(a => a.Name == "toggle_app").Disabled);

        await _sut.SetAppDisabledAsync("toggle_app", false);
        apps = await _sut.ListAppsAsync();
        Assert.False(apps.First(a => a.Name == "toggle_app").Disabled);
    }

    [Fact]
    public async Task SetAppDisabledAsync_NonExistentApp_Throws()
    {
        await Assert.ThrowsAsync<FileNotFoundException>(() =>
            _sut.SetAppDisabledAsync("no_such_app", true));
    }

    // ── YAML no-timestamp ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAppAsync_GeneratedYaml_ContainsNoTimestamp()
    {
        await _sut.CreateAppAsync(new CreateAppRequest { Name = "stamp_app", ClassName = "StampApp" });
        var yaml = await File.ReadAllTextAsync(Path.Combine(_appsDir, "apps.yaml"));
        Assert.DoesNotContain("Generated:", yaml);
    }
}

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
    public async Task WriteAppsYamlAsync_ValidYaml_WritesContent()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "my_app.py"), "class MyApp: pass\n");
        // Write empty apps.yaml so my_app is treated as existing
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"), "");
        // my_app.py exists, so this should succeed without auto-create
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

    // ── Yaml-as-truth: ListAppsAsync ──────────────────────────────────────────────

    [Fact]
    public async Task ListApps_InstanceNameDiffersFromModule_ShowsInstanceNotPhantom()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "pid_heatpump.py"),
            "class PIDHeatPump: pass\n");
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"),
            "vp_vardagsrum:\n  module: pid_heatpump\n  class: PIDHeatPump\n");

        var result = await _sut.ListAppsAsync();

        var app = Assert.Single(result);
        Assert.Equal("vp_vardagsrum", app.Name);
        Assert.Equal("pid_heatpump", app.Module);
        Assert.True(app.HasPython);
        Assert.True(app.HasYaml);
    }

    [Fact]
    public async Task ListApps_MultipleInstancesSameModule_BothListed()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "temperature_monitor.py"),
            "class TemperatureMonitor: pass\n");
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"),
            "bedroom:\n  module: temperature_monitor\n  class: TemperatureMonitor\n" +
            "kitchen:\n  module: temperature_monitor\n  class: TemperatureMonitor\n");

        var result = await _sut.ListAppsAsync();

        Assert.Equal(2, result.Count);
        Assert.All(result, a => Assert.Equal("temperature_monitor", a.Module));
        Assert.Contains(result, a => a.Name == "bedroom");
        Assert.Contains(result, a => a.Name == "kitchen");
    }

    [Fact]
    public async Task ListApps_OrphanedPyFile_ShownWithNoYaml()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "orphan.py"), "class Orphan: pass\n");
        // No apps.yaml entry for orphan

        var result = await _sut.ListAppsAsync();

        var app = Assert.Single(result);
        Assert.Equal("orphan", app.Name);
        Assert.Equal("orphan", app.Module);
        Assert.True(app.HasPython);
        Assert.False(app.HasYaml);
    }

    [Fact]
    public async Task ListApps_YamlEntryWithMissingModuleFile_HasPythonFalse()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"),
            "my_app:\n  module: missing_module\n  class: MyApp\n");

        var result = await _sut.ListAppsAsync();

        var app = Assert.Single(result);
        Assert.Equal("my_app", app.Name);
        Assert.Equal("missing_module", app.Module);
        Assert.False(app.HasPython);
    }

    // ── Yaml-as-truth: DeleteAppAsync ─────────────────────────────────────────────

    [Fact]
    public async Task DeleteApp_SharedModule_DoesNotDeletePyFile()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "temperature_monitor.py"),
            "class TemperatureMonitor: pass\n");
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"),
            "bedroom:\n  module: temperature_monitor\n  class: TemperatureMonitor\n" +
            "kitchen:\n  module: temperature_monitor\n  class: TemperatureMonitor\n");

        await _sut.DeleteAppAsync("bedroom");

        Assert.True(File.Exists(Path.Combine(_appsDir, "temperature_monitor.py")));
        var remaining = await _sut.ListAppsAsync();
        Assert.Single(remaining);
        Assert.Equal("kitchen", remaining[0].Name);
    }

    [Fact]
    public async Task DeleteApp_ExclusiveModule_DeletesPyFile()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "solo.py"), "class Solo: pass\n");
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"),
            "solo:\n  module: solo\n  class: Solo\n");

        await _sut.DeleteAppAsync("solo");

        Assert.False(File.Exists(Path.Combine(_appsDir, "solo.py")));
    }

    [Fact]
    public async Task DeleteApp_OrphanedPyFile_DeletesFile()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "orphan.py"), "class Orphan: pass\n");
        // No yaml entry

        await _sut.DeleteAppAsync("orphan");

        Assert.False(File.Exists(Path.Combine(_appsDir, "orphan.py")));
    }

    // ── ValidateAppsYamlAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task ValidateYaml_ValidYaml_ReturnsNoErrors()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "my_app.py"), "class MyApp: pass\n");
        const string yaml = "my_app:\n  module: my_app\n  class: MyApp\n";

        var issues = await _sut.ValidateAppsYamlAsync(yaml);

        Assert.Empty(issues.Where(i => i.Severity == "error"));
    }

    [Fact]
    public async Task ValidateYaml_MissingModule_ReturnsError()
    {
        Directory.CreateDirectory(_appsDir);
        const string yaml = "my_app:\n  class: MyApp\n";

        var issues = await _sut.ValidateAppsYamlAsync(yaml);

        Assert.Single(issues);
        Assert.Equal("error", issues[0].Severity);
        Assert.Contains("module", issues[0].Message);
        Assert.Equal("my_app", issues[0].App);
        Assert.Equal(1, issues[0].Line);
    }

    [Fact]
    public async Task ValidateYaml_MissingClass_ReturnsError()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "my_app.py"), "class MyApp: pass\n");
        const string yaml = "my_app:\n  module: my_app\n";

        var issues = await _sut.ValidateAppsYamlAsync(yaml);

        Assert.Single(issues);
        Assert.Equal("error", issues[0].Severity);
        Assert.Contains("class", issues[0].Message);
    }

    [Fact]
    public async Task ValidateYaml_ExistingEntryModuleFileGone_ReturnsError()
    {
        Directory.CreateDirectory(_appsDir);
        // Write yaml to disk first so it's "existing"
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"),
            "my_app:\n  module: my_app\n  class: MyApp\n");
        // But py file doesn't exist (simulate rename)
        const string yaml = "my_app:\n  module: my_app\n  class: MyApp\n";

        var issues = await _sut.ValidateAppsYamlAsync(yaml);

        Assert.Single(issues);
        Assert.Equal("error", issues[0].Severity);
        Assert.Contains("not found", issues[0].Message);
        Assert.Contains("rename", issues[0].Message);
    }

    [Fact]
    public async Task ValidateYaml_NewEntryModuleFileMissing_ReturnsInfo()
    {
        Directory.CreateDirectory(_appsDir);
        // Empty apps.yaml = no existing entries
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"), "");
        const string yaml = "new_app:\n  module: new_module\n  class: NewApp\n";

        var issues = await _sut.ValidateAppsYamlAsync(yaml);

        Assert.Single(issues);
        Assert.Equal("info", issues[0].Severity);
        Assert.Contains("will be created", issues[0].Message);
    }

    // ── WriteAppsYamlAsync (smart save) ──────────────────────────────────────

    [Fact]
    public async Task SmartSave_ValidYaml_WritesFile()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "my_app.py"), "class MyApp: pass\n");
        const string yaml = "my_app:\n  module: my_app\n  class: MyApp\n";

        var created = await _sut.WriteAppsYamlAsync(yaml);

        Assert.Empty(created);
        Assert.Equal(yaml, await File.ReadAllTextAsync(Path.Combine(_appsDir, "apps.yaml")));
    }

    [Fact]
    public async Task SmartSave_NewEntryMissingModuleFile_AutoCreatesIt()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"), "");
        const string yaml = "new_app:\n  module: new_module\n  class: NewApp\n";

        var created = await _sut.WriteAppsYamlAsync(yaml);

        Assert.Single(created);
        Assert.Equal("new_module.py", created[0]);
        Assert.True(File.Exists(Path.Combine(_appsDir, "new_module.py")));
    }

    [Fact]
    public async Task SmartSave_ExistingEntryMissingModuleFile_Rejects()
    {
        Directory.CreateDirectory(_appsDir);
        // Existing entry in yaml but py file gone (simulate rename)
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "apps.yaml"),
            "my_app:\n  module: my_app\n  class: MyApp\n");
        const string yaml = "my_app:\n  module: my_app\n  class: MyApp\n";

        var ex = await Assert.ThrowsAsync<YamlValidationException>(() => _sut.WriteAppsYamlAsync(yaml));
        Assert.Single(ex.Issues);
        Assert.Contains("not found", ex.Issues[0].Message);
    }

    [Fact]
    public async Task SmartSave_MissingModuleField_Rejects()
    {
        Directory.CreateDirectory(_appsDir);
        const string yaml = "my_app:\n  class: MyApp\n";

        var ex = await Assert.ThrowsAsync<YamlValidationException>(() => _sut.WriteAppsYamlAsync(yaml));
        Assert.Single(ex.Issues);
        Assert.Contains("module", ex.Issues[0].Message);
    }

    [Fact]
    public async Task SmartSave_MissingClassField_Rejects()
    {
        Directory.CreateDirectory(_appsDir);
        await File.WriteAllTextAsync(Path.Combine(_appsDir, "my_app.py"), "class MyApp: pass\n");
        const string yaml = "my_app:\n  module: my_app\n";

        var ex = await Assert.ThrowsAsync<YamlValidationException>(() => _sut.WriteAppsYamlAsync(yaml));
        Assert.Single(ex.Issues);
        Assert.Contains("class", ex.Issues[0].Message);
    }
}

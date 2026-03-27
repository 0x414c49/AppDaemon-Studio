using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AppDaemonStudio.Tests.Integration;

public sealed class YamlValidateControllerTests : IAsyncDisposable
{
    private readonly TestWebAppFactory _factory = new();
    private readonly HttpClient _client;

    public YamlValidateControllerTests()
    {
        _client = _factory.CreateClient();
    }

    private async Task CreateAppAsync(string name) =>
        await _client.PostAsJsonAsync("api/apps",
            new { name, class_name = "App", description = "", icon = "" });

    [Fact]
    public async Task Validate_ValidYaml_ReturnsNoIssues()
    {
        await CreateAppAsync("valid_app");
        const string yaml = "valid_app:\n  module: valid_app\n  class: App\n";
        var response = await _client.PostAsJsonAsync("api/yaml/validate", new { content = yaml });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(0, json.RootElement.GetProperty("issues").GetArrayLength());
    }

    [Fact]
    public async Task Validate_MissingModule_ReturnsErrorWithLineNumber()
    {
        const string yaml = "my_app:\n  class: MyApp\n";
        var response = await _client.PostAsJsonAsync("api/yaml/validate", new { content = yaml });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var issues = json.RootElement.GetProperty("issues");
        Assert.Equal(1, issues.GetArrayLength());
        Assert.Equal("error", issues[0].GetProperty("severity").GetString());
        Assert.Contains("module", issues[0].GetProperty("message").GetString());
        Assert.Equal(1, issues[0].GetProperty("line").GetInt32());
    }

    [Fact]
    public async Task Validate_MissingClass_ReturnsErrorWithLineNumber()
    {
        await CreateAppAsync("noclass_app");
        const string yaml = "noclass_app:\n  module: noclass_app\n";
        var response = await _client.PostAsJsonAsync("api/yaml/validate", new { content = yaml });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var issues = json.RootElement.GetProperty("issues");
        Assert.Equal(1, issues.GetArrayLength());
        Assert.Equal("error", issues[0].GetProperty("severity").GetString());
        Assert.Contains("class", issues[0].GetProperty("message").GetString());
    }

    [Fact]
    public async Task Validate_ModuleFileNotFound_ReturnsErrorWithLineNumber()
    {
        await CreateAppAsync("existing_app");
        // Reference a module file that doesn't exist (existing entry = error not info)
        const string yaml = "existing_app:\n  module: nonexistent_module\n  class: App\n";
        var response = await _client.PostAsJsonAsync("api/yaml/validate", new { content = yaml });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var issues = json.RootElement.GetProperty("issues");
        Assert.Equal(1, issues.GetArrayLength());
        Assert.Equal("error", issues[0].GetProperty("severity").GetString());
        Assert.Contains("not found", issues[0].GetProperty("message").GetString());
    }

    [Fact]
    public async Task Validate_NewEntryMissingFile_ReturnsInfoNotError()
    {
        // Empty apps dir = new entry
        const string yaml = "brand_new:\n  module: brand_new_module\n  class: BrandNew\n";
        var response = await _client.PostAsJsonAsync("api/yaml/validate", new { content = yaml });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var issues = json.RootElement.GetProperty("issues");
        Assert.Equal(1, issues.GetArrayLength());
        Assert.Equal("info", issues[0].GetProperty("severity").GetString());
        Assert.Contains("will be created", issues[0].GetProperty("message").GetString());
    }

    public async ValueTask DisposeAsync() => await _factory.DisposeAsync();
}

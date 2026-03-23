using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AppDaemonStudio.Tests.Integration;

public sealed class FilesControllerTests : IAsyncDisposable
{
    private readonly TestWebAppFactory _factory = new();
    private readonly HttpClient _client;

    public FilesControllerTests()
    {
        _client = _factory.CreateClient();
    }

    private async Task CreateAppAsync(string name) =>
        await _client.PostAsJsonAsync("api/apps",
            new { name, class_name = "App", description = "", icon = "" });

    // ── GET /api/files/{app} ──────────────────────────────────────────────────

    [Fact]
    public async Task GetPython_ExistingApp_Returns200WithContent()
    {
        await CreateAppAsync("read_app");
        var response = await _client.GetAsync("api/files/read_app");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.TryGetProperty("content", out _));
    }

    [Fact]
    public async Task GetPython_PythonAlias_SameResult()
    {
        await CreateAppAsync("alias_app");
        var r1 = await _client.GetAsync("api/files/alias_app");
        var r2 = await _client.GetAsync("api/files/alias_app/python");
        Assert.Equal(HttpStatusCode.OK, r1.StatusCode);
        Assert.Equal(HttpStatusCode.OK, r2.StatusCode);
    }

    [Fact]
    public async Task GetPython_NonExistent_Returns404()
    {
        var response = await _client.GetAsync("api/files/ghost_app");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── PUT /api/files/{app} ──────────────────────────────────────────────────

    [Fact]
    public async Task PutPython_UpdatesContent()
    {
        await CreateAppAsync("put_app");
        const string newContent = "class PutApp: pass\n";
        var put = await _client.PutAsJsonAsync("api/files/put_app", new { content = newContent });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var get = await _client.GetAsync("api/files/put_app");
        var json = JsonDocument.Parse(await get.Content.ReadAsStringAsync());
        Assert.Equal(newContent, json.RootElement.GetProperty("content").GetString());
    }

    [Fact]
    public async Task PutPython_AutoCreatesVersion()
    {
        await CreateAppAsync("ver_app");
        await _client.PutAsJsonAsync("api/files/ver_app", new { content = "v2 content" });

        var versions = await _client.GetAsync("api/versions/ver_app");
        var json = JsonDocument.Parse(await versions.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.GetProperty("count").GetInt32() >= 1);
    }

    // ── GET /api/files/{app}/yaml ─────────────────────────────────────────────

    [Fact]
    public async Task GetYaml_Returns200WithContent()
    {
        await CreateAppAsync("yaml_app");
        var response = await _client.GetAsync("api/files/yaml_app/yaml");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.TryGetProperty("content", out _));
    }

    [Fact]
    public async Task GetYaml_YmlAlias_SameResult()
    {
        await CreateAppAsync("yml_app");
        var r1 = await _client.GetAsync("api/files/yml_app/yaml");
        var r2 = await _client.GetAsync("api/files/yml_app/yml");
        Assert.Equal(HttpStatusCode.OK, r1.StatusCode);
        Assert.Equal(HttpStatusCode.OK, r2.StatusCode);
    }

    // ── PUT /api/files/{app}/yaml ─────────────────────────────────────────────

    [Fact]
    public async Task PutYaml_WritesRawContent()
    {
        await CreateAppAsync("putyaml_app");
        const string yaml = "putyaml_app:\n  module: putyaml_app\n  class: App\n";
        var put = await _client.PutAsJsonAsync("api/files/putyaml_app/yaml", new { content = yaml });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var get = await _client.GetAsync("api/files/putyaml_app/yaml");
        var json = JsonDocument.Parse(await get.Content.ReadAsStringAsync());
        Assert.Equal(yaml, json.RootElement.GetProperty("content").GetString());
    }

    // ── DELETE /api/files/{app} ───────────────────────────────────────────────

    [Fact]
    public async Task DeleteApp_ExistingApp_Returns204()
    {
        await CreateAppAsync("del_app");
        var response = await _client.DeleteAsync("api/files/del_app");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var get = await _client.GetAsync("api/files/del_app");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task DeleteApp_NonExistent_Returns404()
    {
        var response = await _client.DeleteAsync("api/files/ghost_app");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    public async ValueTask DisposeAsync() => await _factory.DisposeAsync();
}

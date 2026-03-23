using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AppDaemonStudio.Tests.Integration;

public sealed class VersionsControllerTests : IAsyncDisposable
{
    private readonly TestWebAppFactory _factory = new();
    private readonly HttpClient _client;

    public VersionsControllerTests()
    {
        _client = _factory.CreateClient();
    }

    private async Task CreateAndSaveAppAsync(string name, string content = "v1 content")
    {
        await _client.PostAsJsonAsync("api/apps",
            new { name, class_name = "App", description = "", icon = "" });
        // PUT creates a version of the old content automatically
        await _client.PutAsJsonAsync($"api/files/{name}", new { content });
    }

    // ── GET /api/versions/{app} ───────────────────────────────────────────────

    [Fact]
    public async Task ListVersions_NoVersions_ReturnsEmpty()
    {
        await _client.PostAsJsonAsync("api/apps",
            new { name = "novr_app", class_name = "App", description = "", icon = "" });

        var response = await _client.GetAsync("api/versions/novr_app");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(0, json.RootElement.GetProperty("count").GetInt32());
    }

    [Fact]
    public async Task ListVersions_AfterSave_ReturnsVersion()
    {
        await CreateAndSaveAppAsync("vlist_app");

        var response = await _client.GetAsync("api/versions/vlist_app");
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.GetProperty("count").GetInt32() >= 1);
    }

    // ── GET /api/versions/{app}/{timestamp} ───────────────────────────────────

    [Fact]
    public async Task GetVersion_ValidTimestamp_ReturnsContent()
    {
        await CreateAndSaveAppAsync("getver_app");

        var listResp = await _client.GetAsync("api/versions/getver_app");
        var list = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync());
        var ts = list.RootElement.GetProperty("versions").EnumerateArray()
            .First().GetProperty("version").GetString();

        var getResp = await _client.GetAsync($"api/versions/getver_app/{ts}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var json = JsonDocument.Parse(await getResp.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.TryGetProperty("content", out _));
    }

    [Fact]
    public async Task GetVersion_InvalidTimestamp_Returns404()
    {
        var response = await _client.GetAsync("api/versions/nonexistent_app/20000101000000");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── PUT /api/versions/{app} (restore) ────────────────────────────────────

    [Fact]
    public async Task RestoreVersion_ValidVersion_Returns200()
    {
        await CreateAndSaveAppAsync("restore_app", "original content");

        var listResp = await _client.GetAsync("api/versions/restore_app");
        var list = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync());
        var versionId = list.RootElement.GetProperty("versions").EnumerateArray()
            .First().GetProperty("version").GetString();

        var restoreResp = await _client.PutAsJsonAsync("api/versions/restore_app",
            new { version_id = versionId });
        Assert.Equal(HttpStatusCode.OK, restoreResp.StatusCode);
    }

    [Fact]
    public async Task RestoreVersion_InvalidVersion_Returns404()
    {
        var response = await _client.PutAsJsonAsync("api/versions/nonexistent_app",
            new { version_id = "20000101000000" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── DELETE /api/versions/{app} ────────────────────────────────────────────

    [Fact]
    public async Task DeleteVersion_ValidVersion_Returns200()
    {
        await CreateAndSaveAppAsync("delver_app");

        var listResp = await _client.GetAsync("api/versions/delver_app");
        var list = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync());
        var versionId = list.RootElement.GetProperty("versions").EnumerateArray()
            .First().GetProperty("version").GetString();

        var delResp = await _client.DeleteAsync($"api/versions/delver_app?versionId={versionId}");
        Assert.Equal(HttpStatusCode.OK, delResp.StatusCode);
    }

    [Fact]
    public async Task DeleteVersion_MissingVersionIdParam_Returns400()
    {
        var response = await _client.DeleteAsync("api/versions/some_app");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteVersion_NonExistentVersion_Returns404()
    {
        var response = await _client.DeleteAsync("api/versions/some_app?versionId=20000101000000");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    public async ValueTask DisposeAsync() => await _factory.DisposeAsync();
}

using System.Net;
using System.Text;

namespace AppDaemonStudio.Tests.Helpers;

/// <summary>
/// In-memory HttpMessageHandler for unit-testing code that uses IHttpClientFactory.
/// Register handlers by URL prefix or exact URL.
/// </summary>
public sealed class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly List<(Func<HttpRequestMessage, bool> Match, Func<HttpRequestMessage, Task<HttpResponseMessage>> Respond)> _routes = [];

    public MockHttpMessageHandler When(
        string urlContains,
        Func<HttpRequestMessage, HttpResponseMessage> respond)
    {
        _routes.Add((r => r.RequestUri?.ToString().Contains(urlContains) == true,
            req => Task.FromResult(respond(req))));
        return this;
    }

    public MockHttpMessageHandler When(
        string urlContains,
        Func<HttpRequestMessage, Task<HttpResponseMessage>> respond)
    {
        _routes.Add((r => r.RequestUri?.ToString().Contains(urlContains) == true, respond));
        return this;
    }

    public MockHttpMessageHandler WhenAny(Func<HttpRequestMessage, HttpResponseMessage> respond)
    {
        _routes.Add((_ => true, req => Task.FromResult(respond(req))));
        return this;
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        foreach (var (match, respond) in _routes)
            if (match(request))
                return respond(request);

        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound)
        {
            Content = new StringContent($"MockHttpHandler: no route for {request.RequestUri}", Encoding.UTF8)
        });
    }

    // ── Static helpers ────────────────────────────────────────────────────────

    public static HttpResponseMessage Json(string json, HttpStatusCode status = HttpStatusCode.OK) =>
        new(status) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    public static HttpResponseMessage Text(string text, HttpStatusCode status = HttpStatusCode.OK) =>
        new(status) { Content = new StringContent(text, Encoding.UTF8, "text/plain") };

    public static HttpResponseMessage Status(HttpStatusCode status) => new(status);
}

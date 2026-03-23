namespace AppDaemonStudio.Tests.Helpers;

/// <summary>
/// Sets environment variables for the duration of a test and restores the original values on dispose.
/// </summary>
internal sealed class EnvScope : IDisposable
{
    private readonly (string Key, string? Original)[] _saved;

    public EnvScope(params (string Key, string? Value)[] vars)
    {
        _saved = vars
            .Select(v => (v.Key, Environment.GetEnvironmentVariable(v.Key)))
            .ToArray();

        foreach (var (k, v) in vars)
            Environment.SetEnvironmentVariable(k, v);
    }

    public void Dispose()
    {
        foreach (var (k, v) in _saved)
            Environment.SetEnvironmentVariable(k, v);
    }
}

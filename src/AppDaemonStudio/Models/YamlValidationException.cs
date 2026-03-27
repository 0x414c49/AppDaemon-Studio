namespace AppDaemonStudio.Models;

public sealed class YamlValidationException(List<YamlIssue> issues)
    : Exception("YAML validation failed")
{
    public List<YamlIssue> Issues { get; } = issues;
}

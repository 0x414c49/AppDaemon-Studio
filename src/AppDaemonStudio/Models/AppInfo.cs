namespace AppDaemonStudio.Models;

public record AppInfo(
    string Name,
    string ClassName,
    string Description,
    bool HasPython,
    bool HasYaml,
    string LastModified,
    int VersionCount,
    string? Icon = null,
    bool Disabled = false
);

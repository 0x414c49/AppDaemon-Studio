namespace AppDaemonStudio.Models;

public class CreateAppRequest
{
    public string Name { get; set; } = "";
    public string ClassName { get; set; } = "";
    public string? Description { get; set; }
    public string? Icon { get; set; }
}

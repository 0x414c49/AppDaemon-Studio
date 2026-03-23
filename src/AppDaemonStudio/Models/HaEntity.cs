using System.Text.Json;

namespace AppDaemonStudio.Models;

public record HaEntity(
    string EntityId,
    string State,
    JsonElement Attributes,
    string LastChanged,
    string LastUpdated
);

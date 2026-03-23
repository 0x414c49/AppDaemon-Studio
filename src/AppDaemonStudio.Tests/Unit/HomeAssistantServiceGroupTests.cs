using System.Text.Json;
using AppDaemonStudio.Models;
using AppDaemonStudio.Services;
using Xunit;

namespace AppDaemonStudio.Tests.Unit;

public class HomeAssistantServiceGroupTests
{
    private static HaEntity Entity(string entityId) =>
        new(entityId, "on", JsonDocument.Parse("{}").RootElement, "", "");

    [Fact]
    public void GroupByDomain_EmptyList_ReturnsEmpty()
    {
        var result = HomeAssistantService.GroupByDomain([]);
        Assert.Empty(result);
    }

    [Fact]
    public void GroupByDomain_SingleEntity_SingleDomain()
    {
        var result = HomeAssistantService.GroupByDomain([Entity("light.living_room")]);
        var domain = Assert.Single(result);
        Assert.Equal("light", domain.Key);
        Assert.Single(domain.Value);
    }

    [Fact]
    public void GroupByDomain_MultipleEntitiesSameDomain_AllInOneDomain()
    {
        var entities = new List<HaEntity>
        {
            Entity("light.kitchen"),
            Entity("light.living_room"),
            Entity("light.bedroom"),
        };
        var result = HomeAssistantService.GroupByDomain(entities);
        Assert.Single(result);
        Assert.Equal(3, result["light"].Count);
    }

    [Fact]
    public void GroupByDomain_EntitiesInDifferentDomains_SortedByDomain()
    {
        var entities = new List<HaEntity>
        {
            Entity("switch.fan"),
            Entity("light.lamp"),
            Entity("binary_sensor.door"),
        };
        var result = HomeAssistantService.GroupByDomain(entities);
        Assert.Equal(3, result.Count);
        var keys = result.Keys.ToList();
        Assert.Equal("binary_sensor", keys[0]);
        Assert.Equal("light", keys[1]);
        Assert.Equal("switch", keys[2]);
    }

    [Fact]
    public void GroupByDomain_EntitiesWithinDomain_SortedByEntityId()
    {
        var entities = new List<HaEntity>
        {
            Entity("light.z_last"),
            Entity("light.a_first"),
            Entity("light.m_middle"),
        };
        var result = HomeAssistantService.GroupByDomain(entities);
        var lights = result["light"];
        Assert.Equal("light.a_first", lights[0].EntityId);
        Assert.Equal("light.m_middle", lights[1].EntityId);
        Assert.Equal("light.z_last", lights[2].EntityId);
    }

    [Fact]
    public void GroupByDomain_EntityIdWithNoDot_UsesFullIdAsDomain()
    {
        var result = HomeAssistantService.GroupByDomain([Entity("orphan")]);
        Assert.True(result.ContainsKey("orphan"));
    }
}

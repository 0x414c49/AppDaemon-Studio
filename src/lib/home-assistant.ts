export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    unit_of_measurement?: string;
    device_class?: string;
    [key: string]: unknown;
  };
  last_changed: string;
  last_updated: string;
}

export interface EntitiesByDomain {
  [domain: string]: HAEntity[];
}

const SUPERVISOR_URL = 'http://supervisor';

export async function fetchHomeAssistantEntities(): Promise<HAEntity[]> {
  const token = process.env.SUPERVISOR_TOKEN;
  
  if (!token) {
    throw new Error('SUPERVISOR_TOKEN not available. Is hassio_api enabled?');
  }
  
  try {
    const response = await fetch(`${SUPERVISOR_URL}/core/api/states`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HA API error: ${response.status} - ${errorText}`);
    }
    
    const entities: HAEntity[] = await response.json();
    return entities;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('Timeout fetching entities from Home Assistant');
    }
    throw error;
  }
}

export function groupEntitiesByDomain(entities: HAEntity[]): EntitiesByDomain {
  const grouped: EntitiesByDomain = {};
  
  for (const entity of entities) {
    const domain = entity.entity_id.split('.')[0];
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push(entity);
  }
  
  // Sort domains alphabetically
  const sorted: EntitiesByDomain = {};
  Object.keys(grouped).sort().forEach(key => {
    sorted[key] = grouped[key].sort((a, b) => 
      a.entity_id.localeCompare(b.entity_id)
    );
  });
  
  return sorted;
}

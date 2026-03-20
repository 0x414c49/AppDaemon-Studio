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

export interface FetchResult {
  entities: HAEntity[];
  error?: string;
  available: boolean;
}

export async function fetchHomeAssistantEntities(): Promise<FetchResult> {
  // Priority 1: Home Assistant Add-on mode (SUPERVISOR_TOKEN)
  const supervisorToken = process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN;
  if (supervisorToken) {
    return fetchFromSupervisor(supervisorToken);
  }

  // Priority 2: Standalone mode (HA_URL + HA_TOKEN)
  const haUrl = process.env.HA_URL;
  const haToken = process.env.HA_TOKEN;
  
  if (haUrl && haToken) {
    return fetchFromUrl(haUrl, haToken);
  }

  // No credentials available
  return {
    entities: [],
    available: false,
    error: 'No Home Assistant credentials. Set SUPERVISOR_TOKEN (add-on) or HA_URL + HA_TOKEN (standalone).',
  };
}

async function fetchFromSupervisor(token: string): Promise<FetchResult> {
  try {
    const response = await fetch(`${SUPERVISOR_URL}/core/api/states`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        entities: [],
        available: false,
        error: `HA API error: ${response.status} - ${errorText}`,
      };
    }

    const entities: HAEntity[] = await response.json();
    return {
      entities,
      available: true,
    };
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError'
      ? 'Timeout fetching entities from Home Assistant'
      : error instanceof Error ? error.message : 'Failed to fetch entities';

    return {
      entities: [],
      available: false,
      error: message,
    };
  }
}

async function fetchFromUrl(baseUrl: string, token: string): Promise<FetchResult> {
  try {
    // Ensure URL doesn't end with slash
    const url = baseUrl.replace(/\/+$/, '');
    const response = await fetch(`${url}/api/states`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        entities: [],
        available: false,
        error: `HA API error: ${response.status} - ${errorText}`,
      };
    }

    const entities: HAEntity[] = await response.json();
    return {
      entities,
      available: true,
    };
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError'
      ? 'Timeout fetching entities from Home Assistant'
      : error instanceof Error ? error.message : 'Failed to fetch entities';

    return {
      entities: [],
      available: false,
      error: message,
    };
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

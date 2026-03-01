import { NextResponse } from 'next/server';

const SUPERVISOR_URL = 'http://supervisor';

// Read env vars at module load time - but also check on each request
let cachedToken: string | undefined = undefined;

function getToken(): string | undefined {
  // Always read fresh from process.env
  return process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN;
}

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

export interface EntitiesResponse {
  entities: HAEntity[];
  grouped: Record<string, HAEntity[]>;
  count: number;
  domains: string[];
  timestamp: string;
  available: boolean;
  error?: string;
  debug?: {
    hasSupervisorToken: boolean;
    hasHassioToken: boolean;
    tokenLength: number;
    allEnvVars: string[];
    pid: number;
  };
}

export async function GET() {
  // Read env vars FRESH on every request
  const hasSupervisorToken = !!process.env.SUPERVISOR_TOKEN;
  const hasHassioToken = !!process.env.HASSIO_TOKEN;
  const token = process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN;
  
  // Debug info
  const debug = {
    hasSupervisorToken,
    hasHassioToken,
    tokenLength: token?.length || 0,
    allEnvVars: Object.keys(process.env).filter(k => k.includes('TOKEN') || k.includes('HASSIO') || k.includes('SUPERVISOR')),
    pid: process.pid,
  };
  
  if (!token) {
    return NextResponse.json({
      entities: [],
      grouped: {},
      count: 0,
      domains: [],
      timestamp: new Date().toISOString(),
      available: false,
      error: 'No Home Assistant credentials. Set SUPERVISOR_TOKEN (add-on) or HA_URL + HA_TOKEN (standalone).',
      debug,
    });
  }
  
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
      return NextResponse.json({
        entities: [],
        grouped: {},
        count: 0,
        domains: [],
        timestamp: new Date().toISOString(),
        available: false,
        error: `HA API error: ${response.status} - ${errorText}`,
        debug,
      });
    }

    const entities: HAEntity[] = await response.json();
    const grouped = groupEntitiesByDomain(entities);
    
    return NextResponse.json({
      entities,
      grouped,
      count: entities.length,
      domains: Object.keys(grouped),
      timestamp: new Date().toISOString(),
      available: true,
      debug,
    });
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError'
      ? 'Timeout fetching entities from Home Assistant'
      : error instanceof Error ? error.message : 'Failed to fetch entities';

    return NextResponse.json({
      entities: [],
      grouped: {},
      count: 0,
      domains: [],
      timestamp: new Date().toISOString(),
      available: false,
      error: message,
      debug,
    });
  }
}

function groupEntitiesByDomain(entities: HAEntity[]): Record<string, HAEntity[]> {
  const grouped: Record<string, HAEntity[]> = {};
  
  for (const entity of entities) {
    const domain = entity.entity_id.split('.')[0];
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push(entity);
  }
  
  // Sort domains alphabetically
  const sorted: Record<string, HAEntity[]> = {};
  Object.keys(grouped).sort().forEach(key => {
    sorted[key] = grouped[key].sort((a, b) =>
      a.entity_id.localeCompare(b.entity_id)
    );
  });
  
  return sorted;
}

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';

const SUPERVISOR_URL = 'http://supervisor';

// Try to read token from env, fallback to file (for child processes)
function getToken(): string | undefined {
  // First try env vars (parent process)
  const envToken = process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN;
  if (envToken) return envToken;
  
  // Fallback: read from file (child processes don't inherit env)
  try {
    const supervisorToken = readFileSync('/tmp/.supervisor_token', 'utf8').trim();
    if (supervisorToken) return supervisorToken;
  } catch {
    // File doesn't exist
  }
  
  try {
    const hassioToken = readFileSync('/tmp/.hassio_token', 'utf8').trim();
    if (hassioToken) return hassioToken;
  } catch {
    // File doesn't exist
  }
  
  return undefined;
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
    hasEnvToken: boolean;
    hasFileToken: boolean;
    tokenLength: number;
    pid: number;
    source: 'env' | 'file' | 'none';
  };
}

export async function GET() {
  // Try to get token from env or file
  const envToken = process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN;
  let fileToken: string | undefined;
  
  if (!envToken) {
    try {
      fileToken = readFileSync('/tmp/.supervisor_token', 'utf8').trim() || 
                  readFileSync('/tmp/.hassio_token', 'utf8').trim();
    } catch {
      // Files don't exist
    }
  }
  
  const token = envToken || fileToken;
  const source: 'env' | 'file' | 'none' = envToken ? 'env' : fileToken ? 'file' : 'none';
  
  // Debug info
  const debug = {
    hasEnvToken: !!envToken,
    hasFileToken: !!fileToken,
    tokenLength: token?.length || 0,
    pid: process.pid,
    source,
  };
  
  if (!token) {
    return NextResponse.json({
      entities: [],
      grouped: {},
      count: 0,
      domains: [],
      timestamp: new Date().toISOString(),
      available: false,
      error: 'No Home Assistant credentials.',
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

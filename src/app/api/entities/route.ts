import { NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';

const SUPERVISOR_URL = 'http://supervisor';

// Try to read token from env, fallback to file (for child processes)
function getToken(): { token: string | undefined; source: 'env' | 'file' | 'none'; fileExists: boolean; appDirListing: string[]; configDirListing: string[]; readError?: string | null } {
  // First try env vars (parent process)
  const envToken = process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN;
  if (envToken) {
    return { token: envToken, source: 'env', fileExists: false, appDirListing: [], configDirListing: [], readError: null };
  }
  
  // Fallback: read from file in /config (accessible from all processes)
  const TOKEN_DIR = '/config/.appdaemon-studio';
  const supervisorFile = `${TOKEN_DIR}/.supervisor_token`;
  const hassioFile = `${TOKEN_DIR}/.hassio_token`;
  
  // List directories to debug
  let appDirListing: string[] = [];
  let configDirListing: string[] = [];
  try {
    appDirListing = readdirSync('/app').slice(0, 10); // limit output
  } catch (e) {
    appDirListing = [`Error listing /app: ${e}`];
  }
  try {
    configDirListing = readdirSync('/config').slice(0, 10); // limit output
  } catch (e) {
    configDirListing = [`Error listing /config: ${e}`];
  }
  
  const supervisorExists = existsSync(supervisorFile);
  const hassioExists = existsSync(hassioFile);
  
  // Also try to read and capture any errors
  let readError: string | null = null;
  if (supervisorExists) {
    try {
      const token = readFileSync(supervisorFile, 'utf8').trim();
       if (token) return { token, source: 'file', fileExists: true, appDirListing, configDirListing, readError: null };
    } catch (e: any) {
      readError = `Read error: ${e.message}`;
    }
  }
  
  if (hassioExists) {
    try {
      const token = readFileSync(hassioFile, 'utf8').trim();
       if (token) return { token, source: 'file', fileExists: true, appDirListing, configDirListing, readError: null };
    } catch (e: any) {
      readError = readError || `Hassio read error: ${e.message}`;
    }
  }
  
  return { token: undefined, source: 'none', fileExists: supervisorExists || hassioExists, appDirListing, configDirListing, readError };
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
    fileExists: boolean;
    tokenLength: number;
    pid: number;
    source: 'env' | 'file' | 'none';
    workingDir: string;
    appDirListing: string[];
    configDirListing: string[];
    readError?: string | null;
  };
}

export async function GET() {
  // Try to get token from env or file
  const envToken = process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN;
  const { token, source, fileExists, appDirListing, configDirListing, readError } = getToken();
  
  // Debug info
  const debug = {
    hasEnvToken: !!envToken,
    fileExists,
    tokenLength: token?.length || 0,
    pid: process.pid,
    source,
    workingDir: process.cwd(),
    appDirListing,
    configDirListing,
    readError,
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

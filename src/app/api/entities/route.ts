import { NextResponse } from 'next/server';
import { fetchHomeAssistantEntities, groupEntitiesByDomain } from '../../../lib/home-assistant';
import type { HAEntity } from '../../../lib/home-assistant';

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
  };
}

export async function GET() {
  // Debug: Check env vars at runtime
  const hasSupervisorToken = !!process.env.SUPERVISOR_TOKEN;
  const hasHassioToken = !!process.env.HASSIO_TOKEN;
  const token = process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN;
  
  const result = await fetchHomeAssistantEntities();
  const grouped = groupEntitiesByDomain(result.entities);
  
  // Always return 200 - client will handle unavailable state
  return NextResponse.json({
    entities: result.entities,
    grouped,
    count: result.entities.length,
    domains: Object.keys(grouped),
    timestamp: new Date().toISOString(),
    available: result.available,
    error: result.error,
    debug: {
      hasSupervisorToken,
      hasHassioToken,
      tokenLength: token?.length || 0,
    }
  });
}

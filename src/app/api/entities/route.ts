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
}

export async function GET() {
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
  });
}

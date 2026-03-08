import { NextResponse } from 'next/server';
import { fetchHomeAssistantEntities, groupEntitiesByDomain } from '../../../lib/home-assistant';

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
}

export async function GET() {
  const result = await fetchHomeAssistantEntities();
  
  if (!result.available) {
    return NextResponse.json({
      entities: [],
      grouped: {},
      count: 0,
      domains: [],
      timestamp: new Date().toISOString(),
      available: false,
      error: result.error,
    });
  }
  
  const grouped = groupEntitiesByDomain(result.entities);
  
  return NextResponse.json({
    entities: result.entities,
    grouped,
    count: result.entities.length,
    domains: Object.keys(grouped),
    timestamp: new Date().toISOString(),
    available: true,
  });
}

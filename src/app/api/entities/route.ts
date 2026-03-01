import { NextResponse } from 'next/server';
import { fetchHomeAssistantEntities, groupEntitiesByDomain } from '../../../lib/home-assistant';
import type { HAEntity } from '../../../lib/home-assistant';

export interface EntitiesResponse {
  entities: HAEntity[];
  grouped: Record<string, HAEntity[]>;
  count: number;
  domains: string[];
  timestamp: string;
  error?: string;
}

export async function GET() {
  try {
    const entities = await fetchHomeAssistantEntities();
    const grouped = groupEntitiesByDomain(entities);
    
    return NextResponse.json({
      entities,
      grouped,
      count: entities.length,
      domains: Object.keys(grouped),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch entities';
    console.error('Error fetching HA entities:', error);
    
    // Return 503 if it's a connection issue
    const status = message.includes('Timeout') || message.includes('ECONNREFUSED') 
      ? 503 
      : 500;
    
    return NextResponse.json(
      { 
        error: message,
        entities: [],
        grouped: {},
        count: 0,
        domains: [],
      },
      { status }
    );
  }
}

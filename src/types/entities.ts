import type { HAEntity, EntitiesByDomain } from '../lib/home-assistant';

export type { HAEntity, EntitiesByDomain };

export interface EntitiesResponse {
  entities: HAEntity[];
  grouped: EntitiesByDomain;
  count: number;
  domains: string[];
  timestamp: string;
  error?: string;
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EntitiesResponse, HAEntity } from '@/types/entities';

interface UseEntitiesReturn {
  entities: HAEntity[];
  domains: string[];
  loading: boolean;
  error: string | null;
  available: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useEntities(): UseEntitiesReturn {
  const [data, setData] = useState<EntitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('api/entities');
      const result: EntitiesResponse = await response.json();
      
      // API always returns 200, check available flag
      if (!result.available && result.error) {
        // This is expected during build or when HA API is unavailable
        console.log('HA entities not available:', result.error);
      }
      
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching entities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  return {
    entities: data?.entities || [],
    domains: data?.domains || [],
    loading,
    error,
    available: data?.available ?? false,
    refresh: fetchEntities,
    lastUpdated,
  };
}

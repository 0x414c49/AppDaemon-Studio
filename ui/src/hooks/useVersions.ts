import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { VersionInfo } from '@/types';

interface UseVersionsReturn {
  versions: VersionInfo[];
  isLoading: boolean;
  error: string | null;
  refreshVersions: () => Promise<void>;
  restoreVersion: (version: string) => Promise<void>;
  deleteVersion: (version: string) => Promise<void>;
  cleanupVersions: (keepCount: number) => Promise<void>;
}

export function useVersions(): UseVersionsReturn {
  const {
    versions,
    isLoadingVersions,
    versionsError,
    activeApp,
    fetchVersions: storeFetchVersions,
    restoreVersion: storeRestoreVersion,
    deleteVersion: storeDeleteVersion,
    cleanupVersions: storeCleanupVersions,
  } = useAppStore();

  useEffect(() => {
    if (activeApp) {
      storeFetchVersions();
    }
  }, [activeApp, storeFetchVersions]);

  const refreshVersions = useCallback(async (): Promise<void> => {
    await storeFetchVersions();
  }, [storeFetchVersions]);

  const restoreVersion = useCallback(
    async (version: string): Promise<void> => {
      await storeRestoreVersion(version);
    },
    [storeRestoreVersion]
  );

  const deleteVersion = useCallback(
    async (version: string): Promise<void> => {
      await storeDeleteVersion(version);
    },
    [storeDeleteVersion]
  );

  const cleanupVersions = useCallback(
    async (keepCount: number): Promise<void> => {
      await storeCleanupVersions(keepCount);
    },
    [storeCleanupVersions]
  );

  return {
    versions,
    isLoading: isLoadingVersions,
    error: versionsError,
    refreshVersions,
    restoreVersion,
    deleteVersion,
    cleanupVersions,
  };
}
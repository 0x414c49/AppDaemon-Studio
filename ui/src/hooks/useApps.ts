import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { AppInfo, CreateAppData } from '@/types';

interface UseAppsReturn {
  apps: AppInfo[];
  activeApp: string | null;
  isLoading: boolean;
  error: string | null;
  setActiveApp: (app: string) => void;
  createApp: (data: CreateAppData) => Promise<void>;
  deleteApp: (name: string) => Promise<void>;
  refreshApps: () => Promise<void>;
}

export function useApps(): UseAppsReturn {
  const {
    apps,
    activeApp,
    isLoadingApps,
    appsError,
    fetchApps,
    setActiveApp,
    createApp: storeCreateApp,
    deleteApp: storeDeleteApp,
  } = useAppStore();

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const createApp = async (data: CreateAppData): Promise<void> => {
    await storeCreateApp(data);
  };

  const deleteApp = async (name: string): Promise<void> => {
    await storeDeleteApp(name);
  };

  const refreshApps = async (): Promise<void> => {
    await fetchApps();
  };

  return {
    apps,
    activeApp,
    isLoading: isLoadingApps,
    error: appsError,
    setActiveApp,
    createApp,
    deleteApp,
    refreshApps,
  };
}
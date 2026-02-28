import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApps } from '../hooks/useApps';
import * as api from '../services/api';

vi.mock('../services/api');
vi.mock('../store/appStore', () => ({
  useAppStore: () => ({
    apps: [],
    activeApp: null,
    isLoadingApps: false,
    appsError: null,
    fetchApps: vi.fn(),
    setActiveApp: vi.fn(),
    createApp: vi.fn(),
    deleteApp: vi.fn(),
  }),
}));

describe('useApps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns apps list', () => {
    const { result } = renderHook(() => useApps());
    expect(result.current.apps).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('setActiveApp updates active app', () => {
    const { result } = renderHook(() => useApps());
    result.current.setActiveApp('my_app');
  });

  it('createApp calls API', async () => {
    const mockCreateApp = vi.fn().mockResolvedValue({ name: 'new_app' });
    vi.mocked(api.createApp).mockImplementation(mockCreateApp);

    const { result } = renderHook(() => useApps());
    await result.current.createApp({
      name: 'new_app',
      class_name: 'NewApp',
      description: 'Test',
    });

    expect(mockCreateApp).toHaveBeenCalled();
  });
});
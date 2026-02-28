import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVersions } from '../hooks/useVersions';

vi.mock('../store/appStore', () => ({
  useAppStore: () => ({
    versions: [],
    isLoadingVersions: false,
    versionsError: null,
    activeApp: 'test_app',
    fetchVersions: vi.fn(),
    restoreVersion: vi.fn(),
    deleteVersion: vi.fn(),
    cleanupVersions: vi.fn(),
  }),
}));

describe('useVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns versions list', () => {
    const { result } = renderHook(() => useVersions());
    expect(result.current.versions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('calls restoreVersion', async () => {
    const { result } = renderHook(() => useVersions());
    await result.current.restoreVersion('20240228_102300');
  });

  it('calls deleteVersion', async () => {
    const { result } = renderHook(() => useVersions());
    await result.current.deleteVersion('20240228_102300');
  });

  it('calls cleanupVersions', async () => {
    const { result } = renderHook(() => useVersions());
    await result.current.cleanupVersions(10);
  });
});
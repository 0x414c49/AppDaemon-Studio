import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionPanel } from '../components/VersionPanel';
import { useVersions } from '../hooks/useVersions';

vi.mock('../hooks/useVersions');
vi.mock('../store/appStore', () => ({
  useAppStore: () => ({
    activeApp: 'test_app',
  }),
}));

describe('VersionPanel', () => {
  const mockUseVersions = useVersions as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists versions', () => {
    const versions = [
      {
        version: '20240228_102300',
        timestamp: '2024-02-28T10:23:00Z',
        size: 1234,
        filename: 'test.py',
      },
    ];

    mockUseVersions.mockReturnValue({
      versions,
      isLoading: false,
      error: null,
      restoreVersion: vi.fn(),
      deleteVersion: vi.fn(),
      cleanupVersions: vi.fn(),
    });

    render(<VersionPanel />);
    expect(screen.getByText('Version History for test_app')).toBeInTheDocument();
    expect(screen.getByText(/2024.*10:23:00/)).toBeInTheDocument();
  });

  it('shows empty state when no versions', () => {
    mockUseVersions.mockReturnValue({
      versions: [],
      isLoading: false,
      error: null,
      restoreVersion: vi.fn(),
      deleteVersion: vi.fn(),
      cleanupVersions: vi.fn(),
    });

    render(<VersionPanel />);
    expect(screen.getByText('No versions available')).toBeInTheDocument();
  });

  it('calls restoreVersion when restore button clicked', async () => {
    const restoreVersion = vi.fn().mockResolvedValue(undefined);
    const versions = [
      {
        version: '20240228_102300',
        timestamp: '2024-02-28T10:23:00Z',
        size: 1234,
        filename: 'test.py',
      },
    ];

    mockUseVersions.mockReturnValue({
      versions,
      isLoading: false,
      error: null,
      restoreVersion,
      deleteVersion: vi.fn(),
      cleanupVersions: vi.fn(),
    });

    vi.stubGlobal('confirm', () => true);

    render(<VersionPanel />);
    fireEvent.click(screen.getByText('Restore'));

    await waitFor(() => {
      expect(restoreVersion).toHaveBeenCalledWith('20240228_102300');
    });
  });
});
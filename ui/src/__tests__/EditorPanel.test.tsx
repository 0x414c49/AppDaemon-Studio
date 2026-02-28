import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditorPanel } from '../components/EditorPanel';
import { useFiles } from '../hooks/useFiles';

vi.mock('../hooks/useFiles');
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange, language }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      data-language={language}
    />
  )),
}));

describe('EditorPanel', () => {
  const mockUseFiles = useFiles as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Monaco editor', () => {
    mockUseFiles.mockReturnValue({
      content: "print('hello')",
      isDirty: false,
      isSaving: false,
      activeFileType: 'python',
      updateContent: vi.fn(),
      saveFile: vi.fn(),
      setFileType: vi.fn(),
    });

    render(<EditorPanel />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('shows dirty indicator when content changes', () => {
    mockUseFiles.mockReturnValue({
      content: 'original',
      isDirty: true,
      isSaving: false,
      activeFileType: 'python',
      updateContent: vi.fn(),
      saveFile: vi.fn(),
      setFileType: vi.fn(),
    });

    render(<EditorPanel />);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('switches file type when clicking python/yaml buttons', () => {
    const setFileType = vi.fn();
    mockUseFiles.mockReturnValue({
      content: '',
      isDirty: false,
      isSaving: false,
      activeFileType: 'python',
      updateContent: vi.fn(),
      saveFile: vi.fn(),
      setFileType,
    });

    render(<EditorPanel />);
    fireEvent.click(screen.getByText('YAML'));
    expect(setFileType).toHaveBeenCalledWith('yaml');
  });
});
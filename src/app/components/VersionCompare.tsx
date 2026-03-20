'use client';

import { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, GitCompare } from 'lucide-react';
import type { editor } from 'monaco-editor';
import { EditorSettings } from '@/lib/settings-store';
import { registerCustomThemes } from '@/lib/monaco/themes';

interface VersionCompareProps {
  appName: string;
  currentCode: string;
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
}

interface Version {
  version: string;
  timestamp: string;
  size: number;
  filename: string;
}

export function VersionCompare({ appName, currentCode, isOpen, onClose, settings }: VersionCompareProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [versionCode, setVersionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, appName]);

  useEffect(() => {
    if (selectedVersion) {
      loadVersionContent(selectedVersion);
    }
  }, [selectedVersion]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`api/versions/${appName}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to load versions`);
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      console.error('[VersionCompare] Error loading versions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const loadVersionContent = async (versionId: string) => {
    try {
      const response = await fetch(`api/versions/${appName}/${versionId}`);
      if (!response.ok) throw new Error('Failed to load version content');
      const data = await response.json();
      setVersionCode(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version');
      setVersionCode('');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-[90vw] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">
              Compare Versions - {appName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Selector */}
        <div className="px-6 py-3 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-300">Compare with:</label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="flex-1 bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            >
              <option value="">Select a version...</option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  {formatTimestamp(v.timestamp)} ({(v.size / 1024).toFixed(1)} KB)
                </option>
              ))}
            </select>
          </div>
          {loading && <p className="text-sm text-slate-400 mt-2">Loading versions...</p>}
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>

        {/* Diff Editor */}
        <div className="flex-1 min-h-0">
          {selectedVersion && versionCode ? (
            <DiffEditor
              height="100%"
              language="python"
              original={versionCode}
              modified={currentCode}
              theme={settings.theme}
              onMount={(editor, monaco) => {
                registerCustomThemes(monaco as any);
                (monaco as any).editor.setTheme(settings.theme);
              }}
              options={{
                readOnly: true,
                renderSideBySide: true,
                minimap: { enabled: false },
                fontFamily: settings.fontFamily,
                fontSize: settings.fontSize,
                fontLigatures: settings.fontLigatures,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              {selectedVersion ? 'Loading version content...' : 'Select a version to compare'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700 text-sm">
          <div className="text-slate-400">
            {selectedVersion && versionCode && (
              <span>
                Left: Version from {formatTimestamp(versions.find(v => v.version === selectedVersion)?.timestamp || '')}
                {' | '}
                Right: Current version
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

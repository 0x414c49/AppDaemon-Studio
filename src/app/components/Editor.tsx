'use client';

import { useEffect, useState, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Save, FileCode, RefreshCw, GitCompare } from 'lucide-react';
import { useEntities } from '@/hooks/useEntities';
import { useMonacoProviders } from '@/hooks/useMonacoProviders';
import { startLspClient, type LspClientHandle } from '@/lib/monaco/lsp-client';
import { registerCustomThemes } from '@/lib/monaco/themes';
import { EditorSettings, DEFAULT_SETTINGS } from '@/lib/settings-store';
import { VersionCompare } from './VersionCompare';
import { useToast } from './Toast';

interface EditorProps {
  appName: string;
  settings: EditorSettings;
}

export function Editor({ appName, settings }: EditorProps) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'python' | 'yaml'>('python');
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const lspClientRef = useRef<LspClientHandle | null>(null);
  const docVersionRef = useRef(0);
  const [monaco, setMonaco] = useState<typeof import('monaco-editor') | null>(null);

  const { entities, loading: entitiesLoading, error: entitiesError, available: entitiesAvailable, refresh, lastUpdated } = useEntities();

  useMonacoProviders(monaco, entities, entitiesLoading);

  useEffect(() => {
    loadFile();
  }, [appName, activeTab]);

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: any) => {
    editorRef.current = editorInstance;
    registerCustomThemes(monacoInstance);
    monacoInstance.editor.setTheme(settings.theme);
    setMonaco(monacoInstance);

    // Start LSP client for Python editing; gracefully no-ops if server is absent
    const lsp = startLspClient(monacoInstance, editorInstance);
    lspClientRef.current = lsp;
  };

  // Cleanup LSP on unmount
  useEffect(() => {
    return () => { lspClientRef.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(settings.theme);
    }
  }, [settings.theme, monaco]);
  
  const lspUri = (tab: 'python' | 'yaml') =>
    `file:///apps/${appName}.${tab === 'python' ? 'py' : 'yaml'}`;

  const loadFile = async () => {
    try {
      setLoading(true);
      // Close previous LSP document before switching
      if (lspClientRef.current) {
        lspClientRef.current.notifyClose(lspUri(activeTab));
      }
      const fileType = activeTab === 'python' ? 'python' : 'yaml';
      const response = await fetch(`api/files/${appName}/${fileType}`);
      if (!response.ok) throw new Error('Failed to load file');
      const data = await response.json();
      setContent(data.content);
      setOriginalContent(data.content);
      docVersionRef.current = 1;
      if (activeTab === 'python' && lspClientRef.current) {
        lspClientRef.current.notifyOpen(lspUri('python'), data.content);
      }
    } catch (err) {
      setContent(activeTab === 'python' ? '# Error loading file' : '# Error loading file');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    try {
      setSaving(true);
      const fileType = activeTab === 'python' ? 'python' : 'yaml';
      const response = await fetch(`api/files/${appName}/${fileType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to save file');
      setOriginalContent(content);
      addToast({
        type: 'success',
        message: `${activeTab === 'python' ? 'Python' : 'YAML'} file saved successfully`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save file',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = content !== originalContent;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !saving) {
          saveFile();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, saving, content, saveFile]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-ha-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ha-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-ha-card border-b border-ha-border">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-ha-text flex items-center gap-2">
            <FileCode className="w-4 h-4 text-ha-primary" />
            {activeTab === 'python' ? `${appName}.py` : 'apps.yaml'}
            {isDirty && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-ha-warning-bg text-ha-warning font-medium">
                Modified
              </span>
            )}
          </h2>

          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'python'
                  ? 'bg-ha-primary text-white'
                  : 'border border-ha-border text-ha-text-secondary hover:bg-ha-surface'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveTab('yaml')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'yaml'
                  ? 'bg-ha-primary text-white'
                  : 'border border-ha-border text-ha-text-secondary hover:bg-ha-surface'
              }`}
            >
              YAML
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'python' && (
            <button
              onClick={() => setShowVersionCompare(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium border border-ha-border text-ha-text hover:bg-ha-surface transition-colors"
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
          )}

          <button
            onClick={saveFile}
            disabled={saving || !isDirty}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDirty
                ? 'bg-ha-primary hover:bg-ha-primary-dark text-white'
                : 'border border-ha-border text-ha-text-disabled cursor-not-allowed opacity-50'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          defaultLanguage={activeTab === 'python' ? 'python' : 'yaml'}
          language={activeTab === 'python' ? 'python' : 'yaml'}
          value={content}
          onChange={(value) => {
            const text = value || '';
            setContent(text);
            if (activeTab === 'python' && lspClientRef.current) {
              docVersionRef.current += 1;
              lspClientRef.current.notifyChange(lspUri('python'), docVersionRef.current, text);
            }
          }}
          theme={settings.theme}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            fontLigatures: settings.fontLigatures,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            padding: { top: 16 },
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-ha-card border-t border-ha-border text-xs text-ha-text-secondary">
        <div className="flex items-center gap-4">
          <span>{appName}</span>
          <span>{activeTab.toUpperCase()}</span>
          {activeTab === 'python' && (
            <span className="flex items-center gap-1">
              {entitiesLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Loading entities...
                </>
              ) : !entitiesAvailable ? (
                <button
                  onClick={refresh}
                  className="text-ha-warning hover:opacity-80 flex items-center gap-1"
                  title="Click to retry"
                >
                  <RefreshCw className="w-3 h-3" />
                  Entities unavailable (click to retry)
                </button>
              ) : entitiesError ? (
                <span className="text-ha-error" title={entitiesError}>
                  Entities error
                </span>
              ) : (
                <>
                  <span className="text-ha-success">{entities.length} entities</span>
                  {lastUpdated && (
                    <span className="text-ha-text-disabled">
                      (updated {lastUpdated.toLocaleTimeString()})
                    </span>
                  )}
                </>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isDirty && <span className="text-ha-warning">Modified</span>}
          <span>UTF-8</span>
        </div>
      </div>

      {/* Version Compare Modal */}
      <VersionCompare
        appName={appName}
        currentCode={content}
        isOpen={showVersionCompare}
        onClose={() => setShowVersionCompare(false)}
        settings={settings}
      />
    </div>
  );
}

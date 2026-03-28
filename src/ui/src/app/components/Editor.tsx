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
  module: string;
  settings: EditorSettings;
  yamlReloadKey?: number;
  onYamlSaved?: () => void;
}

export function Editor({ appName, module, settings, yamlReloadKey, onYamlSaved }: EditorProps) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'python' | 'yaml'>('python');
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [yamlIssues, setYamlIssues] = useState<import('@/types').YamlIssue[]>([]);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const lspClientRef = useRef<LspClientHandle | null>(null);
  const docVersionRef = useRef(0);
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [monaco, setMonaco] = useState<typeof import('monaco-editor') | null>(null);

  const { entities, loading: entitiesLoading, error: entitiesError, available: entitiesAvailable, refresh, lastUpdated } = useEntities();
  const [diagnostics, setDiagnostics] = useState<{ errors: number; warnings: number; markers: import('monaco-editor').editor.IMarker[] }>({ errors: 0, warnings: 0, markers: [] });

  useMonacoProviders(monaco, entities, entitiesLoading);

  // Track Monaco markers (pylsp diagnostics + appdaemon-hints) for the badge
  useEffect(() => {
    if (!monaco) return;
    const update = () => {
      const markers = [
        ...monaco.editor.getModelMarkers({ owner: 'pylsp' }),
        ...monaco.editor.getModelMarkers({ owner: 'appdaemon-hints' }),
      ];
      setDiagnostics({
        errors: markers.filter(m => m.severity === monaco.MarkerSeverity.Error).length,
        warnings: markers.filter(m => m.severity === monaco.MarkerSeverity.Warning).length,
        markers,
      });
    };
    const sub = monaco.editor.onDidChangeMarkers(update);
    return () => sub.dispose();
  }, [monaco]);

  // Warn on deprecated bare `import hassapi` — AppDaemon only resolves this at runtime
  useEffect(() => {
    if (!monaco) return;
    const model = editorRef.current?.getModel();
    if (!model) return;
    if (activeTab !== 'python') {
      monaco.editor.setModelMarkers(model, 'appdaemon-hints', []);
      return;
    }
    const re = /^(\s*)(import\s+hassapi\b|from\s+hassapi\s+import\b)/;
    const markers = content.split('\n').flatMap((line, i) => {
      const m = re.exec(line);
      if (!m) return [];
      return [{
        startLineNumber: i + 1,
        endLineNumber: i + 1,
        startColumn: m[1].length + 1,
        endColumn: line.length + 1,
        message: "'import hassapi' is deprecated. Use 'import appdaemon.plugins.hass.hassapi as hass' instead.",
        severity: monaco.MarkerSeverity.Warning,
      }];
    });
    monaco.editor.setModelMarkers(model, 'appdaemon-hints', markers);
  }, [content, activeTab, monaco]);

  useEffect(() => {
    setYamlIssues([]);
    loadFile();
  }, [appName, activeTab]);

  // Reload YAML when parent signals a change (e.g. disable toggle modifies apps.yaml)
  useEffect(() => {
    if (yamlReloadKey && activeTab === 'yaml') loadFile();
  }, [yamlReloadKey]);

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: any) => {
    editorRef.current = editorInstance;
    registerCustomThemes(monacoInstance);
    monacoInstance.editor.setTheme(settings.theme);
    setMonaco(monacoInstance);

    // Start LSP client for Python editing; gracefully no-ops if server is absent
    const lsp = startLspClient(monacoInstance);
    lspClientRef.current = lsp;
    // File may already be loaded (loadFile runs before onMount); send didOpen now
    const currentText = editorInstance.getValue();
    if (currentText) {
      lsp.notifyOpen(`file:///apps/${module}.py`, currentText);
    }
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

  // Debounced yaml validation
  useEffect(() => {
    if (activeTab !== 'yaml') return;
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    validateTimerRef.current = setTimeout(async () => {
      try {
        const r = await fetch('api/yaml/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (r.ok) {
          const data = await r.json();
          setYamlIssues(data.issues ?? []);
        }
      } catch { /* non-critical */ }
    }, 500);
    return () => {
      if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    };
  }, [content, activeTab]);

  // Set Monaco markers from yamlIssues
  useEffect(() => {
    if (!monaco) return;
    const model = editorRef.current?.getModel();
    if (!model) return;
    if (activeTab !== 'yaml') {
      monaco.editor.setModelMarkers(model, 'yaml-validate', []);
      return;
    }
    monaco.editor.setModelMarkers(model, 'yaml-validate', yamlIssues.map(issue => ({
      startLineNumber: issue.line,
      endLineNumber: issue.line,
      startColumn: 1,
      endColumn: 200,
      message: issue.message,
      severity: issue.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : issue.severity === 'warning'
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Info,
    })));
  }, [yamlIssues, monaco, activeTab]);

  const lspUri = (tab: 'python' | 'yaml') =>
    `file:///apps/${module}.${tab === 'python' ? 'py' : 'yaml'}`;

  const loadFile = async () => {
    try {
      setLoading(true);
      // Close previous LSP document before switching
      if (lspClientRef.current) {
        lspClientRef.current.notifyClose(lspUri(activeTab));
      }
      const fileType = activeTab === 'python' ? 'python' : 'yaml';
      const fileId = activeTab === 'python' ? module : appName;
      const response = await fetch(`api/files/${fileId}/${fileType}`);
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
      if (activeTab === 'yaml') {
        const response = await fetch(`api/files/${appName}/yaml`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!response.ok) {
          const data = await response.json();
          if (data.issues) {
            for (const issue of data.issues as import('@/types').YamlIssue[]) {
              addToast({ type: 'error', message: issue.message, duration: 6000 });
            }
          } else {
            addToast({ type: 'error', message: data.detail || 'Failed to save YAML', duration: 5000 });
          }
          return;
        }
        const data = await response.json();
        setOriginalContent(content);
        for (const file of (data.created_files ?? []) as string[]) {
          addToast({ type: 'success', message: `Created ${file}` });
        }
        if (!(data.created_files?.length)) {
          addToast({ type: 'success', message: 'YAML file saved successfully' });
        }
        onYamlSaved?.();
      } else {
        const response = await fetch(`api/files/${module}/python`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error('Failed to save file');
        setOriginalContent(content);
        addToast({ type: 'success', message: 'Python file saved successfully' });
      }
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

  const jumpToFirstError = () => {
    const first = diagnostics.markers
      .filter(m => m.severity === (monaco?.MarkerSeverity.Error ?? 8))
      .sort((a, b) => a.startLineNumber - b.startLineNumber)[0]
      ?? diagnostics.markers[0];
    if (!first || !editorRef.current) return;
    editorRef.current.revealLineInCenter(first.startLineNumber);
    editorRef.current.setPosition({ lineNumber: first.startLineNumber, column: first.startColumn });
    editorRef.current.focus();
  };

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
            {activeTab === 'python' ? `${module}.py` : 'apps.yaml'}
            {isDirty && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-ha-warning-bg text-ha-warning font-medium">
                Modified
              </span>
            )}
          </h2>

          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('python')}
              className={`relative px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'python'
                  ? 'bg-ha-primary text-white'
                  : 'border border-ha-border text-ha-text-secondary hover:bg-ha-surface'
              }`}
            >
              Python
              {diagnostics.errors > 0 && (
                <span
                  onClick={e => { e.stopPropagation(); jumpToFirstError(); }}
                  title={diagnostics.markers.filter(m => m.severity === (monaco?.MarkerSeverity.Error ?? 8)).map(m => `L${m.startLineNumber}: ${m.message}`).join('\n')}
                  className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center cursor-pointer hover:bg-red-400"
                >
                  {diagnostics.errors}
                </span>
              )}
              {diagnostics.errors === 0 && diagnostics.warnings > 0 && (
                <span
                  onClick={e => { e.stopPropagation(); jumpToFirstError(); }}
                  title={diagnostics.markers.filter(m => m.severity === (monaco?.MarkerSeverity.Warning ?? 4)).map(m => `L${m.startLineNumber}: ${m.message}`).join('\n')}
                  className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-yellow-500 text-white text-[10px] font-bold leading-4 text-center cursor-pointer hover:bg-yellow-400"
                >
                  {diagnostics.warnings}
                </span>
              )}
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
            quickSuggestions: { other: true, comments: false, strings: true },
            quickSuggestionsDelay: 0,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            suggest: {
              preview: true,
              previewMode: 'subword',
              showStatusBar: true,
              localityBonus: true,
              filterGraceful: true,
              insertMode: 'replace',
              selectionMode: 'always',
            },
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
                <button onClick={refresh} className="text-ha-error hover:opacity-80 flex items-center gap-1" title={entitiesError}>
                  <RefreshCw className="w-3 h-3" />
                  Entities error (click to retry)
                </button>
              ) : (
                <button onClick={refresh} className="text-ha-success hover:opacity-80 flex items-center gap-1" title="Click to refresh entities">
                  <RefreshCw className="w-3 h-3" />
                  {entities.length} entities
                  {lastUpdated && <span className="text-ha-text-disabled">(updated {lastUpdated.toLocaleTimeString()})</span>}
                </button>
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
        appName={module}
        currentCode={content}
        isOpen={showVersionCompare}
        onClose={() => setShowVersionCompare(false)}
        settings={settings}
      />
    </div>
  );
}

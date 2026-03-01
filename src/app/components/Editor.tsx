'use client';

import { useEffect, useState, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { editor, languages } from 'monaco-editor';
import { Save, FileCode, RefreshCw } from 'lucide-react';
import { useEntities } from '../../hooks/useEntities';
import { 
  createAppDaemonCompletions, 
  createEntityCompletions, 
  shouldTriggerEntityCompletion,
  shouldTriggerMethodCompletion,
  filterEntitiesByPrefix 
} from '../../lib/monaco/completions';

interface EditorProps {
  appName: string;
}

export function Editor({ appName }: EditorProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'python' | 'yaml'>('python');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  
  const { entities, loading: entitiesLoading, error: entitiesError, available: entitiesAvailable, refresh, lastUpdated } = useEntities();

  useEffect(() => {
    loadFile();
  }, [appName, activeTab]);

  // Register completion providers
  useEffect(() => {
    if (!monacoRef.current) return;
    
    const monaco = monacoRef.current;
    
    // AppDaemon API completions (always available)
    const appDaemonProvider = monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['.'],
      provideCompletionItems: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        
        if (!shouldTriggerMethodCompletion(lineContent, position.column)) {
          return { suggestions: [] };
        }
        
        const suggestions = createAppDaemonCompletions().map(item => ({
          ...item,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column,
          },
        }));
        
        return { suggestions };
      },
    });
    
    // Entity completions (only when entities are available)
    let entityProvider: any;
    if (!entitiesLoading && entities.length > 0) {
      entityProvider = monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['(', ',', "'", '"'],
        provideCompletionItems: (model, position) => {
          const lineContent = model.getLineContent(position.lineNumber);
          const wordUntilPosition = model.getWordUntilPosition(position);
          
          if (!shouldTriggerEntityCompletion(lineContent, position.column)) {
            return { suggestions: [] };
          }
          
          const prefix = wordUntilPosition.word;
          const filteredEntities = prefix 
            ? filterEntitiesByPrefix(entities, prefix)
            : entities;
          
          const suggestions = createEntityCompletions(filteredEntities).map(item => ({
            ...item,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntilPosition.startColumn,
              endColumn: position.column,
            },
          }));
          
          return { suggestions };
        },
      });
    }
    
    return () => {
      appDaemonProvider.dispose();
      if (entityProvider) entityProvider.dispose();
    };
  }, [entities, entitiesLoading]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const loadFile = async () => {
    try {
      setLoading(true);
      const fileType = activeTab === 'python' ? 'python' : 'yaml';
      const response = await fetch(`api/files/${appName}/${fileType}`);
      if (!response.ok) throw new Error('Failed to load file');
      const data = await response.json();
      setContent(data.content);
      setOriginalContent(data.content);
    } catch (err) {
      console.error('Error loading file:', err);
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
      alert('File saved successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = content !== originalContent;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-400" />
            {appName}.{activeTab === 'python' ? 'py' : 'yaml'}
            {isDirty && <span className="text-yellow-400 text-sm">•</span>}
          </h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === 'python'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveTab('yaml')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === 'yaml'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              YAML
            </button>
          </div>
        </div>

        <button
          onClick={saveFile}
          disabled={saving || !isDirty}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            isDirty
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          defaultLanguage={activeTab === 'python' ? 'python' : 'yaml'}
          language={activeTab === 'python' ? 'python' : 'yaml'}
          value={content}
          onChange={(value) => setContent(value || '')}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
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
      <div className="flex items-center justify-between px-4 py-1 bg-slate-800 border-t border-slate-700 text-xs text-slate-400">
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
                  className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                  title="Click to retry"
                >
                  <RefreshCw className="w-3 h-3" />
                  Entities unavailable (click to retry)
                </button>
              ) : entitiesError ? (
                <span className="text-red-400" title={entitiesError}>
                  Entities error
                </span>
              ) : (
                <>
                  <span className="text-green-400">{entities.length} entities</span>
                  {lastUpdated && (
                    <span className="text-slate-500">
                      (updated {lastUpdated.toLocaleTimeString()})
                    </span>
                  )}
                </>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isDirty && <span className="text-yellow-400">Modified</span>}
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}

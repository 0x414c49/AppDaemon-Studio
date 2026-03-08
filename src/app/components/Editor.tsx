'use client';

import { useEffect, useState, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { editor, languages, Position } from 'monaco-editor';
import { Save, FileCode, RefreshCw, GitCompare } from 'lucide-react';
import { useEntities } from '@/hooks/useEntities';
import { 
  createAppDaemonCompletions, 
  createEntityCompletions, 
  shouldTriggerEntityCompletion,
  filterEntitiesByPrefix 
} from '@/lib/monaco/completions';
import { APPDAEMON_SIGNATURES } from '@/lib/monaco/completions/signatures';
import { VersionCompare } from './VersionCompare';
import { useToast } from './Toast';

interface EditorProps {
  appName: string;
}

export function Editor({ appName }: EditorProps) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'python' | 'yaml'>('python');
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const completionProvidersRef = useRef<{ appDaemon?: any; entity?: any; signature?: any }>({});
  
  const { entities, loading: entitiesLoading, error: entitiesError, available: entitiesAvailable, refresh, lastUpdated } = useEntities();

  useEffect(() => {
    loadFile();
  }, [appName, activeTab]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Register AppDaemon API completions
    const appDaemonProvider = monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['.', ' ', '('],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const wordUntilPosition = model.getWordUntilPosition(position);
        
        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        const isAfterSelf = /self\.$/.test(textBeforeCursor);
        const isEmptyLine = /^\s*$/.test(textBeforeCursor);
        const isStartingKeyword = /\b(impo|from|clas|def|if|for|whil|try)\b/.test(textBeforeCursor);
        const isAfterDot = /\.$/.test(textBeforeCursor);
        
        // Get all completions
        const allCompletions = createAppDaemonCompletions();
        
        // Convert to Monaco suggestions with proper range
        const createSuggestions = (items: typeof allCompletions) => {
          return items.map(item => ({
            label: item.label,
            kind: item.kind,
            insertText: item.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: item.documentation,
            detail: item.detail,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: isAfterSelf && item.label.startsWith('self.') 
                ? position.column - 5 
                : wordUntilPosition.startColumn,
              endColumn: position.column,
            },
          }));
        };
        
        // Context-based filtering
        if (isAfterSelf) {
          // After self. - show AppDaemon methods
          const filtered = allCompletions.filter(item => 
            item.label.startsWith('self.') || 
            item.detail?.includes('AppDaemon') ||
            item.detail?.includes('Time') ||
            item.detail?.includes('Sun') ||
            item.detail?.includes('Presence')
          );
          return { suggestions: createSuggestions(filtered) };
        } else if (isAfterDot) {
          // After any other dot - show module methods
          const filtered = allCompletions.filter(item =>
            item.detail === 'JSON' ||
            item.detail === 'OS' ||
            item.detail === 'Datetime' ||
            item.detail === 'HTTP'
          );
          return { suggestions: createSuggestions(filtered) };
        } else if (isEmptyLine || isStartingKeyword) {
          // Start of line or typing keyword - show imports, keywords, classes
          const filtered = allCompletions.filter(item =>
            item.detail === 'Import' ||
            item.detail === 'Keyword' ||
            item.detail === 'Snippet' ||
            item.detail === 'Control Flow' ||
            item.label.startsWith('class ') ||
            item.label.startsWith('def ') ||
            item.label.startsWith('import ')
          );
          return { suggestions: createSuggestions(filtered) };
        } else {
          // Default - show utility functions, paths, builtins
          const filtered = allCompletions.filter(item =>
            item.detail === 'JSON' ||
            item.detail === 'JSON Pattern' ||
            item.detail === 'OS' ||
            item.detail === 'Datetime' ||
            item.detail === 'HTTP' ||
            item.detail === 'File I/O' ||
            item.detail === 'Snippet' ||
            item.detail === 'Path' ||
            item.detail === 'Built-in' ||
            item.detail === 'Python' ||
            item.detail === 'Control Flow'
          );
          return { suggestions: createSuggestions(filtered) };
        }
      },
    });
    
    completionProvidersRef.current.appDaemon = appDaemonProvider;
    
    // Register signature help provider for method signatures
    const signatureProvider = monaco.languages.registerSignatureHelpProvider('python', {
      triggerCharacters: ['(', ','],
      provideSignatureHelp: (model: editor.ITextModel, position: Position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        
        // Match self.method_name(
        const methodNames = Object.keys(APPDAEMON_SIGNATURES).join('|');
        const match = textUntilPosition.match(new RegExp(`self\\.(${methodNames})\\s*\\(([^)]*)$`));
        
        if (!match) {
          return { value: { signatures: [], activeSignature: 0, activeParameter: 0 }, dispose: () => {} };
        }
        
        const methodName = match[1];
        const paramsString = match[2];
        
        // Count commas to determine active parameter (simple approach)
        let activeParameter = 0;
        let depth = 0;
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < paramsString.length; i++) {
          const char = paramsString[i];
          
          // Track string boundaries
          if ((char === '"' || char === "'") && paramsString[i-1] !== '\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
            }
          }
          
          // Only count commas outside strings and nested parens
          if (!inString) {
            if (char === '(' || char === '[' || char === '{') depth++;
            if (char === ')' || char === ']' || char === '}') depth--;
            if (char === ',' && depth === 0) activeParameter++;
          }
        }
        
        const sig = APPDAEMON_SIGNATURES[methodName];
        
        if (!sig) {
          return { value: { signatures: [], activeSignature: 0, activeParameter: 0 }, dispose: () => {} };
        }
        
        return {
          value: {
            signatures: [sig],
            activeSignature: 0,
            activeParameter
          },
          dispose: () => {}
        };
      }
    });
    
    completionProvidersRef.current.signature = signatureProvider;
  };
  
  // Update entity completions when entities change
  useEffect(() => {
    if (!monacoRef.current) return;
    
    const monaco = monacoRef.current;
    
    // Dispose previous entity provider
    if (completionProvidersRef.current.entity) {
      completionProvidersRef.current.entity.dispose();
    }
    
    const entityProvider = monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['(', ',', "'", '"'],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        // Skip if no entities available yet
        if (entitiesLoading || entities.length === 0) {
          return { suggestions: [] };
        }
        
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
          label: item.label,
          kind: item.kind,
          insertText: item.insertText,
          documentation: item.documentation,
          detail: item.detail,
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
    
    completionProvidersRef.current.entity = entityProvider;
  }, [entities, entitiesLoading]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (completionProvidersRef.current.appDaemon) {
        completionProvidersRef.current.appDaemon.dispose();
      }
      if (completionProvidersRef.current.entity) {
        completionProvidersRef.current.entity.dispose();
      }
      if (completionProvidersRef.current.signature) {
        completionProvidersRef.current.signature.dispose();
      }
    };
  }, []);

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
            {activeTab === 'python' ? `${appName}.py` : 'apps.yaml'}
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

        <div className="flex items-center gap-2">
          {activeTab === 'python' && (
            <button
              onClick={() => setShowVersionCompare(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-md font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
          )}
          
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

      {/* Version Compare Modal */}
      <VersionCompare
        appName={appName}
        currentCode={content}
        isOpen={showVersionCompare}
        onClose={() => setShowVersionCompare(false)}
      />
    </div>
  );
}

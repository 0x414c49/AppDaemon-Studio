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
  filterEntitiesForContext,
} from '@/lib/monaco/completions';
import { APPDAEMON_SIGNATURES } from '@/lib/monaco/completions/signatures';
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
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const completionProvidersRef = useRef<{ appDaemon?: any; entity?: any; signature?: any; callService?: any }>({});
  
  const { entities, loading: entitiesLoading, error: entitiesError, available: entitiesAvailable, refresh, lastUpdated } = useEntities();

  useEffect(() => {
    loadFile();
  }, [appName, activeTab]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    registerCustomThemes(monaco);
    monaco.editor.setTheme(settings.theme);
    
    // Register AppDaemon API completions
    const appDaemonProvider = monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['.', ' ', '('],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const wordUntilPosition = model.getWordUntilPosition(position);
        
        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        // Match self. followed by any partial word (e.g. "self.", "self.turn", "self.turn_on")
        const selfDotMatch = /self\.(\w*)$/.exec(textBeforeCursor);
        const isAfterSelf = selfDotMatch !== null;
        const selfPartialWord = selfDotMatch?.[1] ?? '';
        const isEmptyLine = /^\s*$/.test(textBeforeCursor);
        const isStartingKeyword = /\b(impo|from|clas|def|if|for|whil|try)\b/.test(textBeforeCursor);
        const isAfterDot = !isAfterSelf && /\.$/.test(textBeforeCursor);

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
            // filterText strips the "self." prefix so Monaco matches against what
            // the user types AFTER the dot (e.g. "turn" matches "turn_on")
            filterText: isAfterSelf && item.label.startsWith('self.')
              ? item.label.slice(5)
              : item.label,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              // Cover "self." + any partial word already typed
              startColumn: isAfterSelf && item.label.startsWith('self.')
                ? position.column - 5 - selfPartialWord.length
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

    // Register call_service / call_action domain/service completions
    const HA_SERVICES: { service: string; detail: string; documentation: string }[] = [
      // Light
      { service: 'light/turn_on',       detail: 'light',         documentation: 'Turn on a light. kwargs: entity_id, brightness (0-255), rgb_color, color_temp, transition, effect' },
      { service: 'light/turn_off',      detail: 'light',         documentation: 'Turn off a light. kwargs: entity_id, transition' },
      { service: 'light/toggle',        detail: 'light',         documentation: 'Toggle a light on/off. kwargs: entity_id' },
      // Switch
      { service: 'switch/turn_on',      detail: 'switch',        documentation: 'Turn on a switch. kwargs: entity_id' },
      { service: 'switch/turn_off',     detail: 'switch',        documentation: 'Turn off a switch. kwargs: entity_id' },
      { service: 'switch/toggle',       detail: 'switch',        documentation: 'Toggle a switch. kwargs: entity_id' },
      // Climate
      { service: 'climate/set_temperature',   detail: 'climate', documentation: 'Set target temperature. kwargs: entity_id, temperature, hvac_mode' },
      { service: 'climate/set_hvac_mode',     detail: 'climate', documentation: 'Set HVAC mode. kwargs: entity_id, hvac_mode (off|heat|cool|auto|dry|fan_only)' },
      { service: 'climate/set_fan_mode',      detail: 'climate', documentation: 'Set fan mode. kwargs: entity_id, fan_mode' },
      { service: 'climate/turn_on',           detail: 'climate', documentation: 'Turn on climate device. kwargs: entity_id' },
      { service: 'climate/turn_off',          detail: 'climate', documentation: 'Turn off climate device. kwargs: entity_id' },
      // Cover
      { service: 'cover/open_cover',    detail: 'cover',         documentation: 'Open a cover. kwargs: entity_id' },
      { service: 'cover/close_cover',   detail: 'cover',         documentation: 'Close a cover. kwargs: entity_id' },
      { service: 'cover/toggle',        detail: 'cover',         documentation: 'Toggle a cover. kwargs: entity_id' },
      { service: 'cover/set_cover_position', detail: 'cover',    documentation: 'Set cover position (0-100). kwargs: entity_id, position' },
      // Fan
      { service: 'fan/turn_on',         detail: 'fan',           documentation: 'Turn on a fan. kwargs: entity_id, speed, percentage' },
      { service: 'fan/turn_off',        detail: 'fan',           documentation: 'Turn off a fan. kwargs: entity_id' },
      { service: 'fan/set_percentage',  detail: 'fan',           documentation: 'Set fan speed percentage (0-100). kwargs: entity_id, percentage' },
      // Lock
      { service: 'lock/lock',           detail: 'lock',          documentation: 'Lock a lock. kwargs: entity_id' },
      { service: 'lock/unlock',         detail: 'lock',          documentation: 'Unlock a lock. kwargs: entity_id, code (optional)' },
      // Media player
      { service: 'media_player/turn_on',       detail: 'media_player', documentation: 'Turn on media player. kwargs: entity_id' },
      { service: 'media_player/turn_off',      detail: 'media_player', documentation: 'Turn off media player. kwargs: entity_id' },
      { service: 'media_player/media_play',    detail: 'media_player', documentation: 'Start playback. kwargs: entity_id' },
      { service: 'media_player/media_pause',   detail: 'media_player', documentation: 'Pause playback. kwargs: entity_id' },
      { service: 'media_player/media_stop',    detail: 'media_player', documentation: 'Stop playback. kwargs: entity_id' },
      { service: 'media_player/media_next_track',  detail: 'media_player', documentation: 'Skip to next track. kwargs: entity_id' },
      { service: 'media_player/play_media',    detail: 'media_player', documentation: 'Play media. kwargs: entity_id, media_content_id, media_content_type' },
      { service: 'media_player/volume_set',    detail: 'media_player', documentation: 'Set volume (0.0-1.0). kwargs: entity_id, volume_level' },
      // Notify
      { service: 'notify/notify',              detail: 'notify', documentation: 'Send a notification. kwargs: message, title' },
      { service: 'notify/persistent_notification', detail: 'notify', documentation: 'Create a persistent HA notification. kwargs: message, title, notification_id' },
      // Input helpers
      { service: 'input_boolean/turn_on',   detail: 'input_boolean', documentation: 'Turn on input_boolean. kwargs: entity_id' },
      { service: 'input_boolean/turn_off',  detail: 'input_boolean', documentation: 'Turn off input_boolean. kwargs: entity_id' },
      { service: 'input_boolean/toggle',    detail: 'input_boolean', documentation: 'Toggle input_boolean. kwargs: entity_id' },
      { service: 'input_number/set_value',  detail: 'input_number',  documentation: 'Set input_number value. kwargs: entity_id, value' },
      { service: 'input_select/select_option', detail: 'input_select', documentation: 'Set input_select option. kwargs: entity_id, option' },
      { service: 'input_text/set_value',    detail: 'input_text',    documentation: 'Set input_text value. kwargs: entity_id, value' },
      // Automation / Script / Scene
      { service: 'automation/trigger',      detail: 'automation', documentation: 'Trigger an automation. kwargs: entity_id' },
      { service: 'automation/turn_on',      detail: 'automation', documentation: 'Enable an automation. kwargs: entity_id' },
      { service: 'automation/turn_off',     detail: 'automation', documentation: 'Disable an automation. kwargs: entity_id' },
      { service: 'script/turn_on',          detail: 'script',     documentation: 'Run a script. kwargs: entity_id, variables' },
      { service: 'scene/turn_on',           detail: 'scene',      documentation: 'Activate a scene. kwargs: entity_id, transition' },
      // Timer
      { service: 'timer/start',             detail: 'timer',      documentation: 'Start a timer. kwargs: entity_id, duration (HH:MM:SS)' },
      { service: 'timer/cancel',            detail: 'timer',      documentation: 'Cancel a timer. kwargs: entity_id' },
      // Persistent notification
      { service: 'persistent_notification/create',  detail: 'persistent_notification', documentation: 'Create a persistent notification. kwargs: message, title, notification_id' },
      { service: 'persistent_notification/dismiss', detail: 'persistent_notification', documentation: 'Dismiss a persistent notification. kwargs: notification_id' },
      // Homeassistant
      { service: 'homeassistant/restart',   detail: 'homeassistant', documentation: 'Restart Home Assistant.' },
      { service: 'homeassistant/reload_all',detail: 'homeassistant', documentation: 'Reload all YAML configuration.' },
      { service: 'tts/speak',               detail: 'tts',        documentation: 'Speak text via TTS. kwargs: media_player_entity_id, message, language' },
    ];

    const callServiceProvider = monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ["'", '"', '/'],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        const wordUntilPosition = model.getWordUntilPosition(position);

        // Only fire inside the first string arg of call_service / call_action
        if (!/self\.(call_service|call_action)\s*\(\s*['"][^'"]*$/.test(textBeforeCursor)) {
          return { suggestions: [] };
        }

        const prefix = wordUntilPosition.word;
        const filtered = prefix
          ? HA_SERVICES.filter(s => s.service.includes(prefix.toLowerCase()))
          : HA_SERVICES;

        return {
          suggestions: filtered.map(s => ({
            label: s.service,
            kind: 12, // Value
            insertText: s.service,
            detail: s.detail,
            documentation: s.documentation,
            filterText: s.service,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntilPosition.startColumn,
              endColumn: position.column,
            },
          })),
        };
      },
    });
    completionProvidersRef.current.callService = callServiceProvider;

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
  
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(settings.theme);
    }
  }, [settings.theme]);
  
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
        const filteredEntities = filterEntitiesForContext(
          entities, lineContent, position.column, prefix
        );
        
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
      if (completionProvidersRef.current.callService) {
        completionProvidersRef.current.callService.dispose();
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
          onChange={(value) => setContent(value || '')}
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

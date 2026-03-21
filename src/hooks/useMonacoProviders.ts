import { useEffect, useRef } from 'react';
import type { editor, Position } from 'monaco-editor';
import type { HAEntity } from '@/lib/home-assistant';
import {
  createAppDaemonCompletions,
  createEntityCompletions,
  shouldTriggerEntityCompletion,
  filterEntitiesForContext,
} from '@/lib/monaco/completions';
import { HA_SERVICES } from '@/lib/monaco/completions/ha-services';
import { YAML_APPDAEMON_SNIPPETS } from '@/lib/monaco/completions/yaml-appdaemon';
import { APPDAEMON_SIGNATURES } from '@/lib/monaco/completions/signatures';

/**
 * Registers all Monaco completion and signature-help providers once.
 * Entity data is kept in a ref so providers always see the latest list
 * without ever being re-registered.
 */
export function useMonacoProviders(
  monaco: typeof import('monaco-editor') | null,
  entities: HAEntity[],
  entitiesLoading: boolean,
): void {
  // Refs so provider closures see latest values without re-registration
  const entitiesRef = useRef(entities);
  const entitiesLoadingRef = useRef(entitiesLoading);
  entitiesRef.current = entities;
  entitiesLoadingRef.current = entitiesLoading;

  // Computed once at hook init; doesn't change
  const completionsRef = useRef(createAppDaemonCompletions());

  useEffect(() => {
    if (!monaco) return;

    const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

    // ── 1. AppDaemon API completions (Python) ──────────────────────────────
    const appDaemonProvider = monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['.', ' ', '('],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const wordUntilPosition = model.getWordUntilPosition(position);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);

        const selfDotMatch = /self\.(\w*)$/.exec(textBeforeCursor);
        const isAfterSelf = selfDotMatch !== null;
        const selfPartialWord = selfDotMatch?.[1] ?? '';
        const isEmptyLine = /^\s*$/.test(textBeforeCursor);
        const isStartingKeyword = /\b(impo|from|clas|def|if|for|whil|try)\b/.test(textBeforeCursor);
        const isAfterDot = !isAfterSelf && /\.$/.test(textBeforeCursor);

        const allCompletions = completionsRef.current;

        const createSuggestions = (items: typeof allCompletions) =>
          items.map(item => ({
            label: item.label,
            kind: item.kind,
            insertText: item.insertText,
            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: item.documentation,
            detail: item.detail,
            sortText: isAfterSelf
              ? (item.detail === 'Entity Control' ? `0_0_${item.label}` : `0_9_${item.label}`)
              : `3_${item.label}`,
            filterText: isAfterSelf && item.label.startsWith('self.')
              ? item.label.slice(5)
              : item.label,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: isAfterSelf && item.label.startsWith('self.')
                ? position.column - 5 - selfPartialWord.length
                : wordUntilPosition.startColumn,
              endColumn: position.column,
            },
          }));

        if (isAfterSelf) {
          return { suggestions: createSuggestions(allCompletions.filter(item =>
            item.label.startsWith('self.') ||
            item.detail?.includes('AppDaemon') ||
            item.detail?.includes('Time') ||
            item.detail?.includes('Sun') ||
            item.detail?.includes('Presence')
          )) };
        } else if (isAfterDot) {
          return { suggestions: createSuggestions(allCompletions.filter(item =>
            item.detail === 'JSON' ||
            item.detail === 'OS' ||
            item.detail === 'Datetime' ||
            item.detail === 'HTTP'
          )) };
        } else if (isEmptyLine || isStartingKeyword) {
          return { suggestions: createSuggestions(allCompletions.filter(item =>
            item.detail === 'Import' ||
            item.detail === 'Keyword' ||
            item.detail === 'Snippet' ||
            item.detail === 'Control Flow' ||
            item.label.startsWith('class ') ||
            item.label.startsWith('def ') ||
            item.label.startsWith('import ')
          )) };
        } else {
          return { suggestions: createSuggestions(allCompletions.filter(item =>
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
          )) };
        }
      },
    });

    // ── 2. Entity completions (Python) ────────────────────────────────────
    const entityProvider = monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['(', ',', "'", '"'],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        if (entitiesLoadingRef.current || entitiesRef.current.length === 0) {
          return { suggestions: [] };
        }

        const lineContent = model.getLineContent(position.lineNumber);
        const wordUntilPosition = model.getWordUntilPosition(position);

        if (!shouldTriggerEntityCompletion(lineContent, position.column)) {
          return { suggestions: [] };
        }

        const prefix = wordUntilPosition.word;
        const filteredEntities = filterEntitiesForContext(
          entitiesRef.current, lineContent, position.column, prefix
        );

        // Find the column right after the opening quote so we replace the
        // entire partial entity-id the user has typed, not just the last word.
        // Without this fix the range only covers the word-part after the last
        // dot, leaving a stale prefix in the editor.
        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        const openQuoteMatch = /(["'])([^'"]*?)$/.exec(textBeforeCursor);
        const startColumn = openQuoteMatch
          ? position.column - openQuoteMatch[2].length
          : wordUntilPosition.startColumn;

        const suggestions = createEntityCompletions(filteredEntities).map(item => ({
          label: item.label,
          kind: CompletionItemKind.Value,
          insertText: item.label,
          documentation: item.documentation,
          detail: item.detail,
          sortText: `1_${item.label}`,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn,
            endColumn: position.column,
          },
        }));

        return { suggestions };
      },
    });

    // ── 3. call_service / call_action domain completions (Python) ─────────
    const callServiceProvider = monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ["'", '"', '/'],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        const wordUntilPosition = model.getWordUntilPosition(position);

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
            kind: CompletionItemKind.Value,
            insertText: s.service,
            detail: s.detail,
            documentation: s.documentation,
            filterText: s.service,
            sortText: `2_${s.service}`,
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

    // ── 4. Signature help (Python) ────────────────────────────────────────
    const signatureProvider = monaco.languages.registerSignatureHelpProvider('python', {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model: editor.ITextModel, position: Position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const methodNames = Object.keys(APPDAEMON_SIGNATURES).join('|');
        const match = textUntilPosition.match(new RegExp(`self\\.(${methodNames})\\s*\\(([^)]*)$`));

        if (!match) {
          return { value: { signatures: [], activeSignature: 0, activeParameter: 0 }, dispose: () => {} };
        }

        const methodName = match[1];
        const paramsString = match[2];

        let activeParameter = 0;
        let depth = 0;
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < paramsString.length; i++) {
          const char = paramsString[i];
          if ((char === '"' || char === "'") && paramsString[i - 1] !== '\\') {
            if (!inString) { inString = true; stringChar = char; }
            else if (char === stringChar) { inString = false; }
          }
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
          value: { signatures: [sig], activeSignature: 0, activeParameter },
          dispose: () => {},
        };
      },
    });

    // ── 5. YAML completions (apps.yaml) ───────────────────────────────────
    const yamlProvider = monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [' ', ':'],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const wordUntilPosition = model.getWordUntilPosition(position);

        return {
          suggestions: YAML_APPDAEMON_SNIPPETS.map(snippet => ({
            label: snippet.label,
            kind: CompletionItemKind.Keyword,
            insertText: snippet.insertText,
            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: snippet.documentation,
            detail: snippet.detail,
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

    return () => {
      appDaemonProvider.dispose();
      entityProvider.dispose();
      callServiceProvider.dispose();
      signatureProvider.dispose();
      yamlProvider.dispose();
    };
  }, [monaco]); // Register once when monaco becomes available
}

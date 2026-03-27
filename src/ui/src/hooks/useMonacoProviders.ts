import { useEffect, useRef } from 'react';
import type { editor, Position } from 'monaco-editor';
import type { HAEntity } from '@/lib/home-assistant';
import {
  createEntityCompletions,
  shouldTriggerEntityCompletion,
  filterEntitiesForContext,
} from '@/lib/monaco/completions';
import { HA_SERVICES } from '@/lib/monaco/completions/ha-services';
import { YAML_APPDAEMON_SNIPPETS } from '@/lib/monaco/completions/yaml-appdaemon';
import { APPDAEMON_SIGNATURES } from '@/lib/monaco/completions/signatures';

/**
 * Registers Monaco completion and signature-help providers once.
 * Only provides what pylsp cannot: HA entities, HA services, AppDaemon
 * signatures, and AppDaemon-specific YAML field completions.
 */
export function useMonacoProviders(
  monaco: typeof import('monaco-editor') | null,
  entities: HAEntity[],
  entitiesLoading: boolean,
): void {
  const entitiesRef = useRef(entities);
  const entitiesLoadingRef = useRef(entitiesLoading);
  entitiesRef.current = entities;
  entitiesLoadingRef.current = entitiesLoading;

  useEffect(() => {
    if (!monaco) return;

    const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

    // ── 1. Entity completions (Python) ────────────────────────────────────
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

        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        const openQuoteMatch = /(["'])([^'"]*?)$/.exec(textBeforeCursor);
        const startColumn = openQuoteMatch
          ? position.column - openQuoteMatch[2].length
          : wordUntilPosition.startColumn;

        return {
          suggestions: createEntityCompletions(filteredEntities).map(item => ({
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
          })),
        };
      },
    });

    // ── 2. call_service / call_action domain completions (Python) ─────────
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

    // ── 3. Signature help (Python) ────────────────────────────────────────
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

    // ── 4. YAML completions (apps.yaml) ───────────────────────────────────
    const yamlProvider = monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [':'],
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
      entityProvider.dispose();
      callServiceProvider.dispose();
      signatureProvider.dispose();
      yamlProvider.dispose();
    };
  }, [monaco]);
}

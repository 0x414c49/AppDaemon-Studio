import { createMessageConnection } from 'vscode-jsonrpc';
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import type { IWebSocket } from 'vscode-ws-jsonrpc';
import type { editor } from 'monaco-editor';

// ── LSP message types (minimal subset) ───────────────────────────────────────

interface InitializeParams {
  processId: number | null;
  rootUri: string | null;
  capabilities: object;
  initializationOptions?: object;
}

interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

interface VersionedTextDocumentIdentifier {
  uri: string;
  version: number;
}

interface Position { line: number; character: number; }
interface Range { start: Position; end: Position; }

interface Diagnostic {
  range: Range;
  severity?: number; // 1=Error, 2=Warning, 3=Information, 4=Hint
  message: string;
  source?: string;
}

interface PublishDiagnosticsParams {
  uri: string;
  diagnostics: Diagnostic[];
}

interface HoverResult { contents: { kind: string; value: string } | string | Array<string | { language: string; value: string }> | null; }

interface CompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: string | { kind: string; value: string };
  insertText?: string;
  insertTextFormat?: number; // 1=PlainText, 2=Snippet
}

interface CompletionList {
  isIncomplete: boolean;
  items: CompletionItem[];
}

// ── IWebSocket adapter ────────────────────────────────────────────────────────

function toIWebSocket(ws: WebSocket): IWebSocket {
  return {
    send: (content: string) => ws.send(content),
    onMessage: (cb) => { ws.onmessage = (e) => cb(e.data); },
    onError: (cb) => { ws.onerror = (e) => cb(e); },
    onClose: (cb) => { ws.onclose = (e) => cb(e.code, e.reason); },
    dispose: () => ws.close(),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface LspClientHandle {
  notifyOpen(uri: string, text: string): void;
  notifyChange(uri: string, version: number, text: string): void;
  notifyClose(uri: string): void;
  dispose(): void;
}

/**
 * Starts a pylsp client connected over WebSocket.
 * Returns a handle for document lifecycle notifications and a disposable.
 *
 * The WebSocket URL is constructed relative to the current page URL so it
 * works correctly behind HA ingress (no hardcoded host/prefix).
 */
export function startLspClient(
  monacoInstance: typeof import('monaco-editor'),
): LspClientHandle {
  const wsUrl = (() => {
    const u = new URL('api/lsp', window.location.href);
    u.protocol = u.protocol.replace('http', 'ws');
    return u.toString();
  })();

  const ws = new WebSocket(wsUrl);
  const iws = toIWebSocket(ws);
  const reader = new WebSocketMessageReader(iws);
  const writer = new WebSocketMessageWriter(iws);
  const conn = createMessageConnection(reader, writer);

  const disposables: Array<{ dispose(): void }> = [];
  let initialized = false;
  let pendingOpen: { uri: string; text: string } | null = null;
  let currentOpenUri: string | null = null;

  // ── Diagnostics → Monaco markers ─────────────────────────────────────────
  conn.onNotification('textDocument/publishDiagnostics', (params: PublishDiagnosticsParams) => {
    // Monaco model URIs are inmemory://model/N — match by language instead
    const model = monacoInstance.editor.getModels().find(m => m.getLanguageId() === 'python');
    if (!model) return;

    const markers = params.diagnostics.map(d => ({
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: d.range.end.line + 1,
      endColumn: d.range.end.character + 1,
      message: d.message,
      severity: lspSeverityToMonaco(monacoInstance, d.severity ?? 1),
      source: d.source ?? 'pylsp',
    }));

    monacoInstance.editor.setModelMarkers(model, 'pylsp', markers);
  });

  // ── Hover provider ────────────────────────────────────────────────────────
  disposables.push(
    monacoInstance.languages.registerHoverProvider('python', {
      provideHover: async (model, position) => {
        if (!initialized) return null;

        const uri = currentOpenUri ?? model.uri.toString();
        const result = await conn.sendRequest('textDocument/hover', {
          textDocument: { uri },
          position: { line: position.lineNumber - 1, character: position.column - 1 },
        }).catch(() => null);

        const hoverResult = result as HoverResult | null;
        if (!hoverResult?.contents) return null;

        const value = extractHoverText(hoverResult.contents);
        if (!value) return null;

        return {
          contents: [{ value }],
        };
      },
    })
  );

  // ── Completion provider (supplements custom providers) ────────────────────
  disposables.push(
    monacoInstance.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['.', '(', ' '],
      provideCompletionItems: async (model, position) => {
        if (!initialized) return { suggestions: [] };

        const uri = currentOpenUri ?? model.uri.toString();
        const result = await conn.sendRequest(
          'textDocument/completion',
          {
            textDocument: { uri },
            position: { line: position.lineNumber - 1, character: position.column - 1 },
          }
        ).catch(() => null);

        if (!result) return { suggestions: [] };

        const completion = result as CompletionList | CompletionItem[];
        const items = Array.isArray(completion) ? completion : completion.items;
        const { CompletionItemKind, CompletionItemInsertTextRule } = monacoInstance.languages;
        const wordUntilPosition = model.getWordUntilPosition(position);

        // Suppress dunders when after self. — our custom provider handles AppDaemon methods
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        const isAfterSelf = /self\.\w*$/.test(textBeforeCursor);
        const filtered = isAfterSelf
          ? items.filter(item => !item.label.startsWith('_'))
          : items;

        return {
          suggestions: filtered.map(item => ({
            label: item.label,
            kind: lspCompletionKindToMonaco(CompletionItemKind, item.kind),
            detail: item.detail,
            documentation: typeof item.documentation === 'string'
              ? item.documentation
              : item.documentation?.value,
            insertText: item.insertText ?? item.label,
            insertTextRules: item.insertTextFormat === 2
              ? CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            // Push dunder/private items below everything else
            sortText: item.label.startsWith('__') ? `9_${item.label}`
                    : item.label.startsWith('_')  ? `8_${item.label}`
                    : `4_${item.label}`,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntilPosition.startColumn,
              endColumn: position.column,
            },
          })),
        };
      },
    })
  );

  // ── Connection lifecycle ──────────────────────────────────────────────────
  conn.listen();

  ws.addEventListener('open', async () => {
    try {
      await conn.sendRequest('initialize', {
        processId: null,
        rootUri: null,
        capabilities: {
          textDocument: {
            hover: { contentFormat: ['markdown', 'plaintext'] },
            completion: {
              completionItem: {
                snippetSupport: true,
                documentationFormat: ['markdown', 'plaintext'],
              },
            },
            publishDiagnostics: { relatedInformation: false },
          },
        },
        initializationOptions: {
          pylsp: {
            plugins: {
              jedi: { environment: '/opt/pylsp-venv' },
              pycodestyle: { enabled: false },
              mccabe: { enabled: false },
            },
          },
        },
      } satisfies InitializeParams);

      conn.sendNotification('initialized', {});
      initialized = true;

      // Flush any document that was opened before the handshake completed
      if (pendingOpen) {
        conn.sendNotification('textDocument/didOpen', {
          textDocument: { uri: pendingOpen.uri, languageId: 'python', version: 1, text: pendingOpen.text } satisfies TextDocumentItem,
        });
        pendingOpen = null;
      }
    } catch {
      // LSP not available — silently degrade
    }
  });

  ws.addEventListener('close', () => {
    initialized = false;
    monacoInstance.editor.getModels().forEach(m => {
      monacoInstance.editor.setModelMarkers(m, 'pylsp', []);
    });
  });

  // ── Returned handle ───────────────────────────────────────────────────────
  return {
    notifyOpen(uri: string, text: string) {
      currentOpenUri = uri;
      if (!initialized) {
        pendingOpen = { uri, text };
        return;
      }
      pendingOpen = null;
      conn.sendNotification('textDocument/didOpen', {
        textDocument: { uri, languageId: 'python', version: 1, text } satisfies TextDocumentItem,
      });
    },

    notifyChange(uri: string, version: number, text: string) {
      if (!initialized) return;
      conn.sendNotification('textDocument/didChange', {
        textDocument: { uri, version } satisfies VersionedTextDocumentIdentifier,
        contentChanges: [{ text }],
      });
    },

    notifyClose(uri: string) {
      if (currentOpenUri === uri) currentOpenUri = null;
      if (!initialized) return;
      conn.sendNotification('textDocument/didClose', {
        textDocument: { uri },
      });
    },

    dispose() {
      initialized = false;
      disposables.forEach(d => d.dispose());
      conn.dispose();
      ws.close();
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lspSeverityToMonaco(
  monaco: typeof import('monaco-editor'),
  severity: number
): import('monaco-editor').MarkerSeverity {
  switch (severity) {
    case 1: return monaco.MarkerSeverity.Error;
    case 2: return monaco.MarkerSeverity.Warning;
    case 3: return monaco.MarkerSeverity.Info;
    default: return monaco.MarkerSeverity.Hint;
  }
}

function lspCompletionKindToMonaco(
  kinds: typeof import('monaco-editor').languages.CompletionItemKind,
  lspKind?: number
): number {
  // LSP CompletionItemKind → Monaco CompletionItemKind (best-effort mapping)
  switch (lspKind) {
    case 1:  return kinds.Text;
    case 2:  return kinds.Method;
    case 3:  return kinds.Function;
    case 4:  return kinds.Constructor;
    case 5:  return kinds.Field;
    case 6:  return kinds.Variable;
    case 7:  return kinds.Class;
    case 8:  return kinds.Interface;
    case 9:  return kinds.Module;
    case 10: return kinds.Property;
    case 12: return kinds.Value;
    case 13: return kinds.Enum;
    case 14: return kinds.Keyword;
    case 15: return kinds.Snippet;
    case 17: return kinds.File;
    case 21: return kinds.Constant;
    case 22: return kinds.Struct;
    default: return kinds.Property;
  }
}

function extractHoverText(
  contents: HoverResult['contents']
): string | null {
  if (!contents) return null;
  if (typeof contents === 'string') return contents;
  if (Array.isArray(contents)) {
    return contents.map(c =>
      typeof c === 'string' ? c : `\`\`\`${c.language ?? ''}\n${c.value}\n\`\`\``
    ).join('\n\n') || null;
  }
  if (typeof contents === 'object' && 'value' in contents) {
    return contents.value || null;
  }
  return null;
}

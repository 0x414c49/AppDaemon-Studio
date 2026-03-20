export interface CompletionItem {
  label: string;
  kind: number;
  insertText: string;
  documentation?: string;
  detail?: string;
}

export interface CompletionDefinition {
  label: string;
  insertText: string;
  documentation?: string;
  detail?: string;
}

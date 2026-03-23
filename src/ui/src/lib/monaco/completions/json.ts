import type { CompletionDefinition } from './types';

export const JSON_OPERATIONS: CompletionDefinition[] = [
  {
    label: 'json.loads',
    insertText: "json.loads(\${1:json_string})",
    documentation: 'Parse JSON string to Python object',
    detail: 'JSON',
  },
  {
    label: 'json.dumps',
    insertText: "json.dumps(\${1:data}${2:, indent=2})",
    documentation: 'Convert Python object to JSON string',
    detail: 'JSON',
  },
  {
    label: 'json.load',
    insertText: "json.load(\${1:file_handle})",
    documentation: 'Load JSON from file',
    detail: 'JSON',
  },
  {
    label: 'json.dump',
    insertText: "json.dump(\${1:data}, \${2:file_handle}${3:, indent=2})",
    documentation: 'Save Python object to JSON file',
    detail: 'JSON',
  },
  {
    label: 'json read file',
    insertText: "with open('\${1:/config/www/data.json}', 'r') as f:\n    data = json.load(f)",
    documentation: 'Read JSON from file',
    detail: 'JSON Pattern',
  },
  {
    label: 'json write file',
    insertText: "with open('\${1:/config/www/data.json}', 'w') as f:\n    json.dump(\${2:data}, f, indent=2)",
    documentation: 'Write Python object to JSON file',
    detail: 'JSON Pattern',
  },
];

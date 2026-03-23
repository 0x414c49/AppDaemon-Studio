import type { CompletionDefinition } from './types';

export const REQUESTS_PATTERNS: CompletionDefinition[] = [
  {
    label: 'requests.get',
    insertText: "requests.get('\${1:https://api.example.com}')",
    documentation: 'HTTP GET request',
    detail: 'HTTP',
  },
  {
    label: 'requests.post',
    insertText: "requests.post('\${1:https://api.example.com}', json=\${2:data})",
    documentation: 'HTTP POST request with JSON',
    detail: 'HTTP',
  },
  {
    label: 'requests.get json',
    insertText: "response = requests.get('\${1:https://api.example.com}')\ndata = response.json()",
    documentation: 'GET request and parse JSON response',
    detail: 'HTTP',
  },
  {
    label: 'response.json',
    insertText: "response.json()",
    documentation: 'Parse JSON from response',
    detail: 'HTTP',
  },
  {
    label: 'response.status_code',
    insertText: "response.status_code",
    documentation: 'Get HTTP status code',
    detail: 'HTTP',
  },
];

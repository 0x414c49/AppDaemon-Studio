import type { CompletionDefinition } from './types';

export const OS_OPERATIONS: CompletionDefinition[] = [
  {
    label: 'os.path.join',
    insertText: "os.path.join('\${1:/config}', '\${2:www}', '\${3:file.txt}')",
    documentation: 'Join path components intelligently',
    detail: 'OS',
  },
  {
    label: 'os.path.exists',
    insertText: "os.path.exists('\${1:/config/www/file.txt}')",
    documentation: 'Check if path exists',
    detail: 'OS',
  },
  {
    label: 'os.listdir',
    insertText: "os.listdir('\${1:/config}')",
    documentation: 'List directory contents',
    detail: 'OS',
  },
  {
    label: 'os.environ.get',
    insertText: "os.environ.get('\${1:VAR_NAME}'${2:, '\${3:default}'})",
    documentation: 'Get environment variable',
    detail: 'OS',
  },
  {
    label: 'os.makedirs',
    insertText: "os.makedirs('\${1:/config/www/newdir}', exist_ok=True)",
    documentation: 'Create directory recursively',
    detail: 'OS',
  },
  {
    label: 'os.remove',
    insertText: "os.remove('\${1:/config/www/file.txt}')",
    documentation: 'Remove a file',
    detail: 'OS',
  },
  {
    label: 'os.getcwd',
    insertText: "os.getcwd()",
    documentation: 'Get current working directory',
    detail: 'OS',
  },
];

import type { CompletionDefinition } from './types';

export const DATETIME_OPERATIONS: CompletionDefinition[] = [
  {
    label: 'datetime.now',
    insertText: "datetime.now()",
    documentation: 'Get current datetime',
    detail: 'Datetime',
  },
  {
    label: 'datetime.now.strftime',
    insertText: "datetime.now().strftime('\${1:%H:%M:%S}')",
    documentation: 'Format current datetime as string',
    detail: 'Datetime',
  },
  {
    label: 'datetime.strptime',
    insertText: "datetime.strptime('\${1:07:00:00}', '\${2:%H:%M:%S}')",
    documentation: 'Parse string to datetime',
    detail: 'Datetime',
  },
  {
    label: 'timedelta minutes',
    insertText: "timedelta(minutes=\${1:5})",
    documentation: 'Create time delta in minutes',
    detail: 'Datetime',
  },
  {
    label: 'timedelta hours',
    insertText: "timedelta(hours=\${1:1})",
    documentation: 'Create time delta in hours',
    detail: 'Datetime',
  },
  {
    label: 'datetime ago',
    insertText: "datetime.now() - timedelta(\${1:hours=1})",
    documentation: 'Get datetime N time ago',
    detail: 'Datetime',
  },
  {
    label: 'datetime future',
    insertText: "datetime.now() + timedelta(\${1:minutes=30})",
    documentation: 'Get datetime N time in future',
    detail: 'Datetime',
  },
];

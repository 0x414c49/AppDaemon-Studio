import type { CompletionDefinition } from './types';

export const APPDAEMON_PATTERNS: CompletionDefinition[] = [
  {
    label: 'self.now_is_between',
    insertText: "self.now_is_between('\${1:07:00:00}', '\${2:22:00:00}')",
    documentation: 'Check if current time is between two times',
    detail: 'AppDaemon',
  },
  {
    label: 'self.sunrise',
    insertText: "self.sunrise()",
    documentation: 'Get next sunrise time',
    detail: 'AppDaemon',
  },
  {
    label: 'self.sunset',
    insertText: "self.sunset()",
    documentation: 'Get next sunset time',
    detail: 'AppDaemon',
  },
  {
    label: 'self.parse_time',
    insertText: "self.parse_time('\${1:07:00:00}')",
    documentation: 'Parse time string to time object',
    detail: 'AppDaemon',
  },
  {
    label: 'constrain_presence',
    insertText: "@self.constrain_presence('\${1|home,away|}')",
    documentation: 'Decorator to constrain by presence',
    detail: 'AppDaemon',
  },
  {
    label: 'constrain_days',
    insertText: "@self.constrain_days('\${1:mon,tue,wed,thu,fri}')",
    documentation: 'Decorator to constrain by days',
    detail: 'AppDaemon',
  },
  {
    label: 'notify service',
    insertText: "self.call_service('notify/notify', message='\${1:message}'${2:, title='\${3:Title}'})",
    documentation: 'Send notification',
    detail: 'AppDaemon',
  },
  {
    label: 'listen_state pattern',
    insertText: "self.listen_state(self.\${1:callback}, '\${2:entity_id}', new='\${3:on}', old='\${4:off}', duration=\${5:60})",
    documentation: 'Listen for state change with constraints',
    detail: 'AppDaemon',
  },
];

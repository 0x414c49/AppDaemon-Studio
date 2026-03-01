import type { HAEntity } from '../home-assistant';

// AppDaemon API methods with signatures
export const APPDAEMON_METHODS = [
  {
    label: 'self.turn_on',
    insertText: "self.turn_on('${1:entity_id}'${2:, **kwargs})",
    documentation: 'Turn on an entity (switch, light, etc.)',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.turn_off',
    insertText: "self.turn_off('${1:entity_id}'${2:, **kwargs})",
    documentation: 'Turn off an entity',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.toggle',
    insertText: "self.toggle('${1:entity_id}'${2:, **kwargs})",
    documentation: 'Toggle an entity state',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.get_state',
    insertText: "self.get_state('${1:entity_id}'${2:, attribute='${3:state}'${4:, default=${5:0}}})",
    documentation: 'Get current state of an entity',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.set_state',
    insertText: "self.set_state('${1:entity_id}', state=${2:new_state}${3:, attributes={}})",
    documentation: 'Set entity state',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.listen_state',
    insertText: "self.listen_state(self.${1:callback}, '${2:entity_id}'${3:, new=${4:None}${5:, old=${6:None}${7:, duration=${8:0}${9:, immediate=${10:False}}})",
    documentation: 'Listen for entity state changes',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.run_every',
    insertText: "self.run_every(self.${1:callback}, self.datetime(), ${2:60})",
    documentation: 'Run a callback every N seconds',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.run_daily',
    insertText: "self.run_daily(self.${1:callback}, self.parse_time('${2:07:00:00}'))",
    documentation: 'Run daily at specific time',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.run_at',
    insertText: "self.run_at(self.${1:callback}, self.datetime() + timedelta(${2:minutes=5}))",
    documentation: 'Run at a specific datetime',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.call_service',
    insertText: "self.call_service('${1:domain}/${2:service}'${3:, service_data={}})",
    documentation: 'Call any Home Assistant service',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.log',
    insertText: "self.log('${1:message}'${2:, level='${3|INFO,WARNING,ERROR,DEBUG|}'})",
    documentation: 'Log a message',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.datetime',
    insertText: "self.datetime()",
    documentation: 'Get current datetime',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.parse_time',
    insertText: "self.parse_time('${1:HH:MM:SS}')",
    documentation: 'Parse time string to time object',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.now',
    insertText: "self.now()",
    documentation: 'Get current time',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.now_is_between',
    insertText: "self.now_is_between('${1:start_time}', '${2:end_time}')",
    documentation: 'Check if current time is between two times',
    detail: 'AppDaemon API',
  },
  {
    label: 'self.entity_exists',
    insertText: "self.entity_exists('${1:entity_id}')",
    documentation: 'Check if entity exists',
    detail: 'AppDaemon API',
  },
];

// Static snippets
export const PYTHON_SNIPPETS = [
  {
    label: 'def initialize',
    insertText: `def initialize(self):
    """Initialize the app."""
    self.log("${1:App} initialized")
    ${2:# Your initialization code here}`,
    documentation: 'AppDaemon initialize method',
    detail: 'Snippet',
  },
  {
    label: 'timedelta',
    insertText: "timedelta(${1:minutes=5})",
    documentation: 'Create time delta',
    detail: 'Python',
  },
  {
    label: 'try/except',
    insertText: `try:
    ${1:# code}
except Exception as e:
    self.log(f"Error: {e}", level="ERROR")`,
    documentation: 'Error handling pattern',
    detail: 'Snippet',
  },
];

// Python imports for AppDaemon
export const PYTHON_IMPORTS = [
  {
    label: 'import appdaemon',
    insertText: "import appdaemon.plugins.hass.hassapi as hass",
    documentation: 'AppDaemon HassAPI - required base import',
    detail: 'Import',
  },
  {
    label: 'import json',
    insertText: "import json",
    documentation: 'JSON handling for data serialization',
    detail: 'Import',
  },
  {
    label: 'import os',
    insertText: "import os",
    documentation: 'OS module for file system operations',
    detail: 'Import',
  },
  {
    label: 'import datetime',
    insertText: "from datetime import datetime, timedelta",
    documentation: 'Date and time utilities',
    detail: 'Import',
  },
  {
    label: 'import math',
    insertText: "import math",
    documentation: 'Math functions and constants',
    detail: 'Import',
  },
  {
    label: 'import requests',
    insertText: "import requests",
    documentation: 'HTTP requests for API calls',
    detail: 'Import',
  },
];

export interface CompletionItem {
  label: string;
  kind: number;
  insertText: string;
  documentation?: string;
  detail?: string;
}

export function createAppDaemonCompletions(): CompletionItem[] {
  return [
    ...APPDAEMON_METHODS.map(item => ({ ...item, kind: 1 })), // Function
    ...PYTHON_SNIPPETS.map(item => ({ ...item, kind: 1 })), // Function/Snippet  
    ...PYTHON_IMPORTS.map(item => ({ ...item, kind: 17 })), // Keyword (for imports)
  ];
}

export function createEntityCompletions(entities: HAEntity[]): CompletionItem[] {
  return entities.map(entity => {
    const domain = entity.entity_id.split('.')[0];
    const friendlyName = entity.attributes.friendly_name || entity.entity_id;
    
    return {
      label: entity.entity_id,
      kind: 12, // Value completion
      insertText: `'${entity.entity_id}'`,
      documentation: `${friendlyName}\nState: ${entity.state}${entity.attributes.unit_of_measurement ? ' ' + entity.attributes.unit_of_measurement : ''}`,
      detail: `${domain} entity`,
    };
  });
}

export function shouldTriggerEntityCompletion(
  lineContent: string,
  position: number
): boolean {
  const textBeforeCursor = lineContent.substring(0, position);
  
  // Trigger after methods that take entity_id
  const entityMethods = ['turn_on', 'turn_off', 'toggle', 'get_state', 'set_state', 'listen_state', 'entity_exists'];
  for (const method of entityMethods) {
    const regex = new RegExp(`self\\.${method}\\s*\\([^)]*$`);
    if (regex.test(textBeforeCursor)) {
      return true;
    }
  }
  
  // Trigger on quote after comma
  if (/self\.[a-z_]+\s*\([^)]*,\s*['"]$/.test(textBeforeCursor)) {
    return true;
  }
  
  return false;
}

export function shouldTriggerMethodCompletion(
  lineContent: string,
  position: number
): boolean {
  const textBeforeCursor = lineContent.substring(0, position);
  
  // Trigger after 'self.'
  if (/self\.$/.test(textBeforeCursor)) {
    return true;
  }
  
  // Trigger at start of line (for imports, class definitions, etc.)
  if (/^\s*$/.test(textBeforeCursor)) {
    return true;
  }
  
  // Trigger when typing 'import' or 'from'
  if (/\b(impo|from|clas|def|if|for|whil|try)\b/.test(textBeforeCursor)) {
    return true;
  }
  
  return false;
}

export function filterEntitiesByPrefix(
  entities: HAEntity[],
  prefix: string
): HAEntity[] {
  const lowerPrefix = prefix.toLowerCase();
  return entities.filter(entity => 
    entity.entity_id.toLowerCase().includes(lowerPrefix) ||
    (entity.attributes.friendly_name?.toLowerCase().includes(lowerPrefix) ?? false)
  );
}

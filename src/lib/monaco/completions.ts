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
  {
    label: 'import re',
    insertText: "import re",
    documentation: 'Regular expressions',
    detail: 'Import',
  },
  {
    label: 'import random',
    insertText: "import random",
    documentation: 'Random number generation',
    detail: 'Import',
  },
  {
    label: 'import statistics',
    insertText: "import statistics",
    documentation: 'Statistical functions',
    detail: 'Import',
  },
  {
    label: 'import itertools',
    insertText: "import itertools",
    documentation: 'Iterator tools',
    detail: 'Import',
  },
  {
    label: 'import collections',
    insertText: "from collections import defaultdict, Counter",
    documentation: 'Collection data types',
    detail: 'Import',
  },
  {
    label: 'import typing',
    insertText: "from typing import Dict, List, Optional, Any, Union",
    documentation: 'Type hints',
    detail: 'Import',
  },
];

// Python keywords and constructs
export const PYTHON_KEYWORDS = [
  {
    label: 'class',
    insertText: "class ${1:ClassName}(${2:hass.Hass}):\n    \"\"\"${3:Docstring}\"\"\"\n\n    def ${4:initialize}(self):\n        \"\"\"${5:Initialize the app}\"\"\"\n        ${6:# Code here}",
    documentation: 'Define a new class',
    detail: 'Keyword',
  },
  {
    label: 'def',
    insertText: "def ${1:function_name}(self${2:, args}):\n    \"\"\"${3:Docstring}\"\"\"\n    ${4:# Code here}\n    ${5:pass}",
    documentation: 'Define a function',
    detail: 'Keyword',
  },
  {
    label: 'if',
    insertText: "if ${1:condition}:\n    ${2:# code}\nelif ${3:condition}:\n    ${4:# code}\nelse:\n    ${5:# code}",
    documentation: 'If-elif-else statement',
    detail: 'Control Flow',
  },
  {
    label: 'for',
    insertText: "for ${1:item} in ${2:iterable}:\n    ${3:# code}\n    ${4:pass}",
    documentation: 'For loop',
    detail: 'Control Flow',
  },
  {
    label: 'while',
    insertText: "while ${1:condition}:\n    ${2:# code}\n    ${3:pass}",
    documentation: 'While loop',
    detail: 'Control Flow',
  },
  {
    label: 'with',
    insertText: "with open('${1:filename}', '${2|r,w,a,rb,wb|}') as ${3:f}:\n    ${4:# code}",
    documentation: 'Context manager (file handling)',
    detail: 'Keyword',
  },
  {
    label: 'return',
    insertText: "return ${1:value}",
    documentation: 'Return statement',
    detail: 'Keyword',
  },
  {
    label: 'None',
    insertText: "None",
    documentation: 'None value',
    detail: 'Constant',
  },
  {
    label: 'True',
    insertText: "True",
    documentation: 'Boolean true',
    detail: 'Constant',
  },
  {
    label: 'False',
    insertText: "False",
    documentation: 'Boolean false',
    detail: 'Constant',
  },
  {
    label: 'pass',
    insertText: "pass",
    documentation: 'No operation placeholder',
    detail: 'Keyword',
  },
  {
    label: 'break',
    insertText: "break",
    documentation: 'Break out of loop',
    detail: 'Control Flow',
  },
  {
    label: 'continue',
    insertText: "continue",
    documentation: 'Continue to next iteration',
    detail: 'Control Flow',
  },
];

// Python built-in functions
export const PYTHON_BUILTINS = [
  {
    label: 'print',
    insertText: "print(${1:message})",
    documentation: 'Print to console',
    detail: 'Built-in',
  },
  {
    label: 'len',
    insertText: "len(${1:obj})",
    documentation: 'Get length of object',
    detail: 'Built-in',
  },
  {
    label: 'range',
    insertText: "range(${1:start}, ${2:stop}${3:, step=${4:1}})",
    documentation: 'Generate range of numbers',
    detail: 'Built-in',
  },
  {
    label: 'enumerate',
    insertText: "enumerate(${1:iterable}${2:, start=${3:0}})",
    documentation: 'Enumerate with index',
    detail: 'Built-in',
  },
  {
    label: 'zip',
    insertText: "zip(${1:iter1}, ${2:iter2})",
    documentation: 'Zip iterables together',
    detail: 'Built-in',
  },
  {
    label: 'map',
    insertText: "map(${1:function}, ${2:iterable})",
    documentation: 'Apply function to iterable',
    detail: 'Built-in',
  },
  {
    label: 'filter',
    insertText: "filter(${1:function}, ${2:iterable})",
    documentation: 'Filter iterable',
    detail: 'Built-in',
  },
  {
    label: 'sum',
    insertText: "sum(${1:iterable}${2:, start=${3:0}})",
    documentation: 'Sum numbers in iterable',
    detail: 'Built-in',
  },
  {
    label: 'min',
    insertText: "min(${1:iterable})",
    documentation: 'Find minimum value',
    detail: 'Built-in',
  },
  {
    label: 'max',
    insertText: "max(${1:iterable})",
    documentation: 'Find maximum value',
    detail: 'Built-in',
  },
  {
    label: 'round',
    insertText: "round(${1:number}${2:, ndigits=${3:2}})",
    documentation: 'Round to N decimal places',
    detail: 'Built-in',
  },
  {
    label: 'str',
    insertText: "str(${1:obj})",
    documentation: 'Convert to string',
    detail: 'Built-in',
  },
  {
    label: 'int',
    insertText: "int(${1:obj})",
    documentation: 'Convert to integer',
    detail: 'Built-in',
  },
  {
    label: 'float',
    insertText: "float(${1:obj})",
    documentation: 'Convert to float',
    detail: 'Built-in',
  },
  {
    label: 'list',
    insertText: "list(${1:iterable})",
    documentation: 'Create list from iterable',
    detail: 'Built-in',
  },
  {
    label: 'dict',
    insertText: "dict(${1:key_value_pairs})",
    documentation: 'Create dictionary',
    detail: 'Built-in',
  },
  {
    label: 'set',
    insertText: "set(${1:iterable})",
    documentation: 'Create set from iterable',
    detail: 'Built-in',
  },
  {
    label: 'tuple',
    insertText: "tuple(${1:iterable})",
    documentation: 'Create tuple from iterable',
    detail: 'Built-in',
  },
  {
    label: 'sorted',
    insertText: "sorted(${1:iterable}${2:, key=${3:None}${4:, reverse=${5:False}}})",
    documentation: 'Return sorted list',
    detail: 'Built-in',
  },
  {
    label: 'reversed',
    insertText: "reversed(${1:sequence})",
    documentation: 'Reverse iterator',
    detail: 'Built-in',
  },
  {
    label: 'any',
    insertText: "any(${1:iterable})",
    documentation: 'Check if any element is true',
    detail: 'Built-in',
  },
  {
    label: 'all',
    insertText: "all(${1:iterable})",
    documentation: 'Check if all elements are true',
    detail: 'Built-in',
  },
  {
    label: 'isinstance',
    insertText: "isinstance(${1:obj}, ${2:type})",
    documentation: 'Check object type',
    detail: 'Built-in',
  },
  {
    label: 'hasattr',
    insertText: "hasattr(${1:obj}, '${2:name}')",
    documentation: 'Check if object has attribute',
    detail: 'Built-in',
  },
  {
    label: 'getattr',
    insertText: "getattr(${1:obj}, '${2:name}'${3:, ${4:default}})",
    documentation: 'Get object attribute',
    detail: 'Built-in',
  },
  {
    label: 'setattr',
    insertText: "setattr(${1:obj}, '${2:name}', ${3:value})",
    documentation: 'Set object attribute',
    detail: 'Built-in',
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

import type { HAEntity } from '@/lib/home-assistant';
import type { CompletionItem, CompletionDefinition } from './types';

// Import all completion definitions
import { APPDAEMON_METHODS } from './appdaemon-methods';
import { PYTHON_SNIPPETS, PYTHON_IMPORTS, PYTHON_KEYWORDS, PYTHON_BUILTINS } from './python-essentials';
import { FILE_PATHS } from './file-paths';
import { JSON_OPERATIONS } from './json';
import { OS_OPERATIONS } from './os';
import { DATETIME_OPERATIONS } from './datetime';
import { APPDAEMON_PATTERNS } from './appdaemon-patterns';
import { REQUESTS_PATTERNS } from './http';

// Re-export types
export type { CompletionItem, CompletionDefinition };

// Re-export helper functions
export { shouldTriggerEntityCompletion, shouldTriggerMethodCompletion, filterEntitiesByPrefix } from './helpers';

// Combine all completions and deduplicate by label
function deduplicateCompletions(items: CompletionDefinition[]): CompletionDefinition[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.label)) {
      return false;
    }
    seen.add(item.label);
    return true;
  });
}

export function createAppDaemonCompletions(): CompletionItem[] {
  // Combine all completion definitions
  const allCompletions = deduplicateCompletions([
    ...APPDAEMON_METHODS,
    ...PYTHON_SNIPPETS,
    ...PYTHON_KEYWORDS,
    ...PYTHON_BUILTINS,
    ...PYTHON_IMPORTS,
    ...FILE_PATHS,
    ...JSON_OPERATIONS,
    ...OS_OPERATIONS,
    ...DATETIME_OPERATIONS,
    ...APPDAEMON_PATTERNS,
    ...REQUESTS_PATTERNS,
  ]);

  // Map to completion items with proper kind
  return allCompletions.map(item => {
    let kind = 1; // Default: Function
    
    // Assign kind based on detail
    if (item.detail === 'Import' || item.detail === 'Keyword') {
      kind = 17; // Keyword
    } else if (item.detail === 'Path') {
      kind = 12; // Value
    } else if (item.detail === 'Constant') {
      kind = 21; // Constant
    } else if (item.detail === 'Built-in') {
      kind = 1; // Function
    } else if (item.detail === 'Control Flow') {
      kind = 17; // Keyword
    }
    
    return {
      ...item,
      kind,
    };
  });
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

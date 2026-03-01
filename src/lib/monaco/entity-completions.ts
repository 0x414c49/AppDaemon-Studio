import type { HAEntity } from '../home-assistant';

// AppDaemon API methods that should trigger entity autocomplete
const ENTITY_METHODS = [
  'turn_on',
  'turn_off',
  'toggle',
  'listen_state',
  'get_state',
  'set_state',
  'call_service',
  'select_option',
  'set_value',
  'set_text_value',
];

export interface CompletionItem {
  label: string;
  kind: number;
  insertText: string;
  documentation?: string;
  detail?: string;
}

export function createEntityCompletions(entities: HAEntity[]): CompletionItem[] {
  return entities.map(entity => {
    const domain = entity.entity_id.split('.')[0];
    const friendlyName = entity.attributes.friendly_name || entity.entity_id;
    
    return {
      label: entity.entity_id,
      kind: 12, // Value completion item kind
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
  // Check if cursor is after a method that takes entity_id
  const textBeforeCursor = lineContent.substring(0, position);
  
  // Match patterns like: self.turn_on( or self.listen_state(callback, 
  for (const method of ENTITY_METHODS) {
    const regex = new RegExp(`self\\.${method}\\s*\\([^)]*$`);
    if (regex.test(textBeforeCursor)) {
      return true;
    }
  }
  
  // Also trigger on single/double quote after comma
  if (/self\.[a-z_]+\s*\([^)]*,\s*['"]$/.test(textBeforeCursor)) {
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

import type { HAEntity } from '@/lib/home-assistant';

export function shouldTriggerEntityCompletion(
  lineContent: string,
  position: number
): boolean {
  const textBeforeCursor = lineContent.substring(0, position);
  
  // Trigger inside quotes after entity methods
  // Matches: self.turn_on('|...'), self.get_state('ent|'), etc.
  const entityMethods = ['turn_on', 'turn_off', 'toggle', 'get_state', 'set_state', 'listen_state', 'entity_exists', 'check_for_entity'];
  
  for (const method of entityMethods) {
    // Pattern: self.method(..., ' or self.method(..., "
    const regex = new RegExp(`self\\.${method}\\s*\\([^)]*['"][^'"]*$`);
    if (regex.test(textBeforeCursor)) {
      return true;
    }
  }
  
  // Also trigger for any method with entity_id parameter inside quotes
  // Matches: self.any_method('...|...') or self.any_method(..., '...|...')
  if (/self\.[a-z_]+\s*\([^)]*['"][^'"]*$/.test(textBeforeCursor)) {
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

import type { HAEntity } from '@/lib/home-assistant';

// Domains that each method should offer as entity completions.
// Methods not listed here accept ALL entities.
const METHOD_DOMAIN_FILTER: Record<string, string[]> = {
  // Can be turned on/off/toggled
  turn_on:  ['light', 'switch', 'fan', 'cover', 'climate', 'media_player', 'input_boolean', 'automation', 'script', 'scene', 'humidifier', 'vacuum', 'lock', 'siren', 'button'],
  turn_off: ['light', 'switch', 'fan', 'cover', 'climate', 'media_player', 'input_boolean', 'automation', 'script', 'humidifier', 'vacuum', 'siren'],
  toggle:   ['light', 'switch', 'fan', 'cover', 'climate', 'media_player', 'input_boolean', 'automation', 'humidifier', 'vacuum', 'lock', 'siren'],

  // Input helpers — specific domains only
  set_value:      ['input_number', 'number'],
  set_textvalue:  ['input_text', 'text'],
  select_option:  ['input_select', 'select'],
  select_next:    ['input_select', 'select'],
  select_previous:['input_select', 'select'],
  constrain_input_boolean: ['input_boolean'],
  constrain_input_select:  ['input_select'],

  // Device trackers
  get_tracker_state: ['device_tracker', 'person'],

  // Calendar
  get_calendar_events: ['calendar'],

  // Media
  // (no special filter — call_service handles media_player)
};

/**
 * Detect which AppDaemon method the cursor is inside and return the
 * relevant domain whitelist (or null = show all entities).
 */
function getMethodForContext(textBeforeCursor: string): string | null {
  // Match: self.method_name( ... ' or self.method_name( ... "
  const match = /self\.([a-z_]+)\s*\([^)]*['"][^'"]*$/.exec(textBeforeCursor);
  return match ? match[1] : null;
}

export function shouldTriggerEntityCompletion(
  lineContent: string,
  position: number
): boolean {
  const textBeforeCursor = lineContent.substring(0, position);
  // Inside a string arg of any self.method() call
  return /self\.[a-z_]+\s*\([^)]*['"][^'"]*$/.test(textBeforeCursor);
}

export function shouldTriggerMethodCompletion(
  lineContent: string,
  position: number
): boolean {
  const textBeforeCursor = lineContent.substring(0, position);
  if (/self\.$/.test(textBeforeCursor)) return true;
  if (/^\s*$/.test(textBeforeCursor)) return true;
  if (/\b(impo|from|clas|def|if|for|whil|try)\b/.test(textBeforeCursor)) return true;
  return false;
}

export function filterEntitiesForContext(
  entities: HAEntity[],
  lineContent: string,
  position: number,
  prefix: string
): HAEntity[] {
  const textBeforeCursor = lineContent.substring(0, position);
  const method = getMethodForContext(textBeforeCursor);

  let candidates = entities;

  // Apply domain filter if the method has one
  if (method && METHOD_DOMAIN_FILTER[method]) {
    const allowed = METHOD_DOMAIN_FILTER[method];
    candidates = entities.filter(e => allowed.includes(e.entity_id.split('.')[0]));
  }

  // Apply prefix filter
  if (prefix) {
    const lower = prefix.toLowerCase();
    candidates = candidates.filter(
      e =>
        e.entity_id.toLowerCase().includes(lower) ||
        (e.attributes.friendly_name?.toLowerCase().includes(lower) ?? false)
    );
  }

  return candidates;
}

// Keep for backwards compatibility
export function filterEntitiesByPrefix(entities: HAEntity[], prefix: string): HAEntity[] {
  if (!prefix) return entities;
  const lower = prefix.toLowerCase();
  return entities.filter(
    e =>
      e.entity_id.toLowerCase().includes(lower) ||
      (e.attributes.friendly_name?.toLowerCase().includes(lower) ?? false)
  );
}

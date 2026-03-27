import type { HAEntity } from '@/lib/home-assistant';
import type { CompletionItem } from './types';

export type { CompletionItem };
export { shouldTriggerEntityCompletion, filterEntitiesForContext } from './helpers';

export function createEntityCompletions(entities: HAEntity[]): CompletionItem[] {
  return entities.map(entity => {
    const domain = entity.entity_id.split('.')[0];
    const friendlyName = entity.attributes.friendly_name || entity.entity_id;

    return {
      label: entity.entity_id,
      kind: 12, // Value
      insertText: `'${entity.entity_id}'`,
      documentation: `${friendlyName}\nState: ${entity.state}${entity.attributes.unit_of_measurement ? ' ' + entity.attributes.unit_of_measurement : ''}`,
      detail: `${domain} entity`,
    };
  });
}

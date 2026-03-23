import type { CompletionDefinition } from './types';

// Common multi-line patterns used as top-level snippets (triggered at start of line)
export const APPDAEMON_PATTERNS: CompletionDefinition[] = [
  {
    label: 'listen_state with constraints',
    insertText: "self.listen_state(self.${1:callback}, '${2:entity_id}', new='${3:on}', old='${4:off}', duration=${5:60})",
    documentation: 'Listen for a state change with new/old value and duration constraints.\nOnly fires after the entity has been in new state for duration seconds.',
    detail: 'Snippet',
  },
  {
    label: 'call_service notify',
    insertText: "self.call_service('notify/notify', message='${1:message}'${2:, title='${3:Title}'})",
    documentation: 'Send a notification via the default notify service.',
    detail: 'Snippet',
  },
  {
    label: 'call_service light turn_on',
    insertText: "self.call_service('light/turn_on', entity_id='${1:light.entity}', brightness=${2:255}${3:, transition=${4:1}})",
    documentation: 'Turn on a light with brightness and optional transition.',
    detail: 'Snippet',
  },
  {
    label: 'call_service climate set_temperature',
    insertText: "self.call_service('climate/set_temperature', entity_id='${1:climate.entity}', temperature=${2:20})",
    documentation: 'Set the target temperature for a climate entity.',
    detail: 'Snippet',
  },
  {
    label: 'call_service media_player play_media',
    insertText: "self.call_service('media_player/play_media', entity_id='${1:media_player.entity}', media_content_id='${2:url}', media_content_type='${3:music}')",
    documentation: 'Play media on a media_player entity.',
    detail: 'Snippet',
  },
  {
    label: 'MQTT listen pattern',
    insertText: [
      "self.mqtt_subscribe('${1:home/sensors/#}')",
      "self.listen_event(self.${2:on_mqtt}, 'MQTT_MESSAGE', topic='${1:home/sensors/#}', namespace='mqtt')",
    ].join('\n'),
    documentation: 'Subscribe to MQTT topic and listen for incoming messages.\nCallback receives: event_name, data (with topic and payload), kwargs',
    detail: 'Snippet',
  },
];

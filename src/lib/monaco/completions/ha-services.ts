export interface HaService {
  service: string;
  detail: string;
  documentation: string;
}

export const HA_SERVICES: HaService[] = [
  // Light
  { service: 'light/turn_on',       detail: 'light',         documentation: 'Turn on a light. kwargs: entity_id, brightness (0-255), rgb_color, color_temp, transition, effect' },
  { service: 'light/turn_off',      detail: 'light',         documentation: 'Turn off a light. kwargs: entity_id, transition' },
  { service: 'light/toggle',        detail: 'light',         documentation: 'Toggle a light on/off. kwargs: entity_id' },
  // Switch
  { service: 'switch/turn_on',      detail: 'switch',        documentation: 'Turn on a switch. kwargs: entity_id' },
  { service: 'switch/turn_off',     detail: 'switch',        documentation: 'Turn off a switch. kwargs: entity_id' },
  { service: 'switch/toggle',       detail: 'switch',        documentation: 'Toggle a switch. kwargs: entity_id' },
  // Climate
  { service: 'climate/set_temperature',   detail: 'climate', documentation: 'Set target temperature. kwargs: entity_id, temperature, hvac_mode' },
  { service: 'climate/set_hvac_mode',     detail: 'climate', documentation: 'Set HVAC mode. kwargs: entity_id, hvac_mode (off|heat|cool|auto|dry|fan_only)' },
  { service: 'climate/set_fan_mode',      detail: 'climate', documentation: 'Set fan mode. kwargs: entity_id, fan_mode' },
  { service: 'climate/turn_on',           detail: 'climate', documentation: 'Turn on climate device. kwargs: entity_id' },
  { service: 'climate/turn_off',          detail: 'climate', documentation: 'Turn off climate device. kwargs: entity_id' },
  // Cover
  { service: 'cover/open_cover',    detail: 'cover',         documentation: 'Open a cover. kwargs: entity_id' },
  { service: 'cover/close_cover',   detail: 'cover',         documentation: 'Close a cover. kwargs: entity_id' },
  { service: 'cover/toggle',        detail: 'cover',         documentation: 'Toggle a cover. kwargs: entity_id' },
  { service: 'cover/set_cover_position', detail: 'cover',    documentation: 'Set cover position (0-100). kwargs: entity_id, position' },
  // Fan
  { service: 'fan/turn_on',         detail: 'fan',           documentation: 'Turn on a fan. kwargs: entity_id, speed, percentage' },
  { service: 'fan/turn_off',        detail: 'fan',           documentation: 'Turn off a fan. kwargs: entity_id' },
  { service: 'fan/set_percentage',  detail: 'fan',           documentation: 'Set fan speed percentage (0-100). kwargs: entity_id, percentage' },
  // Lock
  { service: 'lock/lock',           detail: 'lock',          documentation: 'Lock a lock. kwargs: entity_id' },
  { service: 'lock/unlock',         detail: 'lock',          documentation: 'Unlock a lock. kwargs: entity_id, code (optional)' },
  // Media player
  { service: 'media_player/turn_on',           detail: 'media_player', documentation: 'Turn on media player. kwargs: entity_id' },
  { service: 'media_player/turn_off',          detail: 'media_player', documentation: 'Turn off media player. kwargs: entity_id' },
  { service: 'media_player/media_play',        detail: 'media_player', documentation: 'Start playback. kwargs: entity_id' },
  { service: 'media_player/media_pause',       detail: 'media_player', documentation: 'Pause playback. kwargs: entity_id' },
  { service: 'media_player/media_stop',        detail: 'media_player', documentation: 'Stop playback. kwargs: entity_id' },
  { service: 'media_player/media_next_track',  detail: 'media_player', documentation: 'Skip to next track. kwargs: entity_id' },
  { service: 'media_player/play_media',        detail: 'media_player', documentation: 'Play media. kwargs: entity_id, media_content_id, media_content_type' },
  { service: 'media_player/volume_set',        detail: 'media_player', documentation: 'Set volume (0.0-1.0). kwargs: entity_id, volume_level' },
  { service: 'media_player/volume_mute',       detail: 'media_player', documentation: 'Mute/unmute media player. kwargs: entity_id, is_volume_muted' },
  { service: 'media_player/select_source',     detail: 'media_player', documentation: 'Select input source. kwargs: entity_id, source' },
  // Notify
  { service: 'notify/notify',                  detail: 'notify', documentation: 'Send a notification. kwargs: message, title' },
  { service: 'notify/persistent_notification', detail: 'notify', documentation: 'Create a persistent HA notification. kwargs: message, title, notification_id' },
  // Input helpers
  { service: 'input_boolean/turn_on',      detail: 'input_boolean', documentation: 'Turn on input_boolean. kwargs: entity_id' },
  { service: 'input_boolean/turn_off',     detail: 'input_boolean', documentation: 'Turn off input_boolean. kwargs: entity_id' },
  { service: 'input_boolean/toggle',       detail: 'input_boolean', documentation: 'Toggle input_boolean. kwargs: entity_id' },
  { service: 'input_number/set_value',     detail: 'input_number',  documentation: 'Set input_number value. kwargs: entity_id, value' },
  { service: 'input_select/select_option', detail: 'input_select',  documentation: 'Set input_select option. kwargs: entity_id, option' },
  { service: 'input_text/set_value',       detail: 'input_text',    documentation: 'Set input_text value. kwargs: entity_id, value' },
  // Number / select (modern helpers)
  { service: 'number/set_value',           detail: 'number',        documentation: 'Set number entity value. kwargs: entity_id, value' },
  { service: 'select/select_option',       detail: 'select',        documentation: 'Select option on select entity. kwargs: entity_id, option' },
  // Button
  { service: 'button/press',               detail: 'button',        documentation: 'Press a button entity. kwargs: entity_id' },
  // Automation / Script / Scene
  { service: 'automation/trigger',         detail: 'automation',    documentation: 'Trigger an automation. kwargs: entity_id' },
  { service: 'automation/turn_on',         detail: 'automation',    documentation: 'Enable an automation. kwargs: entity_id' },
  { service: 'automation/turn_off',        detail: 'automation',    documentation: 'Disable an automation. kwargs: entity_id' },
  { service: 'automation/reload',          detail: 'automation',    documentation: 'Reload all automations from YAML.' },
  { service: 'script/turn_on',             detail: 'script',        documentation: 'Run a script. kwargs: entity_id, variables' },
  { service: 'script/turn_off',            detail: 'script',        documentation: 'Stop a running script. kwargs: entity_id' },
  { service: 'scene/turn_on',              detail: 'scene',         documentation: 'Activate a scene. kwargs: entity_id, transition' },
  // Timer
  { service: 'timer/start',                detail: 'timer',         documentation: 'Start a timer. kwargs: entity_id, duration (HH:MM:SS)' },
  { service: 'timer/cancel',               detail: 'timer',         documentation: 'Cancel a timer. kwargs: entity_id' },
  { service: 'timer/pause',                detail: 'timer',         documentation: 'Pause a timer. kwargs: entity_id' },
  { service: 'timer/finish',               detail: 'timer',         documentation: 'Finish a timer immediately. kwargs: entity_id' },
  // Persistent notification
  { service: 'persistent_notification/create',  detail: 'persistent_notification', documentation: 'Create a persistent notification. kwargs: message, title, notification_id' },
  { service: 'persistent_notification/dismiss', detail: 'persistent_notification', documentation: 'Dismiss a persistent notification. kwargs: notification_id' },
  // Home Assistant
  { service: 'homeassistant/restart',      detail: 'homeassistant', documentation: 'Restart Home Assistant.' },
  { service: 'homeassistant/reload_all',   detail: 'homeassistant', documentation: 'Reload all YAML configuration.' },
  { service: 'homeassistant/turn_on',      detail: 'homeassistant', documentation: 'Turn on entity via HA generic service. kwargs: entity_id' },
  { service: 'homeassistant/turn_off',     detail: 'homeassistant', documentation: 'Turn off entity via HA generic service. kwargs: entity_id' },
  { service: 'homeassistant/toggle',       detail: 'homeassistant', documentation: 'Toggle entity via HA generic service. kwargs: entity_id' },
  // TTS
  { service: 'tts/speak',                  detail: 'tts',           documentation: 'Speak text via TTS. kwargs: media_player_entity_id, message, language' },
  // Vacuum
  { service: 'vacuum/start',               detail: 'vacuum',        documentation: 'Start vacuum cleaning. kwargs: entity_id' },
  { service: 'vacuum/stop',                detail: 'vacuum',        documentation: 'Stop vacuum. kwargs: entity_id' },
  { service: 'vacuum/return_to_base',      detail: 'vacuum',        documentation: 'Return vacuum to base. kwargs: entity_id' },
  // Alarm control panel
  { service: 'alarm_control_panel/alarm_arm_away',   detail: 'alarm_control_panel', documentation: 'Arm alarm (away). kwargs: entity_id, code' },
  { service: 'alarm_control_panel/alarm_arm_home',   detail: 'alarm_control_panel', documentation: 'Arm alarm (home). kwargs: entity_id, code' },
  { service: 'alarm_control_panel/alarm_disarm',     detail: 'alarm_control_panel', documentation: 'Disarm alarm. kwargs: entity_id, code' },
  { service: 'alarm_control_panel/alarm_trigger',    detail: 'alarm_control_panel', documentation: 'Trigger alarm. kwargs: entity_id, code' },
];

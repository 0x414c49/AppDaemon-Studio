import type { CompletionDefinition } from './types';

// Entity Control
export const ENTITY_CONTROL: CompletionDefinition[] = [
  {
    label: 'self.turn_on',
    insertText: "self.turn_on('${1:entity_id}')",
    documentation: 'Turn on an entity (switch, light, etc.). Optional: kwargs for brightness, color, etc.',
    detail: 'Entity Control',
  },
  {
    label: 'self.turn_off',
    insertText: "self.turn_off('${1:entity_id}')",
    documentation: 'Turn off an entity',
    detail: 'Entity Control',
  },
  {
    label: 'self.toggle',
    insertText: "self.toggle('${1:entity_id}')",
    documentation: 'Toggle an entity state',
    detail: 'Entity Control',
  },
  {
    label: 'self.get_state',
    insertText: "self.get_state('${1:entity_id}')",
    documentation: 'Get current state of an entity. Optional: attribute=None, default=None, copy=True',
    detail: 'Entity Control',
  },
  {
    label: 'self.set_state',
    insertText: "self.set_state('${1:entity_id}', state='${2:new_state}')",
    documentation: 'Set entity state. Optional: attributes={}',
    detail: 'Entity Control',
  },
  {
    label: 'self.listen_state',
    insertText: "self.listen_state(self.${1:callback}, '${2:entity_id}')",
    documentation: 'Listen for entity state changes. Optional: attribute=None, new=None, old=None, duration=0, immediate=False',
    detail: 'Entity Control',
  },
  {
    label: 'self.entity_exists',
    insertText: "self.entity_exists('${1:entity_id}')",
    documentation: 'Check if entity exists in AppDaemon cache',
    detail: 'Entity Control',
  },
  {
    label: 'self.check_for_entity',
    insertText: "self.check_for_entity('${1:entity_id}')",
    documentation: 'Check if entity exists using REST API (more reliable)',
    detail: 'Entity Control',
  },
];

// Services
export const SERVICES: CompletionDefinition[] = [
  {
    label: 'self.call_service',
    insertText: "self.call_service('${1:domain}/${2:service}')",
    documentation: 'Call any Home Assistant service/action. Returns result dict with success status.',
    detail: 'Services',
  },
  {
    label: 'self.get_service_info',
    insertText: "self.get_service_info('${1:domain}/${2:service}')",
    documentation: 'Get detailed information about a service including fields and descriptions',
    detail: 'Services',
  },
  {
    label: 'self.run_script',
    insertText: "self.run_script('${1:script_name}')",
    documentation: 'Run a Home Assistant script',
    detail: 'Services',
  },
];

// History & Logging
export const HISTORY_LOGGING: CompletionDefinition[] = [
  {
    label: 'self.get_history',
    insertText: "self.get_history(entity_id='${1:entity_id}'${2:, days=1})",
    documentation: 'Get history for an entity from Home Assistant database. Returns list of state changes.',
    detail: 'History',
  },
  {
    label: 'self.get_logbook',
    insertText: "self.get_logbook(${1:days=1})",
    documentation: 'Get logbook entries from Home Assistant. Optional: entity, days',
    detail: 'History',
  },
  {
    label: 'self.log',
    insertText: "self.log('${1:message}')",
    documentation: 'Log a message to AppDaemon log. Optional: level="INFO"',
    detail: 'Logging',
  },
];

// Notifications
export const NOTIFICATIONS: CompletionDefinition[] = [
  {
    label: 'self.notify',
    insertText: "self.notify('${1:message}'${2:, title='${3:Title}'})",
    documentation: 'Send a notification using default notify service',
    detail: 'Notifications',
  },
  {
    label: 'self.notify_android',
    insertText: "self.notify_android('${1:message}'${2:, title='${3:Title}'})",
    documentation: 'Send notification to Android device with extra options',
    detail: 'Notifications',
  },
  {
    label: 'self.notify_ios',
    insertText: "self.notify_ios('${1:message}'${2:, title='${3:Title}'})",
    documentation: 'Send notification to iOS device with extra options',
    detail: 'Notifications',
  },
  {
    label: 'self.android_tts',
    insertText: "self.android_tts('${1:message}'${2:, tts_service='${3:tts}'})",
    documentation: 'Send TTS message to Android device',
    detail: 'Notifications',
  },
];

// Presence & Tracking
export const PRESENCE: CompletionDefinition[] = [
  {
    label: 'self.anyone_home',
    insertText: "self.anyone_home()",
    documentation: 'Check if anyone is home. Returns True/False',
    detail: 'Presence',
  },
  {
    label: 'self.everyone_home',
    insertText: "self.everyone_home()",
    documentation: 'Check if everyone is home. Returns True/False',
    detail: 'Presence',
  },
  {
    label: 'self.noone_home',
    insertText: "self.noone_home()",
    documentation: 'Check if no one is home. Returns True/False',
    detail: 'Presence',
  },
  {
    label: 'self.get_trackers',
    insertText: "self.get_trackers()",
    documentation: 'Get list of all device trackers. Optional: person=True',
    detail: 'Presence',
  },
  {
    label: 'self.get_tracker_details',
    insertText: "self.get_tracker_details()",
    documentation: 'Get details of all device trackers with states. Optional: person=True',
    detail: 'Presence',
  },
  {
    label: 'self.get_tracker_state',
    insertText: "self.get_tracker_state('${1:device_tracker.entity}')",
    documentation: 'Get state of a device tracker (home/not_home/zone)',
    detail: 'Presence',
  },
  {
    label: 'self.constrain_presence',
    insertText: "self.constrain_presence('${1|everyone,anyone,noone|}')",
    documentation: 'Decorator to constrain by presence',
    detail: 'Presence',
  },
  {
    label: 'self.constrain_person',
    insertText: "self.constrain_person('${1|everyone,anyone,noone|}')",
    documentation: 'Decorator to constrain by person (uses person entities)',
    detail: 'Presence',
  },
];

// Scheduling
export const SCHEDULING: CompletionDefinition[] = [
  {
    label: 'self.run_in',
    insertText: "self.run_in(self.${1:callback}, ${2:10})",
    documentation: 'Run callback in N seconds',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_at',
    insertText: "self.run_at(self.${1:callback}, self.datetime() + timedelta(${2:minutes=5}))",
    documentation: 'Run at specific datetime',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_once',
    insertText: "self.run_once(self.${1:callback}, self.parse_time('${2:07:00:00}'))",
    documentation: 'Run once at specific time (will run next occurrence)',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_daily',
    insertText: "self.run_daily(self.${1:callback}, self.parse_time('${2:07:00:00}'))",
    documentation: 'Run daily at specific time',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_hourly',
    insertText: "self.run_hourly(self.${1:callback}, self.parse_time('${2:00:00}'))",
    documentation: 'Run hourly at specific minute',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_minutely',
    insertText: "self.run_minutely(self.${1:callback}, self.parse_time('${2::00}'))",
    documentation: 'Run every minute at specific second',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_every',
    insertText: "self.run_every(self.${1:callback}, self.datetime(), ${2:60})",
    documentation: 'Run every N seconds',
    detail: 'Scheduling',
  },
  {
    label: 'self.cancel_timer',
    insertText: "self.cancel_timer(${1:handle})",
    documentation: 'Cancel a scheduled timer using its handle',
    detail: 'Scheduling',
  },
];

// Time & Sun
export const TIME_SUN: CompletionDefinition[] = [
  {
    label: 'self.datetime',
    insertText: "self.datetime()",
    documentation: 'Get current datetime as datetime object',
    detail: 'Time',
  },
  {
    label: 'self.time',
    insertText: "self.time()",
    documentation: 'Get current time as time object',
    detail: 'Time',
  },
  {
    label: 'self.now',
    insertText: "self.now()",
    documentation: 'Get current datetime (alias for datetime())',
    detail: 'Time',
  },
  {
    label: 'self.date',
    insertText: "self.date()",
    documentation: 'Get current date as date object',
    detail: 'Time',
  },
  {
    label: 'self.parse_time',
    insertText: "self.parse_time('${1:07:00:00}')",
    documentation: 'Parse time string to time object',
    detail: 'Time',
  },
  {
    label: 'self.parse_datetime',
    insertText: "self.parse_datetime('${1:2024-01-01 07:00:00}')",
    documentation: 'Parse datetime string to datetime object',
    detail: 'Time',
  },
  {
    label: 'self.now_is_between',
    insertText: "self.now_is_between('${1:07:00:00}', '${2:22:00:00}')",
    documentation: 'Check if current time is between two times',
    detail: 'Time',
  },
  {
    label: 'self.sunrise',
    insertText: "self.sunrise()",
    documentation: 'Get next sunrise time',
    detail: 'Sun',
  },
  {
    label: 'self.sunset',
    insertText: "self.sunset()",
    documentation: 'Get next sunset time',
    detail: 'Sun',
  },
  {
    label: 'self.sun_up',
    insertText: "self.sun_up()",
    documentation: 'Check if sun is up. Returns True/False',
    detail: 'Sun',
  },
  {
    label: 'self.sun_down',
    insertText: "self.sun_down()",
    documentation: 'Check if sun is down. Returns True/False',
    detail: 'Sun',
  },
];

// Input Helpers
export const INPUT_HELPERS: CompletionDefinition[] = [
  {
    label: 'self.set_value',
    insertText: "self.set_value('${1:input_number.entity}', ${2:value})",
    documentation: 'Set value of an input_number entity',
    detail: 'Input Helpers',
  },
  {
    label: 'self.set_textvalue',
    insertText: "self.set_textvalue('${1:input_text.entity}', '${2:value}')",
    documentation: 'Set value of an input_text entity',
    detail: 'Input Helpers',
  },
  {
    label: 'self.select_option',
    insertText: "self.select_option('${1:input_select.entity}', '${2:option}')",
    documentation: 'Select option in input_select entity',
    detail: 'Input Helpers',
  },
  {
    label: 'self.constrain_input_boolean',
    insertText: "self.constrain_input_boolean('${1:input_boolean.entity}')",
    documentation: 'Decorator to constrain by input_boolean state',
    detail: 'Input Helpers',
  },
  {
    label: 'self.constrain_input_select',
    insertText: "self.constrain_input_select('${1:input_select.entity}')",
    documentation: 'Decorator to constrain by input_select value',
    detail: 'Input Helpers',
  },
];

// Devices & Areas
export const DEVICES_AREAS: CompletionDefinition[] = [
  {
    label: 'self.device_entities',
    insertText: "self.device_entities('${1:device_id}')",
    documentation: 'Get list of entities for a device',
    detail: 'Devices',
  },
  {
    label: 'self.device_attr',
    insertText: "self.device_attr('${1:device_id}', '${2:attribute}')",
    documentation: 'Get device attribute value',
    detail: 'Devices',
  },
  {
    label: 'self.is_device_attr',
    insertText: "self.is_device_attr('${1:device_id}', '${2:attribute}')",
    documentation: 'Check if device has attribute',
    detail: 'Devices',
  },
  {
    label: 'self.device_id',
    insertText: "self.device_id('${1:entity_id}')",
    documentation: 'Get device ID for an entity',
    detail: 'Devices',
  },
  {
    label: 'self.areas',
    insertText: "self.areas()",
    documentation: 'Get list of all areas',
    detail: 'Areas',
  },
  {
    label: 'self.area_id',
    insertText: "self.area_id('${1:entity_id}')",
    documentation: 'Get area ID for an entity or device',
    detail: 'Areas',
  },
  {
    label: 'self.area_name',
    insertText: "self.area_name('${1:area_id}')",
    documentation: 'Get area name from area ID',
    detail: 'Areas',
  },
  {
    label: 'self.area_entities',
    insertText: "self.area_entities('${1:area_id}')",
    documentation: 'Get list of entities in an area',
    detail: 'Areas',
  },
  {
    label: 'self.area_devices',
    insertText: "self.area_devices('${1:area_id}')",
    documentation: 'Get list of devices in an area',
    detail: 'Areas',
  },
  {
    label: 'self.integration_entities',
    insertText: "self.integration_entities('${1:integration_name}')",
    documentation: 'Get list of entities for an integration',
    detail: 'Devices',
  },
];

// Calendar & Events
export const CALENDAR_EVENTS: CompletionDefinition[] = [
  {
    label: 'self.get_calendar_events',
    insertText: "self.get_calendar_events('${1:calendar.entity}'${2:, days=7})",
    documentation: 'Get calendar events. Optional: start_date_time, end_date_time, days',
    detail: 'Calendar',
  },
  {
    label: 'self.listen_event',
    insertText: "self.listen_event(self.${1:callback}, '${2:event_type}')",
    documentation: 'Listen for Home Assistant events',
    detail: 'Events',
  },
  {
    label: 'self.fire_event',
    insertText: "self.fire_event('${1:event_type}'${2:, **kwargs})",
    documentation: 'Fire a custom event',
    detail: 'Events',
  },
];

// Templates & Misc
export const TEMPLATES_MISC: CompletionDefinition[] = [
  {
    label: 'self.render_template',
    insertText: "self.render_template('${1:{{ states.sensor.temp.state }}'}')",
    documentation: 'Render a Home Assistant Jinja2 template',
    detail: 'Templates',
  },
  {
    label: 'self.ping',
    insertText: "self.ping()",
    documentation: 'Ping Home Assistant and get response time in seconds',
    detail: 'Misc',
  },
  {
    label: 'self.last_pressed',
    insertText: "self.last_pressed('${1:sensor.button}')",
    documentation: 'Get timestamp of last button press',
    detail: 'Misc',
  },
  {
    label: 'self.time_since_last_press',
    insertText: "self.time_since_last_press('${1:sensor.button}')",
    documentation: 'Get seconds since last button press',
    detail: 'Misc',
  },
  {
    label: 'self.process_conversation',
    insertText: "self.process_conversation('${1:text}')",
    documentation: 'Process text through Home Assistant conversation agent',
    detail: 'Misc',
  },
];

// Backup & Restore
export const BACKUP_RESTORE: CompletionDefinition[] = [
  {
    label: 'self.backup_full',
    insertText: "self.backup_full()",
    documentation: 'Create full Home Assistant backup',
    detail: 'Backup',
  },
  {
    label: 'self.backup_partial',
    insertText: "self.backup_partial()",
    documentation: 'Create partial Home Assistant backup',
    detail: 'Backup',
  },
  {
    label: 'self.restore_full',
    insertText: "self.restore_full('${1:backup_slug}')",
    documentation: 'Restore full Home Assistant backup',
    detail: 'Backup',
  },
  {
    label: 'self.restore_partial',
    insertText: "self.restore_partial('${1:backup_slug}')",
    documentation: 'Restore partial Home Assistant backup',
    detail: 'Backup',
  },
];

// Combine all methods
export const APPDAEMON_METHODS: CompletionDefinition[] = [
  ...ENTITY_CONTROL,
  ...SERVICES,
  ...HISTORY_LOGGING,
  ...NOTIFICATIONS,
  ...PRESENCE,
  ...SCHEDULING,
  ...TIME_SUN,
  ...INPUT_HELPERS,
  ...DEVICES_AREAS,
  ...CALENDAR_EVENTS,
  ...TEMPLATES_MISC,
  ...BACKUP_RESTORE,
];

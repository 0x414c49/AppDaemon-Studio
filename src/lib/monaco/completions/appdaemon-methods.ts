import type { CompletionDefinition } from './types';

// ── Entity Control ─────────────────────────────────────────────────────────────
export const ENTITY_CONTROL: CompletionDefinition[] = [
  {
    label: 'self.turn_on',
    insertText: "self.turn_on('${1:entity_id}')",
    documentation: 'Turn on a light, switch, fan, cover, climate, media_player, or any toggleable entity.\nOptional kwargs: brightness (0-255), rgb_color, color_temp, transition, effect, etc.\nReturns: None',
    detail: 'Entity Control',
  },
  {
    label: 'self.turn_off',
    insertText: "self.turn_off('${1:entity_id}')",
    documentation: 'Turn off a light, switch, fan, cover, climate, media_player, or any toggleable entity.\nOptional kwargs: transition\nReturns: None',
    detail: 'Entity Control',
  },
  {
    label: 'self.toggle',
    insertText: "self.toggle('${1:entity_id}')",
    documentation: 'Toggle an entity between on and off.\nReturns: None',
    detail: 'Entity Control',
  },
  {
    label: 'self.get_state',
    insertText: "self.get_state('${1:entity_id}')",
    documentation: 'Get the current state of an entity.\nOptional: attribute=None, default=None, copy=True, namespace=None\nReturns: state string, attribute value, or dict of all attributes if attribute="all"',
    detail: 'Entity Control',
  },
  {
    label: 'self.set_state',
    insertText: "self.set_state('${1:entity_id}', state='${2:new_state}')",
    documentation: 'Set the state of an entity in AppDaemon\'s state cache (does NOT write to HA).\nOptional: attributes={}, namespace=None, replace=False\nReturns: dict of new state',
    detail: 'Entity Control',
  },
  {
    label: 'self.listen_state',
    insertText: "self.listen_state(self.${1:callback}, '${2:entity_id}')",
    documentation: 'Register a callback for entity state changes.\nOptional: attribute=None, new=None, old=None, duration=0, immediate=False, timeout=None, namespace=None\nCallback signature: def cb(self, entity, attribute, old, new, kwargs)\nReturns: handle (pass to cancel_listen_state)',
    detail: 'Entity Control',
  },
  {
    label: 'self.cancel_listen_state',
    insertText: "self.cancel_listen_state(${1:handle})",
    documentation: 'Cancel a listen_state() subscription.\nArgs: handle — returned by listen_state()\nReturns: True if cancelled, False if handle not found',
    detail: 'Entity Control',
  },
  {
    label: 'self.info_listen_state',
    insertText: "self.info_listen_state(${1:handle})",
    documentation: 'Get info about a listen_state() subscription.\nReturns: dict with entity_id, attribute, new, old, duration, immediate, kwargs',
    detail: 'Entity Control',
  },
  {
    label: 'self.entity_exists',
    insertText: "self.entity_exists('${1:entity_id}')",
    documentation: 'Check if an entity exists in AppDaemon\'s cache.\nOptional: namespace=None\nReturns: True/False',
    detail: 'Entity Control',
  },
  {
    label: 'self.get_entity',
    insertText: "self.get_entity('${1:entity_id}')",
    documentation: 'Get an Entity object for the given entity_id. Provides object-oriented access to state and attributes.\nReturns: Entity object with .state, .attributes, .turn_on(), .turn_off(), etc.',
    detail: 'Entity Control',
  },
  {
    label: 'self.get_entities',
    insertText: "self.get_entities()",
    documentation: 'Get all entities in AppDaemon\'s state cache.\nOptional: namespace=None\nReturns: dict of {entity_id: state_dict}',
    detail: 'Entity Control',
  },
];

// ── Events ────────────────────────────────────────────────────────────────────
export const EVENTS: CompletionDefinition[] = [
  {
    label: 'self.listen_event',
    insertText: "self.listen_event(self.${1:callback}, '${2:event_type}')",
    documentation: 'Register a callback for Home Assistant events.\nOptional: namespace=None, **kwargs to filter event data\nCallback signature: def cb(self, event_name, data, kwargs)\nReturns: handle (pass to cancel_listen_event)',
    detail: 'Events',
  },
  {
    label: 'self.cancel_listen_event',
    insertText: "self.cancel_listen_event(${1:handle})",
    documentation: 'Cancel a listen_event() subscription.\nArgs: handle — returned by listen_event()\nReturns: True if cancelled',
    detail: 'Events',
  },
  {
    label: 'self.info_listen_event',
    insertText: "self.info_listen_event(${1:handle})",
    documentation: 'Get info about a listen_event() subscription.\nReturns: dict with event, kwargs',
    detail: 'Events',
  },
  {
    label: 'self.fire_event',
    insertText: "self.fire_event('${1:event_type}'${2:, entity_id='${3:}'})",
    documentation: 'Fire a custom event in Home Assistant.\nArgs: event_type (str), plus any keyword args that become event data\nReturns: None',
    detail: 'Events',
  },
];

// ── Services / Actions ────────────────────────────────────────────────────────
export const SERVICES: CompletionDefinition[] = [
  {
    label: 'self.call_service',
    insertText: "self.call_service('${1:domain}/${2:service}'${3:, entity_id='${4:}'})",
    documentation: 'Call any Home Assistant service (or action in HA 2024.8+).\nArgs: service as "domain/service_name", plus service-specific kwargs\nOptional: namespace=None, return_result=False\nReturns: None, or result dict if return_result=True',
    detail: 'Services',
  },
  {
    label: 'self.call_action',
    insertText: "self.call_action('${1:domain}/${2:action}'${3:, entity_id='${4:}'})",
    documentation: 'Call a Home Assistant action (HA 2024.8+ preferred API, same as call_service).\nArgs: action as "domain/action_name", plus action-specific kwargs\nReturns: None',
    detail: 'Services',
  },
  {
    label: 'self.get_service_info',
    insertText: "self.get_service_info('${1:domain}', '${2:service}')",
    documentation: 'Get detailed information about a service including its fields and descriptions.\nReturns: dict',
    detail: 'Services',
  },
  {
    label: 'self.list_services',
    insertText: "self.list_services()",
    documentation: 'Get all available Home Assistant services.\nOptional: namespace=None\nReturns: list of service dicts',
    detail: 'Services',
  },
  {
    label: 'self.run_script',
    insertText: "self.run_script('${1:script_name}')",
    documentation: 'Run a Home Assistant script by its entity_id or name.\nReturns: None',
    detail: 'Services',
  },
];

// ── Scheduling ────────────────────────────────────────────────────────────────
export const SCHEDULING: CompletionDefinition[] = [
  {
    label: 'self.run_in',
    insertText: "self.run_in(self.${1:callback}, ${2:10})",
    documentation: 'Run callback after N seconds.\nArgs: callback, delay_seconds\nCallback signature: def cb(self, kwargs)\nReturns: handle (pass to cancel_timer)',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_at',
    insertText: "self.run_at(self.${1:callback}, '${2:2024-01-01 07:00:00}')",
    documentation: 'Run callback at a specific datetime.\nArgs: callback, time (datetime, date, or "HH:MM:SS" string)\nReturns: handle',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_once',
    insertText: "self.run_once(self.${1:callback}, '${2:07:00:00}')",
    documentation: 'Run callback once at a specific time of day (next occurrence).\nArgs: callback, time ("HH:MM:SS" string or time object)\nReturns: handle',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_daily',
    insertText: "self.run_daily(self.${1:callback}, '${2:07:00:00}')",
    documentation: 'Run callback every day at a specific time.\nArgs: callback, time ("HH:MM:SS" string)\nOptional: **kwargs passed to callback\nReturns: handle',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_hourly',
    insertText: "self.run_hourly(self.${1:callback}, '${2:00:00}')",
    documentation: 'Run callback every hour at a specific minute:second.\nArgs: callback, time (":MM:SS" string)\nReturns: handle',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_minutely',
    insertText: "self.run_minutely(self.${1:callback}, '${2::00}')",
    documentation: 'Run callback every minute at a specific second.\nArgs: callback, time ("::SS" string)\nReturns: handle',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_every',
    insertText: "self.run_every(self.${1:callback}, self.datetime(), ${2:60})",
    documentation: 'Run callback every N seconds starting from a start time.\nArgs: callback, start (datetime), interval_seconds\nReturns: handle',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_at_sunrise',
    insertText: "self.run_at_sunrise(self.${1:callback}${2:, offset=0})",
    documentation: 'Run callback at sunrise each day.\nOptional: offset=seconds (positive = after sunrise, negative = before)\nReturns: handle',
    detail: 'Scheduling',
  },
  {
    label: 'self.run_at_sunset',
    insertText: "self.run_at_sunset(self.${1:callback}${2:, offset=0})",
    documentation: 'Run callback at sunset each day.\nOptional: offset=seconds (positive = after sunset, negative = before)\nReturns: handle',
    detail: 'Scheduling',
  },
  {
    label: 'self.cancel_timer',
    insertText: "self.cancel_timer(${1:handle})",
    documentation: 'Cancel a scheduled timer.\nArgs: handle — returned by run_in(), run_daily(), run_every(), etc.\nReturns: True if cancelled',
    detail: 'Scheduling',
  },
  {
    label: 'self.info_timer',
    insertText: "self.info_timer(${1:handle})",
    documentation: 'Get info about a scheduled timer.\nReturns: dict with interval, next_fire, kwargs',
    detail: 'Scheduling',
  },
  {
    label: 'self.timer_running',
    insertText: "self.timer_running(${1:handle})",
    documentation: 'Check if a timer is still active.\nReturns: True/False',
    detail: 'Scheduling',
  },
];

// ── Time & Sun ────────────────────────────────────────────────────────────────
export const TIME_SUN: CompletionDefinition[] = [
  {
    label: 'self.datetime',
    insertText: "self.datetime()",
    documentation: 'Get the current AppDaemon datetime (respects time_travel in testing).\nReturns: datetime object',
    detail: 'Time',
  },
  {
    label: 'self.time',
    insertText: "self.time()",
    documentation: 'Get the current time as a time object.\nReturns: time object',
    detail: 'Time',
  },
  {
    label: 'self.date',
    insertText: "self.date()",
    documentation: 'Get the current date as a date object.\nReturns: date object',
    detail: 'Time',
  },
  {
    label: 'self.now_is_between',
    insertText: "self.now_is_between('${1:07:00:00}', '${2:22:00:00}')",
    documentation: 'Check if current time is between two times (handles midnight crossing).\nArgs: start_time, end_time (both "HH:MM:SS" strings)\nReturns: True/False',
    detail: 'Time',
  },
  {
    label: 'self.parse_time',
    insertText: "self.parse_time('${1:07:00:00}')",
    documentation: 'Parse a time string into a time object.\nAccepts: "HH:MM:SS", "sunrise", "sunset", "sunrise+HH:MM:SS", etc.\nReturns: time object',
    detail: 'Time',
  },
  {
    label: 'self.parse_datetime',
    insertText: "self.parse_datetime('${1:2024-01-01 07:00:00}')",
    documentation: 'Parse a datetime string into a datetime object.\nReturns: datetime object',
    detail: 'Time',
  },
  {
    label: 'self.convert_utc',
    insertText: "self.convert_utc(${1:utc_datetime})",
    documentation: 'Convert a UTC datetime to the local timezone.\nReturns: datetime object in local timezone',
    detail: 'Time',
  },
  {
    label: 'self.sunrise',
    insertText: "self.sunrise()",
    documentation: 'Get the next sunrise datetime.\nOptional: before=True to get previous sunrise\nReturns: datetime object',
    detail: 'Sun',
  },
  {
    label: 'self.sunset',
    insertText: "self.sunset()",
    documentation: 'Get the next sunset datetime.\nOptional: before=True to get previous sunset\nReturns: datetime object',
    detail: 'Sun',
  },
  {
    label: 'self.sun_up',
    insertText: "self.sun_up()",
    documentation: 'Check if the sun is currently above the horizon.\nReturns: True/False',
    detail: 'Sun',
  },
  {
    label: 'self.sun_down',
    insertText: "self.sun_down()",
    documentation: 'Check if the sun is currently below the horizon.\nReturns: True/False',
    detail: 'Sun',
  },
];

// ── Logging ───────────────────────────────────────────────────────────────────
export const LOGGING: CompletionDefinition[] = [
  {
    label: 'self.log',
    insertText: "self.log('${1:message}'${2:, level='INFO'})",
    documentation: 'Log a message to the AppDaemon log.\nOptional: level="INFO"|"WARNING"|"ERROR"|"DEBUG"|"CRITICAL", ascii_encode=True\nLog levels: DEBUG < INFO < WARNING < ERROR < CRITICAL',
    detail: 'Logging',
  },
  {
    label: 'self.error',
    insertText: "self.error('${1:message}'${2:, level='WARNING'})",
    documentation: 'Log a message to the AppDaemon error log.\nOptional: level="WARNING"|"ERROR"|"CRITICAL"\nReturns: None',
    detail: 'Logging',
  },
  {
    label: 'self.listen_log',
    insertText: "self.listen_log(self.${1:callback}${2:, level='INFO'})",
    documentation: 'Register a callback for AppDaemon log messages.\nCallback signature: def cb(self, name, ts, level, type, message, kwargs)\nOptional: log="main_log"|"error_log"|"diag_log"\nReturns: handle',
    detail: 'Logging',
  },
  {
    label: 'self.cancel_listen_log',
    insertText: "self.cancel_listen_log(${1:handle})",
    documentation: 'Cancel a listen_log() subscription.\nReturns: True if cancelled',
    detail: 'Logging',
  },
  {
    label: 'self.get_main_log',
    insertText: "self.get_main_log()",
    documentation: 'Get the Python logger for the main AppDaemon log.\nReturns: logging.Logger object',
    detail: 'Logging',
  },
  {
    label: 'self.get_error_log',
    insertText: "self.get_error_log()",
    documentation: 'Get the Python logger for the AppDaemon error log.\nReturns: logging.Logger object',
    detail: 'Logging',
  },
  {
    label: 'self.get_user_log',
    insertText: "self.get_user_log('${1:log_name}')",
    documentation: 'Get a named user-defined Python logger (must be defined in appdaemon.yaml logs section).\nReturns: logging.Logger object',
    detail: 'Logging',
  },
];

// ── History ───────────────────────────────────────────────────────────────────
export const HISTORY: CompletionDefinition[] = [
  {
    label: 'self.get_history',
    insertText: "self.get_history(entity_id='${1:entity_id}'${2:, days=1})",
    documentation: 'Get state history for an entity from the Home Assistant recorder.\nOptional: days=1, start_time, end_time, significant_changes_only=False\nReturns: list of state change dicts',
    detail: 'History',
  },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const NOTIFICATIONS: CompletionDefinition[] = [
  {
    label: 'self.notify',
    insertText: "self.notify('${1:message}'${2:, title='${3:Notification}', name='${4:notify}'})",
    documentation: 'Send a notification via the Home Assistant notify service.\nOptional: title, name (notify target, default "notify"), namespace\nReturns: None',
    detail: 'Notifications',
  },
];

// ── Presence ──────────────────────────────────────────────────────────────────
export const PRESENCE: CompletionDefinition[] = [
  {
    label: 'self.anyone_home',
    insertText: "self.anyone_home()",
    documentation: 'Check if anyone is home (any device_tracker is "home").\nOptional: **kwargs to filter tracker attributes\nReturns: True/False',
    detail: 'Presence',
  },
  {
    label: 'self.everyone_home',
    insertText: "self.everyone_home()",
    documentation: 'Check if everyone is home (all device_trackers are "home").\nOptional: **kwargs to filter tracker attributes\nReturns: True/False',
    detail: 'Presence',
  },
  {
    label: 'self.noone_home',
    insertText: "self.noone_home()",
    documentation: 'Check if no one is home (no device_tracker is "home").\nOptional: **kwargs to filter tracker attributes\nReturns: True/False',
    detail: 'Presence',
  },
  {
    label: 'self.get_trackers',
    insertText: "self.get_trackers()",
    documentation: 'Get a list of all device_tracker entity IDs.\nReturns: list of entity_id strings',
    detail: 'Presence',
  },
  {
    label: 'self.get_tracker_details',
    insertText: "self.get_tracker_details()",
    documentation: 'Get full state details for all device_trackers.\nReturns: dict of {entity_id: state_dict}',
    detail: 'Presence',
  },
  {
    label: 'self.get_tracker_state',
    insertText: "self.get_tracker_state('${1:device_tracker.person}')",
    documentation: 'Get the state of a device_tracker entity.\nReturns: "home", "not_home", or zone name string',
    detail: 'Presence',
  },
];

// ── App Utility ───────────────────────────────────────────────────────────────
export const APP_UTILITY: CompletionDefinition[] = [
  {
    label: 'self.get_app',
    insertText: "self.get_app('${1:app_name}')",
    documentation: 'Get a reference to another running AppDaemon app by its name (as defined in apps.yaml).\nReturns: app object or None',
    detail: 'App Utility',
  },
  {
    label: 'self.get_ad_version',
    insertText: "self.get_ad_version()",
    documentation: 'Get the current AppDaemon version string.\nReturns: version string e.g. "4.4.2"',
    detail: 'App Utility',
  },
  {
    label: 'self.get_plugin_config',
    insertText: "self.get_plugin_config()",
    documentation: 'Get the plugin (HASS/MQTT) configuration dict for this app\'s namespace.\nReturns: dict',
    detail: 'App Utility',
  },
  {
    label: 'self.friendly_name',
    insertText: "self.friendly_name('${1:entity_id}')",
    documentation: 'Get the friendly_name attribute of an entity.\nReturns: friendly name string, or entity_id if none set',
    detail: 'App Utility',
  },
  {
    label: 'self.split_entity',
    insertText: "self.split_entity('${1:entity_id}')",
    documentation: 'Split an entity_id into (domain, entity_name) tuple.\nExample: "light.kitchen" → ("light", "kitchen")\nReturns: tuple (domain, object_id)',
    detail: 'App Utility',
  },
  {
    label: 'self.split_device_list',
    insertText: "self.split_device_list('${1:entity1,entity2}')",
    documentation: 'Split a comma-separated entity list string into a Python list.\nReturns: list of entity_id strings',
    detail: 'App Utility',
  },
  {
    label: 'self.entity_id',
    insertText: "self.entity_id('${1:domain}', '${2:name}')",
    documentation: 'Construct an entity_id from domain and name.\nReturns: "domain.name" string',
    detail: 'App Utility',
  },
];

// ── Namespaces & Global Data ───────────────────────────────────────────────────
export const NAMESPACES: CompletionDefinition[] = [
  {
    label: 'self.set_state (namespace)',
    insertText: "self.set_state('${1:entity_id}', state='${2:value}', namespace='${3:default}')",
    documentation: 'Set state in a specific namespace (use "global" for cross-app shared state).\nNamespace "global" is shared between all apps.',
    detail: 'Namespaces',
  },
  {
    label: 'self.get_state (namespace)',
    insertText: "self.get_state('${1:entity_id}', namespace='${2:global}')",
    documentation: 'Get state from a specific namespace.\nUse namespace="global" for cross-app shared data.',
    detail: 'Namespaces',
  },
  {
    label: 'self.listen_state (namespace)',
    insertText: "self.listen_state(self.${1:callback}, '${2:entity_id}', namespace='${3:global}')",
    documentation: 'Listen for state changes in a specific namespace.',
    detail: 'Namespaces',
  },
  {
    label: 'self.save_namespace',
    insertText: "self.save_namespace()",
    documentation: 'Persist the current namespace\'s state to disk (requires namespace to have a writeback file configured).\nReturns: None',
    detail: 'Namespaces',
  },
  {
    label: 'self.list_namespaces',
    insertText: "self.list_namespaces()",
    documentation: 'Get a list of all registered AppDaemon namespaces.\nReturns: list of namespace name strings',
    detail: 'Namespaces',
  },
  {
    label: 'self.set_namespace',
    insertText: "self.set_namespace('${1:default}')",
    documentation: 'Change the default namespace for this app instance for subsequent API calls.\nCommon values: "default", "global", "admin"',
    detail: 'Namespaces',
  },
  {
    label: 'self.get_namespace',
    insertText: "self.get_namespace()",
    documentation: 'Get the current default namespace for this app.\nReturns: namespace string',
    detail: 'Namespaces',
  },
];

// ── MQTT ──────────────────────────────────────────────────────────────────────
export const MQTT: CompletionDefinition[] = [
  {
    label: 'self.mqtt_publish',
    insertText: "self.mqtt_publish('${1:topic}', '${2:payload}'${3:, qos=0, retain=False})",
    documentation: 'Publish a message to an MQTT topic.\nArgs: topic, payload\nOptional: qos=0, retain=False, namespace="mqtt"\nReturns: None\nRequires MQTT plugin configured in appdaemon.yaml',
    detail: 'MQTT',
  },
  {
    label: 'self.mqtt_subscribe',
    insertText: "self.mqtt_subscribe('${1:topic}'${2:, namespace='mqtt'})",
    documentation: 'Subscribe to an MQTT topic (triggers "MQTT_MESSAGE" events).\nArgs: topic\nOptional: namespace="mqtt"\nUse with listen_event("MQTT_MESSAGE") to receive messages.',
    detail: 'MQTT',
  },
  {
    label: 'self.mqtt_unsubscribe',
    insertText: "self.mqtt_unsubscribe('${1:topic}'${2:, namespace='mqtt'})",
    documentation: 'Unsubscribe from an MQTT topic.\nReturns: None',
    detail: 'MQTT',
  },
];

// ── Devices & Areas ───────────────────────────────────────────────────────────
export const DEVICES_AREAS: CompletionDefinition[] = [
  {
    label: 'self.device_entities',
    insertText: "self.device_entities('${1:device_id}')",
    documentation: 'Get all entity IDs belonging to a device.\nReturns: list of entity_id strings',
    detail: 'Devices',
  },
  {
    label: 'self.device_attr',
    insertText: "self.device_attr('${1:entity_or_device_id}', '${2:attr}')",
    documentation: 'Get an attribute of a device.\nCommon attrs: "manufacturer", "model", "sw_version", "name"\nReturns: attribute value or None',
    detail: 'Devices',
  },
  {
    label: 'self.is_device_attr',
    insertText: "self.is_device_attr('${1:entity_or_device_id}', '${2:attr}', '${3:value}')",
    documentation: 'Check if a device attribute matches a given value.\nReturns: True/False',
    detail: 'Devices',
  },
  {
    label: 'self.device_id',
    insertText: "self.device_id('${1:entity_id}')",
    documentation: 'Get the device ID for an entity.\nReturns: device ID string or None',
    detail: 'Devices',
  },
  {
    label: 'self.areas',
    insertText: "self.areas()",
    documentation: 'Get a list of all area IDs in Home Assistant.\nReturns: list of area_id strings',
    detail: 'Areas',
  },
  {
    label: 'self.area_id',
    insertText: "self.area_id('${1:entity_or_device_id}')",
    documentation: 'Get the area ID that an entity or device belongs to.\nReturns: area_id string or None',
    detail: 'Areas',
  },
  {
    label: 'self.area_name',
    insertText: "self.area_name('${1:area_id}')",
    documentation: 'Get the human-readable name of an area from its ID.\nReturns: area name string or None',
    detail: 'Areas',
  },
  {
    label: 'self.area_entities',
    insertText: "self.area_entities('${1:area_id}')",
    documentation: 'Get all entity IDs in an area.\nReturns: list of entity_id strings',
    detail: 'Areas',
  },
  {
    label: 'self.area_devices',
    insertText: "self.area_devices('${1:area_id}')",
    documentation: 'Get all device IDs in an area.\nReturns: list of device_id strings',
    detail: 'Areas',
  },
  {
    label: 'self.integration_entities',
    insertText: "self.integration_entities('${1:integration_name}')",
    documentation: 'Get all entity IDs provided by a specific integration.\nExample: self.integration_entities("hue")\nReturns: list of entity_id strings',
    detail: 'Devices',
  },
];

// ── Input Helpers ─────────────────────────────────────────────────────────────
export const INPUT_HELPERS: CompletionDefinition[] = [
  {
    label: 'self.set_value',
    insertText: "self.set_value('${1:input_number.entity}', ${2:value})",
    documentation: 'Set the value of an input_number entity.\nArgs: entity_id, value (int or float)\nReturns: None',
    detail: 'Input Helpers',
  },
  {
    label: 'self.set_textvalue',
    insertText: "self.set_textvalue('${1:input_text.entity}', '${2:value}')",
    documentation: 'Set the text value of an input_text entity.\nArgs: entity_id, value (str)\nReturns: None',
    detail: 'Input Helpers',
  },
  {
    label: 'self.select_option',
    insertText: "self.select_option('${1:input_select.entity}', '${2:option}')",
    documentation: 'Select an option in an input_select entity.\nArgs: entity_id, option (must match one of the configured options)\nReturns: None',
    detail: 'Input Helpers',
  },
  {
    label: 'self.select_next',
    insertText: "self.select_next('${1:input_select.entity}')",
    documentation: 'Select the next option in an input_select entity (wraps around).\nReturns: None',
    detail: 'Input Helpers',
  },
  {
    label: 'self.select_previous',
    insertText: "self.select_previous('${1:input_select.entity}')",
    documentation: 'Select the previous option in an input_select entity (wraps around).\nReturns: None',
    detail: 'Input Helpers',
  },
];

// ── Templates ─────────────────────────────────────────────────────────────────
export const TEMPLATES: CompletionDefinition[] = [
  {
    label: 'self.render_template',
    insertText: "self.render_template('${1:{{ states(\"sensor.temperature\") }}'}')",
    documentation: 'Render a Jinja2 Home Assistant template string.\nArgs: template string\nReturns: rendered string result',
    detail: 'Templates',
  },
];

// ── Calendar ──────────────────────────────────────────────────────────────────
export const CALENDAR: CompletionDefinition[] = [
  {
    label: 'self.get_calendar_events',
    insertText: "self.get_calendar_events('${1:calendar.entity}'${2:, days=7})",
    documentation: 'Get upcoming calendar events from a calendar entity.\nOptional: start_date_time, end_date_time, days=1\nReturns: list of event dicts with start, end, summary, description',
    detail: 'Calendar',
  },
];

// ── Constraints ───────────────────────────────────────────────────────────────
export const CONSTRAINTS: CompletionDefinition[] = [
  {
    label: 'self.constrain_presence',
    insertText: "self.constrain_presence('${1|home,away,everyone_home,anyone_home,noone_home|}')",
    documentation: 'Constraint: only fire callback when presence matches.\nUse as keyword arg in listen_state/listen_event.\nValues: "home", "away", "everyone_home", "anyone_home", "noone_home"',
    detail: 'Constraints',
  },
  {
    label: 'self.constrain_input_boolean',
    insertText: "self.constrain_input_boolean('${1:input_boolean.entity}')",
    documentation: 'Constraint: only fire callback when input_boolean is "on".\nUse as keyword arg in listen_state/listen_event.',
    detail: 'Constraints',
  },
  {
    label: 'self.constrain_input_select',
    insertText: "self.constrain_input_select('${1:input_select.entity}', '${2:option}')",
    documentation: 'Constraint: only fire callback when input_select matches the given option.\nUse as keyword arg in listen_state/listen_event.',
    detail: 'Constraints',
  },
  {
    label: 'self.constrain_days',
    insertText: "self.constrain_days('${1:mon,tue,wed,thu,fri}')",
    documentation: 'Constraint: only fire callback on specific days of the week.\nValues: comma-separated from mon,tue,wed,thu,fri,sat,sun',
    detail: 'Constraints',
  },
];

// ── Async / Tasks ─────────────────────────────────────────────────────────────
export const ASYNC: CompletionDefinition[] = [
  {
    label: 'self.create_task',
    insertText: "self.create_task(${1:coroutine})",
    documentation: 'Schedule an async coroutine as an AppDaemon task.\nUse inside async def methods.\nReturns: asyncio.Task',
    detail: 'Async',
  },
  {
    label: 'self.run_coroutine',
    insertText: "self.run_coroutine(${1:coroutine})",
    documentation: 'Run an async coroutine from a synchronous context.\nReturns: coroutine result',
    detail: 'Async',
  },
];

// ── Combine all ───────────────────────────────────────────────────────────────
export const APPDAEMON_METHODS: CompletionDefinition[] = [
  ...ENTITY_CONTROL,
  ...EVENTS,
  ...SERVICES,
  ...SCHEDULING,
  ...TIME_SUN,
  ...LOGGING,
  ...HISTORY,
  ...NOTIFICATIONS,
  ...PRESENCE,
  ...APP_UTILITY,
  ...NAMESPACES,
  ...MQTT,
  ...DEVICES_AREAS,
  ...INPUT_HELPERS,
  ...TEMPLATES,
  ...CALENDAR,
  ...CONSTRAINTS,
  ...ASYNC,
];

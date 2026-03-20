export interface SignatureDefinition {
  label: string;
  documentation: string;
  parameters: Array<{
    label: string;
    documentation: string;
  }>;
}

export const APPDAEMON_SIGNATURES: Record<string, SignatureDefinition> = {
  // Entity Control
  turn_on: {
    label: 'turn_on(entity_id: str, **kwargs) -> None',
    documentation: 'Turn on an entity. kwargs: brightness, color_name, rgb_color, etc.',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity to turn on (e.g., light.living_room)' },
      { label: '**kwargs', documentation: 'Optional: brightness=255, color_name="red", rgb_color=[255,0,0]' }
    ]
  },
  turn_off: {
    label: 'turn_off(entity_id: str) -> None',
    documentation: 'Turn off an entity',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity to turn off' }
    ]
  },
  toggle: {
    label: 'toggle(entity_id: str) -> None',
    documentation: 'Toggle an entity state',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity to toggle' }
    ]
  },
  get_state: {
    label: 'get_state(entity_id: str, attribute: str = None, default: Any = None, copy: bool = True) -> Any',
    documentation: 'Get current state or attribute of an entity',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity ID to query' },
      { label: 'attribute: str = None', documentation: 'Attribute to get (default: state)' },
      { label: 'default: Any = None', documentation: 'Default value if not found' },
      { label: 'copy: bool = True', documentation: 'Return a copy of the state dict' }
    ]
  },
  set_state: {
    label: 'set_state(entity_id: str, state: str, attributes: dict = {}) -> dict',
    documentation: 'Set entity state (does not control devices, just changes HA state)',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity ID to set' },
      { label: 'state: str', documentation: 'New state value' },
      { label: 'attributes: dict = {}', documentation: 'Optional attributes to set' }
    ]
  },
  listen_state: {
    label: 'listen_state(callback: Callable, entity_id: str, attribute: str = None, new: str = None, old: str = None, duration: int = 0, immediate: bool = False) -> str',
    documentation: 'Listen for entity state changes. Returns handle for canceling.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, entity, attribute, old, new, kwargs)' },
      { label: 'entity_id: str', documentation: 'Entity to listen to (or "all" for any)' },
      { label: 'attribute: str = None', documentation: 'Attribute to watch (default: state)' },
      { label: 'new: str = None', documentation: 'Filter by new state value' },
      { label: 'old: str = None', documentation: 'Filter by old state value' },
      { label: 'duration: int = 0', documentation: 'Minimum duration in seconds before triggering' },
      { label: 'immediate: bool = False', documentation: 'Call callback immediately on registration' }
    ]
  },
  entity_exists: {
    label: 'entity_exists(entity_id: str) -> bool',
    documentation: 'Check if entity exists in AppDaemon cache',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity ID to check' }
    ]
  },
  check_for_entity: {
    label: 'check_for_entity(entity_id: str) -> bool',
    documentation: 'Check if entity exists using REST API (more reliable but slower)',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity ID to check' }
    ]
  },

  // Services
  call_service: {
    label: 'call_service(service: str, **kwargs) -> dict',
    documentation: 'Call any Home Assistant service/action. Returns result dict with success status.',
    parameters: [
      { label: 'service: str', documentation: 'Service to call (e.g., "light/turn_on", "notify/notify")' },
      { label: '**kwargs', documentation: 'Service data (e.g., entity_id="light.kitchen", brightness=255)' }
    ]
  },
  get_service_info: {
    label: 'get_service_info(service: str) -> dict',
    documentation: 'Get detailed information about a service including fields and descriptions',
    parameters: [
      { label: 'service: str', documentation: 'Service name (e.g., "light/turn_on")' }
    ]
  },
  run_script: {
    label: 'run_script(script_name: str, **kwargs) -> None',
    documentation: 'Run a Home Assistant script',
    parameters: [
      { label: 'script_name: str', documentation: 'Script entity ID (e.g., script.morning_routine)' },
      { label: '**kwargs', documentation: 'Variables to pass to script' }
    ]
  },

  // History
  get_history: {
    label: 'get_history(entity_id: str = None, days: int = 1, start_time: datetime = None, end_time: datetime = None) -> list',
    documentation: 'Get entity history from Home Assistant database',
    parameters: [
      { label: 'entity_id: str = None', documentation: 'Entity ID (if None, gets all entities)' },
      { label: 'days: int = 1', documentation: 'Number of days to look back' },
      { label: 'start_time: datetime = None', documentation: 'Start time for history' },
      { label: 'end_time: datetime = None', documentation: 'End time for history' }
    ]
  },
  get_logbook: {
    label: 'get_logbook(days: int = 1, entity: str = None) -> list',
    documentation: 'Get logbook entries from Home Assistant',
    parameters: [
      { label: 'days: int = 1', documentation: 'Number of days to look back' },
      { label: 'entity: str = None', documentation: 'Filter by entity ID' }
    ]
  },
  log: {
    label: 'log(message: str, level: str = "INFO") -> None',
    documentation: 'Log a message to AppDaemon log',
    parameters: [
      { label: 'message: str', documentation: 'Message to log' },
      { label: 'level: str = "INFO"', documentation: 'Log level: INFO, WARNING, ERROR, DEBUG' }
    ]
  },

  // Notifications
  notify: {
    label: 'notify(message: str, title: str = None, name: str = None) -> None',
    documentation: 'Send a notification using default notify service',
    parameters: [
      { label: 'message: str', documentation: 'Notification message' },
      { label: 'title: str = None', documentation: 'Notification title' },
      { label: 'name: str = None', documentation: 'Notification service name (e.g., "mobile_app_phone")' }
    ]
  },
  notify_android: {
    label: 'notify_android(message: str, title: str = None, **kwargs) -> None',
    documentation: 'Send notification to Android device with extra options',
    parameters: [
      { label: 'message: str', documentation: 'Notification message' },
      { label: 'title: str = None', documentation: 'Notification title' },
      { label: '**kwargs', documentation: 'Android-specific options: tts, vibration, led, etc.' }
    ]
  },
  notify_ios: {
    label: 'notify_ios(message: str, title: str = None, **kwargs) -> None',
    documentation: 'Send notification to iOS device with extra options',
    parameters: [
      { label: 'message: str', documentation: 'Notification message' },
      { label: 'title: str = None', documentation: 'Notification title' },
      { label: '**kwargs', documentation: 'iOS-specific options: push, sound, badge, etc.' }
    ]
  },

  // Presence
  anyone_home: {
    label: 'anyone_home(person: bool = True) -> bool',
    documentation: 'Check if anyone is home',
    parameters: [
      { label: 'person: bool = True', documentation: 'Use person entities (True) or device_tracker (False)' }
    ]
  },
  everyone_home: {
    label: 'everyone_home(person: bool = True) -> bool',
    documentation: 'Check if everyone is home',
    parameters: [
      { label: 'person: bool = True', documentation: 'Use person entities (True) or device_tracker (False)' }
    ]
  },
  noone_home: {
    label: 'noone_home(person: bool = True) -> bool',
    documentation: 'Check if no one is home',
    parameters: [
      { label: 'person: bool = True', documentation: 'Use person entities (True) or device_tracker (False)' }
    ]
  },
  get_trackers: {
    label: 'get_trackers(person: bool = True) -> list',
    documentation: 'Get list of all device trackers or persons',
    parameters: [
      { label: 'person: bool = True', documentation: 'Use person entities (True) or device_tracker (False)' }
    ]
  },
  get_tracker_state: {
    label: 'get_tracker_state(entity_id: str, attribute: str = None, default: Any = None) -> str',
    documentation: 'Get state of a device tracker (home/not_home/zone name)',
    parameters: [
      { label: 'entity_id: str', documentation: 'Device tracker or person entity ID' },
      { label: 'attribute: str = None', documentation: 'Attribute to get (default: state)' },
      { label: 'default: Any = None', documentation: 'Default value if not found' }
    ]
  },

  // Scheduling
  run_in: {
    label: 'run_in(callback: Callable, delay: int, **kwargs) -> str',
    documentation: 'Run callback after delay in seconds. Returns timer handle.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, kwargs)' },
      { label: 'delay: int', documentation: 'Delay in seconds' },
      { label: '**kwargs', documentation: 'Data to pass to callback' }
    ]
  },
  run_at: {
    label: 'run_at(callback: Callable, start: datetime, **kwargs) -> str',
    documentation: 'Run at specific datetime. Returns timer handle.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, kwargs)' },
      { label: 'start: datetime', documentation: 'When to run (datetime object)' },
      { label: '**kwargs', documentation: 'Data to pass to callback' }
    ]
  },
  run_once: {
    label: 'run_once(callback: Callable, start: time, **kwargs) -> str',
    documentation: 'Run once at specific time (next occurrence). Returns timer handle.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, kwargs)' },
      { label: 'start: time', documentation: 'When to run (time object)' },
      { label: '**kwargs', documentation: 'Data to pass to callback' }
    ]
  },
  run_daily: {
    label: 'run_daily(callback: Callable, start: time, **kwargs) -> str',
    documentation: 'Run daily at specific time. Returns timer handle.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, kwargs)' },
      { label: 'start: time', documentation: 'Daily run time (time object or "HH:MM:SS")' },
      { label: '**kwargs', documentation: 'Data to pass to callback' }
    ]
  },
  run_hourly: {
    label: 'run_hourly(callback: Callable, start: time, **kwargs) -> str',
    documentation: 'Run hourly at specific minute. Returns timer handle.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, kwargs)' },
      { label: 'start: time', documentation: 'Run time (time object, minutes and seconds matter)' },
      { label: '**kwargs', documentation: 'Data to pass to callback' }
    ]
  },
  run_minutely: {
    label: 'run_minutely(callback: Callable, start: time, **kwargs) -> str',
    documentation: 'Run every minute at specific second. Returns timer handle.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, kwargs)' },
      { label: 'start: time', documentation: 'Run time (time object, seconds matter)' },
      { label: '**kwargs', documentation: 'Data to pass to callback' }
    ]
  },
  run_every: {
    label: 'run_every(callback: Callable, start: datetime, repeat: int, **kwargs) -> str',
    documentation: 'Run every N seconds. Returns timer handle.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, kwargs)' },
      { label: 'start: datetime', documentation: 'Start time (datetime object)' },
      { label: 'repeat: int', documentation: 'Repeat interval in seconds' },
      { label: '**kwargs', documentation: 'Data to pass to callback' }
    ]
  },
  cancel_timer: {
    label: 'cancel_timer(handle: str) -> bool',
    documentation: 'Cancel a scheduled timer',
    parameters: [
      { label: 'handle: str', documentation: 'Timer handle returned from run_* method' }
    ]
  },

  // Time
  now_is_between: {
    label: 'now_is_between(start_time: str, end_time: str) -> bool',
    documentation: 'Check if current time is between two times',
    parameters: [
      { label: 'start_time: str', documentation: 'Start time (e.g., "07:00:00" or "sunrise")' },
      { label: 'end_time: str', documentation: 'End time (e.g., "22:00:00" or "sunset")' }
    ]
  },
  parse_time: {
    label: 'parse_time(time_string: str) -> time',
    documentation: 'Parse time string to time object',
    parameters: [
      { label: 'time_string: str', documentation: 'Time string (e.g., "07:00:00", "sunset+01:00:00")' }
    ]
  },
  parse_datetime: {
    label: 'parse_datetime(datetime_string: str) -> datetime',
    documentation: 'Parse datetime string to datetime object',
    parameters: [
      { label: 'datetime_string: str', documentation: 'Datetime string (e.g., "2024-01-01 07:00:00")' }
    ]
  },

  // Input Helpers
  set_value: {
    label: 'set_value(entity_id: str, value: float) -> None',
    documentation: 'Set value of an input_number entity',
    parameters: [
      { label: 'entity_id: str', documentation: 'Input number entity ID' },
      { label: 'value: float', documentation: 'Value to set' }
    ]
  },
  set_textvalue: {
    label: 'set_textvalue(entity_id: str, value: str) -> None',
    documentation: 'Set value of an input_text entity',
    parameters: [
      { label: 'entity_id: str', documentation: 'Input text entity ID' },
      { label: 'value: str', documentation: 'Text value to set' }
    ]
  },
  select_option: {
    label: 'select_option(entity_id: str, option: str) -> None',
    documentation: 'Select option in input_select entity',
    parameters: [
      { label: 'entity_id: str', documentation: 'Input select entity ID' },
      { label: 'option: str', documentation: 'Option to select' }
    ]
  },

  // Devices & Areas
  device_entities: {
    label: 'device_entities(device_id: str) -> list',
    documentation: 'Get list of entities for a device',
    parameters: [
      { label: 'device_id: str', documentation: 'Device ID' }
    ]
  },
  device_attr: {
    label: 'device_attr(device_id: str, attribute: str) -> Any',
    documentation: 'Get device attribute value',
    parameters: [
      { label: 'device_id: str', documentation: 'Device ID' },
      { label: 'attribute: str', documentation: 'Attribute name' }
    ]
  },
  device_id: {
    label: 'device_id(entity_id: str) -> str',
    documentation: 'Get device ID for an entity',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity ID' }
    ]
  },
  areas: {
    label: 'areas() -> list',
    documentation: 'Get list of all areas',
    parameters: []
  },
  area_id: {
    label: 'area_id(entity_id: str) -> str',
    documentation: 'Get area ID for an entity or device',
    parameters: [
      { label: 'entity_id: str', documentation: 'Entity or device ID' }
    ]
  },
  area_entities: {
    label: 'area_entities(area_id: str) -> list',
    documentation: 'Get list of entities in an area',
    parameters: [
      { label: 'area_id: str', documentation: 'Area ID' }
    ]
  },
  area_devices: {
    label: 'area_devices(area_id: str) -> list',
    documentation: 'Get list of devices in an area',
    parameters: [
      { label: 'area_id: str', documentation: 'Area ID' }
    ]
  },

  // Calendar & Events
  get_calendar_events: {
    label: 'get_calendar_events(entity_id: str, start_date_time: str = None, end_date_time: str = None, days: int = None) -> list',
    documentation: 'Get calendar events',
    parameters: [
      { label: 'entity_id: str', documentation: 'Calendar entity ID' },
      { label: 'start_date_time: str = None', documentation: 'Start datetime (ISO format)' },
      { label: 'end_date_time: str = None', documentation: 'End datetime (ISO format)' },
      { label: 'days: int = None', documentation: 'Number of days to look ahead' }
    ]
  },
  listen_event: {
    label: 'listen_event(callback: Callable, event_type: str = None, **kwargs) -> str',
    documentation: 'Listen for Home Assistant events. Returns handle.',
    parameters: [
      { label: 'callback: Callable', documentation: 'Callback function(self, event, data, kwargs)' },
      { label: 'event_type: str = None', documentation: 'Event type to filter (None = all events)' },
      { label: '**kwargs', documentation: 'Filter by event data' }
    ]
  },
  fire_event: {
    label: 'fire_event(event_type: str, **kwargs) -> None',
    documentation: 'Fire a custom event',
    parameters: [
      { label: 'event_type: str', documentation: 'Event type name' },
      { label: '**kwargs', documentation: 'Event data' }
    ]
  },

  // Templates
  render_template: {
    label: 'render_template(template: str) -> str',
    documentation: 'Render a Home Assistant Jinja2 template',
    parameters: [
      { label: 'template: str', documentation: 'Jinja2 template string (e.g., "{{ states.sensor.temp.state }}")' }
    ]
  },
};

import type { Page } from '@playwright/test'

const MOTION_LIGHTS_V2 = `import appdaemon.plugins.hass.hassapi as hass


class MotionLights(hass.Hass):
    """Turns on lights when motion is detected. Adds brightness + delay."""

    DELAY_SECONDS = 120

    def initialize(self):
        self.listen_state(self.on_motion, "binary_sensor.motion_hall")
        self.listen_state(self.on_motion, "binary_sensor.motion_kitchen")

    def on_motion(self, entity, attribute, old, new, kwargs):
        if new == "on":
            self.turn_on("light.hallway", brightness=200)
            self.turn_on("light.kitchen", brightness=180)
            self.log(f"Motion detected on {entity} — lights on")
            self.run_in(self.turn_off_lights, self.DELAY_SECONDS)

    def turn_off_lights(self, kwargs):
        self.turn_off("light.hallway")
        self.turn_off("light.kitchen")
        self.log("No motion — lights off")
`

const MOTION_LIGHTS_V1 = `import appdaemon.plugins.hass.hassapi as hass


class MotionLights(hass.Hass):
    """Turns on lights when motion is detected."""

    def initialize(self):
        self.listen_state(self.on_motion, "binary_sensor.motion_hall")

    def on_motion(self, entity, attribute, old, new, kwargs):
        if new == "on":
            self.turn_on("light.hallway")
            self.log("Motion detected — lights on")
        else:
            self.turn_off("light.hallway")
`

const PRESENCE_TRACKER_PY = `import appdaemon.plugins.hass.hassapi as hass


class PresenceTracker(hass.Hass):
    """Tracks who is home."""

    def initialize(self):
        self.listen_state(self.on_presence_change, "person")

    def on_presence_change(self, entity, attribute, old, new, kwargs):
        self.log(f"{entity} changed from {old} to {new}")
`

const APPS_YAML = `motion_lights:
  module: motion_lights
  class: MotionLights
  binary_sensor: binary_sensor.motion_hall
  light: light.hallway

presence_tracker:
  module: presence_tracker
  class: PresenceTracker
`

const APPS = [
  {
    name: 'motion_lights',
    module: 'motion_lights',
    class_name: 'MotionLights',
    description: 'Turns on lights when motion is detected. Adds brightness + delay.',
    has_python: true,
    has_yaml: true,
    last_modified: '2026-03-23T09:32:11.000Z',
    version_count: 2,
    icon: 'mdi:motion-sensor',
    disabled: false,
  },
  {
    name: 'presence_tracker',
    module: 'presence_tracker',
    class_name: 'PresenceTracker',
    description: 'Tracks who is home.',
    has_python: true,
    has_yaml: true,
    last_modified: '2026-03-23T09:30:00.000Z',
    version_count: 0,
    icon: 'mdi:account-check',
    disabled: false,
  },
]

const VERSIONS = [
  {
    version: '20260323_093211',
    timestamp: '2026-03-23T09:32:11.000Z',
    size: 312,
    filename: '20260323_093211.py',
  },
  {
    version: '20260323_093000',
    timestamp: '2026-03-23T09:30:00.000Z',
    size: 198,
    filename: '20260323_093000.py',
  },
]

function json(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

export async function setupMocks(page: Page) {
  // Health
  await page.route('**/api/health', route =>
    route.fulfill(json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.3.62',
      ha_configured: false,
      lsp_ready: false,
      ad_api_configured: true,
      package_sync: null,
      apps_dir: '/config/apps',
    }))
  )

  // App runtime status
  await page.route('**/api/apps/*/status', route =>
    route.fulfill(json({ available: true, state: 'running' }))
  )

  // Apps list / create
  await page.route('**/api/apps', route => {
    if (route.request().method() !== 'GET') {
      return route.fulfill(json({
        name: 'new_app', module: 'new_app', class_name: 'NewApp', description: '',
        has_python: true, has_yaml: false,
        last_modified: new Date().toISOString(),
        version_count: 0, icon: null, disabled: false,
      }))
    }
    return route.fulfill(json({ apps: APPS, count: APPS.length }))
  })

  // Versions — specific version content must be registered before the list route
  await page.route('**/api/versions/motion_lights/*', route =>
    route.fulfill(json({ content: MOTION_LIGHTS_V1, last_modified: '2026-03-23T09:30:00.000Z' }))
  )
  await page.route('**/api/versions/motion_lights', route => {
    if (route.request().method() !== 'GET') {
      return route.fulfill(json({ success: true, message: 'Version restored' }))
    }
    return route.fulfill(json({ versions: VERSIONS, count: VERSIONS.length }))
  })
  await page.route('**/api/versions/presence_tracker', route =>
    route.fulfill(json({ versions: [], count: 0 }))
  )

  // Files — YAML
  await page.route('**/api/files/*/yaml', route => {
    if (route.request().method() === 'PUT') {
      return route.fulfill(json({ success: true, created_files: [] }))
    }
    return route.fulfill(json({ content: APPS_YAML, last_modified: '2026-03-23T09:30:00.000Z' }))
  })
  await page.route('**/api/files/*/yml', route =>
    route.fulfill(json({ content: APPS_YAML, last_modified: '2026-03-23T09:30:00.000Z' }))
  )

  // Yaml validate
  await page.route('**/api/yaml/validate', route =>
    route.fulfill(json({ issues: [] }))
  )

  // Files — Python (frontend always calls /python subpath)
  await page.route('**/api/files/motion_lights/python', route =>
    route.fulfill(json({ content: MOTION_LIGHTS_V2, last_modified: '2026-03-23T09:32:11.000Z' }))
  )
  await page.route('**/api/files/presence_tracker/python', route =>
    route.fulfill(json({ content: PRESENCE_TRACKER_PY, last_modified: '2026-03-23T09:30:00.000Z' }))
  )

  // Files — bare app route (DELETE and fallback GET)
  await page.route('**/api/files/motion_lights', route =>
    route.fulfill(json({ content: MOTION_LIGHTS_V2, last_modified: '2026-03-23T09:32:11.000Z' }))
  )
  await page.route('**/api/files/presence_tracker', route =>
    route.fulfill(json({ content: PRESENCE_TRACKER_PY, last_modified: '2026-03-23T09:30:00.000Z' }))
  )

  // Entities (HA not connected)
  await page.route('**/api/entities', route =>
    route.fulfill(json({
      entities: [],
      grouped: {},
      count: 0,
      domains: [],
      timestamp: new Date().toISOString(),
      available: false,
      error: 'HA not configured',
    }))
  )

  // Logs
  const LOGS = [
    { raw: '2026-03-21 10:26:58.036625 INFO AppDaemon: Starting apps', timestamp: '2026-03-21 10:26:58.036625', level: 'INFO', source: 'AppDaemon', message: 'Starting apps' },
    { raw: '2026-03-21 10:27:01.123456 INFO motion_lights: Motion detected on binary_sensor.motion_hall — lights on', timestamp: '2026-03-21 10:27:01.123456', level: 'INFO', source: 'motion_lights', message: 'Motion detected on binary_sensor.motion_hall — lights on' },
    { raw: '2026-03-21 10:29:01.234567 INFO motion_lights: No motion — lights off', timestamp: '2026-03-21 10:29:01.234567', level: 'INFO', source: 'motion_lights', message: 'No motion — lights off' },
    { raw: '2026-03-21 10:30:00.345678 WARNING motion_lights: Callback overdue by 120ms', timestamp: '2026-03-21 10:30:00.345678', level: 'WARNING', source: 'motion_lights', message: 'Callback overdue by 120ms' },
    { raw: '2026-03-21 10:31:00.456789 INFO presence_tracker: person.alice changed from home to away', timestamp: '2026-03-21 10:31:00.456789', level: 'INFO', source: 'presence_tracker', message: 'person.alice changed from home to away' },
  ]

  await page.route('**/api/appdaemon-logs', route =>
    route.fulfill(json({ logs: LOGS }))
  )

  const sseBody = `event: init\ndata: ${JSON.stringify(LOGS)}\n\n`
  await page.route('**/api/appdaemon-logs/stream', route =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream; charset=utf-8',
      body: sseBody,
    })
  )
}

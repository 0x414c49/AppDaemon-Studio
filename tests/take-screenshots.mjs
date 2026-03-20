/**
 * Docs screenshot script — no backend required.
 * Serves dist/ with a static file server and mocks all API calls.
 *
 * Generates the 5 screenshots used in docs/:
 *   01-app-list, 04-create-app-dialog, 05-settings-dialog,
 *   07-version-diff, 09-autocomplete
 *
 * Usage:  npm run build && node tests/take-screenshots.mjs
 */

import { chromium } from 'playwright';
import { createServer as createHttpServer } from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS = path.resolve(ROOT, 'docs/screenshots');
fs.mkdirSync(SCREENSHOTS, { recursive: true });

const shot = (name) => path.join(SCREENSHOTS, `${name}.png`);

// ── Mock data ─────────────────────────────────────────────────────────────────

const APPS = [
  { name: 'motion_lights',    class_name: 'MotionLights',    description: 'Turns on lights when motion is detected', icon: 'Zap' },
  { name: 'presence_tracker', class_name: 'PresenceTracker', description: 'Tracks who is home',                      icon: 'Home' },
];

const PYTHON_CODE = `import appdaemon.plugins.hass.hassapi as hass


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
`;

const YAML_CODE = `motion_lights:
  module: motion_lights
  class: MotionLights
`;

const VERSIONS = [
  { version: 'v2', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),     size: 512, filename: 'motion_lights.py.v2' },
  { version: 'v1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), size: 320, filename: 'motion_lights.py.v1' },
];

const V1_CODE = `import appdaemon.plugins.hass.hassapi as hass


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
`;

const ENTITIES = [
  { entity_id: 'binary_sensor.motion_hall',    state: 'off',  friendly_name: 'Motion Hall' },
  { entity_id: 'binary_sensor.motion_kitchen', state: 'on',   friendly_name: 'Motion Kitchen' },
  { entity_id: 'binary_sensor.presence_home',  state: 'on',   friendly_name: 'Presence Home' },
  { entity_id: 'light.hallway',                state: 'on',   friendly_name: 'Hallway Light' },
  { entity_id: 'light.kitchen',                state: 'off',  friendly_name: 'Kitchen Light' },
  { entity_id: 'sensor.temperature_living',    state: '21.5', friendly_name: 'Living Room Temp' },
  { entity_id: 'sensor.humidity_living',       state: '45',   friendly_name: 'Living Room Humidity' },
  { entity_id: 'switch.garden_lights',         state: 'off',  friendly_name: 'Garden Lights' },
  { entity_id: 'input_boolean.guest_mode',     state: 'off',  friendly_name: 'Guest Mode' },
  { entity_id: 'person.ali',                   state: 'home', friendly_name: 'Ali' },
];

// ── Setup mocks ───────────────────────────────────────────────────────────────

async function setupMocks(page) {
  await page.route('**/api/apps', (route) => {
    route.fulfill({ json: route.request().method() === 'GET' ? { apps: APPS } : { success: true } });
  });

  await page.route('**/api/files/**', (route) => {
    if (route.request().method() === 'GET') {
      const yaml = route.request().url().includes('/yaml');
      route.fulfill({ json: { content: yaml ? YAML_CODE : PYTHON_CODE } });
    } else {
      route.fulfill({ json: { success: true } });
    }
  });

  await page.route('**/api/versions/**', (route) => {
    const parts = route.request().url().split('/api/versions/')[1]?.split('/');
    route.fulfill({
      json: parts?.length >= 2 ? { content: V1_CODE } : { versions: VERSIONS },
    });
  });

  await page.route('**/api/appdaemon-logs', (route) => {
    route.fulfill({ json: { logs: [] } });
  });

  await page.route('**/api/entities', (route) => {
    const domains = [...new Set(ENTITIES.map(e => e.entity_id.split('.')[0]))];
    route.fulfill({
      json: { entities: ENTITIES, grouped: {}, count: ENTITIES.length, domains, timestamp: new Date().toISOString(), available: true },
    });
  });
}

async function waitForEditor(page) {
  await page.waitForSelector('.monaco-editor', { timeout: 15_000 });
  await page.waitForTimeout(1000);
}

// ── Static file server for dist/ ─────────────────────────────────────────────

function getMimeType(p) {
  if (p.endsWith('.html')) return 'text/html';
  if (p.endsWith('.js'))   return 'application/javascript';
  if (p.endsWith('.css'))  return 'text/css';
  if (p.endsWith('.woff2')) return 'font/woff2';
  if (p.endsWith('.woff')) return 'font/woff';
  if (p.endsWith('.png'))  return 'image/png';
  if (p.endsWith('.svg'))  return 'image/svg+xml';
  return 'application/octet-stream';
}

const distDir = path.join(ROOT, 'dist');
const server = createHttpServer(async (req, res) => {
  let urlPath = req.url.split('?')[0];
  if (!urlPath.startsWith('/assets/') && !urlPath.endsWith('.woff2') && !urlPath.endsWith('.woff')) {
    urlPath = '/index.html';
  }
  const filePath = path.join(distDir, urlPath);
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((resolve) => server.listen(4173, resolve));
console.log('Serving dist/ on http://localhost:4173');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

try {
  // ── 01. Loaded apps ───────────────────────────────────────────────────────────
  {
    const page = await context.newPage();
    await setupMocks(page);
    await page.goto('http://localhost:4173/');
    await page.waitForSelector('text=motion_lights', { timeout: 10_000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('01-app-list-v2') });
    console.log('✓ 01-app-list');
    await page.close();
  }

  // ── 04. Create app dialog ─────────────────────────────────────────────────────
  {
    const page = await context.newPage();
    await setupMocks(page);
    await page.goto('http://localhost:4173/');
    await page.waitForSelector('text=motion_lights');
    await page.locator('button[title="New App"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('04-create-app-dialog-v2') });
    console.log('✓ 04-create-app-dialog');
    await page.close();
  }

  // ── 05. Settings dialog ───────────────────────────────────────────────────────
  {
    const page = await context.newPage();
    await setupMocks(page);
    await page.goto('http://localhost:4173/');
    await page.waitForSelector('text=motion_lights');
    await page.locator('button[title="Settings"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('05-settings-dialog-v2') });
    console.log('✓ 05-settings-dialog');
    await page.close();
  }

  // ── 07. Version diff ──────────────────────────────────────────────────────────
  {
    const page = await context.newPage();
    await setupMocks(page);
    await page.goto('http://localhost:4173/');
    await page.waitForSelector('text=motion_lights');
    await page.locator('aside').getByText('motion_lights').click();
    await waitForEditor(page);
    await page.getByRole('button', { name: /compare/i }).click();
    await page.waitForSelector('text=Compare Versions', { timeout: 5_000 });

    const select = page.locator('select');
    await select.waitFor({ timeout: 5_000 });
    await page.waitForFunction(
      () => document.querySelector('select')?.options.length > 1,
      { timeout: 10_000 }
    );
    const options = await select.locator('option').all();
    const oldestValue = await options[options.length - 1].getAttribute('value');
    await select.selectOption(oldestValue);
    await page.waitForSelector('.monaco-diff-editor', { timeout: 30_000 });
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: shot('07-version-diff-v2') });
    console.log('✓ 07-version-diff');
    await page.close();
  }

  // ── 09. Autocomplete ──────────────────────────────────────────────────────────
  {
    const page = await context.newPage();
    await setupMocks(page);
    await page.goto('http://localhost:4173/');
    await page.waitForSelector('text=motion_lights');
    await page.locator('aside').getByText('motion_lights').click();
    await waitForEditor(page);

    const editorContent = page.locator('.monaco-editor .view-lines').first();
    await editorContent.click();
    await page.keyboard.press('Control+End');
    await page.waitForTimeout(300);
    await page.keyboard.type('\n        self.');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: shot('09-autocomplete-v2') });
    console.log('✓ 09-autocomplete');
    await page.close();
  }

  console.log('\nDocs screenshots saved to docs/screenshots/');
} finally {
  await browser.close();
  server.close();
}

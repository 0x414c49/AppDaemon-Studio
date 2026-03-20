import { test, expect, Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const SCREENSHOTS = path.resolve(__dirname, '../../docs/screenshots')
fs.mkdirSync(SCREENSHOTS, { recursive: true })

const shot = (name: string) => path.join(SCREENSHOTS, `${name}.png`)

// Wait for the Monaco editor iframe/container to appear and be non-empty
async function waitForEditor(page: Page) {
  await page.waitForSelector('.monaco-editor', { timeout: 15_000 })
  // Give Monaco a moment to render the text
  await page.waitForTimeout(800)
}

test.describe('AppDaemon Studio', () => {
  test.beforeAll(async ({ request }) => {
    // Seed a test app via API before running UI tests
    const existing = await request.get('http://localhost:3000/api/apps')
    const data = await existing.json()

    if (!data.apps.find((a: { name: string }) => a.name === 'motion_lights')) {
      await request.post('http://localhost:3000/api/apps', {
        data: {
          name: 'motion_lights',
          class_name: 'MotionLights',
          description: 'Turns on lights when motion is detected',
          icon: 'mdi:motion-sensor',
        },
      })
    }

    if (!data.apps.find((a: { name: string }) => a.name === 'presence_tracker')) {
      await request.post('http://localhost:3000/api/apps', {
        data: {
          name: 'presence_tracker',
          class_name: 'PresenceTracker',
          description: 'Tracks who is home',
          icon: 'mdi:account-check',
        },
      })
    }

    // PUT v1 → creates a version of the template, saves v1 as current
    await request.put('http://localhost:3000/api/files/motion_lights', {
      data: {
        content: `import appdaemon.plugins.hass.hassapi as hass


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
`,
      },
    })

    // PUT v2 → creates a version of v1, saves v2 as current (has clear diff vs v1)
    await request.put('http://localhost:3000/api/files/motion_lights', {
      data: {
        content: `import appdaemon.plugins.hass.hassapi as hass


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
`,
      },
    })
  })

  // ── 1. App list ─────────────────────────────────────────────────────────────
  test('shows app list in sidebar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('motion_lights')).toBeVisible()
    await expect(page.getByText('presence_tracker')).toBeVisible()
    await page.screenshot({ path: shot('01-app-list') })
  })

  // ── 2. Python editor ─────────────────────────────────────────────────────────
  test('loads python editor for selected app', async ({ page }) => {
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await waitForEditor(page)
    await expect(page.locator('.monaco-editor')).toBeVisible()
    await page.screenshot({ path: shot('02-python-editor') })
  })

  // ── 3. YAML editor ───────────────────────────────────────────────────────────
  test('switches to YAML tab', async ({ page }) => {
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await waitForEditor(page)
    // Click the YAML button inside the editor (plain button, not role=tab)
    await page.getByRole('button', { name: 'YAML' }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: shot('03-yaml-editor') })
  })

  // ── 4. Create app dialog ─────────────────────────────────────────────────────
  test('opens create app dialog', async ({ page }) => {
    await page.goto('/')
    // Click the + / new app button in the sidebar
    const newBtn = page.locator('button[title*="new" i], button[aria-label*="new" i], button[title*="create" i], button[aria-label*="create" i]').first()
    if (await newBtn.count() === 0) {
      // fallback: look for a + icon button in the sidebar
      await page.locator('aside button, [class*="sidebar"] button').last().click()
    } else {
      await newBtn.click()
    }
    // Wait for a dialog/modal
    await page.waitForSelector('[role="dialog"], [class*="dialog"], [class*="modal"]', { timeout: 5_000 })
      .catch(() => {})
    await page.screenshot({ path: shot('04-create-app-dialog') })
  })

  // ── 5. Settings dialog ───────────────────────────────────────────────────────
  test('opens settings dialog', async ({ page }) => {
    await page.goto('/')
    // Settings button — usually a gear/cog icon
    await page.locator('button[title*="setting" i], button[aria-label*="setting" i]').first().click()
    await page.waitForSelector('[role="dialog"], [class*="dialog"], [class*="modal"]', { timeout: 5_000 })
      .catch(() => {})
    await page.screenshot({ path: shot('05-settings-dialog') })
  })

  // ── 6. Logs tab ──────────────────────────────────────────────────────────────
  test('shows logs tab', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Logs' }).click()
    // Wait a moment for log fetch
    await page.waitForTimeout(2_000)
    await page.screenshot({ path: shot('06-logs-viewer') })
  })

  // ── 7. Version compare diff ──────────────────────────────────────────────────
  test('shows version diff in compare panel', async ({ page }) => {
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await waitForEditor(page)

    // Click the Compare button (top-right of editor)
    await page.getByRole('button', { name: /compare/i }).click()

    // Modal opens — wait for "Compare Versions" heading
    await page.waitForSelector('text=Compare Versions', { timeout: 5_000 })
    await page.screenshot({ path: shot('07a-compare-modal-empty') })

    // Pick the oldest version from the select dropdown
    const select = page.locator('select')
    await select.waitFor({ timeout: 5_000 })
    const options = await select.locator('option').all()
    // Last option = oldest version (list is newest-first)
    const oldestValue = await options[options.length - 1].getAttribute('value')
    await select.selectOption(oldestValue!)

    // Wait for Monaco DiffEditor to render
    await page.waitForSelector('.monaco-diff-editor', { timeout: 15_000 })
    await page.waitForTimeout(1_200)

    await page.screenshot({ path: shot('07-version-diff') })
  })

  // ── 8. Full app with multiple apps ──────────────────────────────────────────
  test('full app view with both apps listed', async ({ page }) => {
    await page.goto('/')
    await page.getByText('presence_tracker').click()
    await waitForEditor(page)
    await page.screenshot({ path: shot('08-full-app-view') })
  })

  // ── 9. Autocomplete: self. shows AppDaemon method suggestions ────────────────
  test('self. triggers AppDaemon method completions', async ({ page }) => {
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await waitForEditor(page)

    // Click in the editor and navigate to end of file
    await page.locator('.monaco-editor .view-lines').first().click()
    await page.keyboard.press('Control+End')
    await page.waitForTimeout(200)

    // Type "self." — should trigger method completions via trigger character
    await page.keyboard.type('\n        self.')
    await page.waitForTimeout(1_000)

    // The suggestion widget should appear with AppDaemon methods
    const suggestionWidget = page.locator('.editor-widget.suggest-widget')
    await expect(suggestionWidget).toBeVisible({ timeout: 5_000 })

    // Verify known AppDaemon methods are present
    await expect(suggestionWidget.getByText('turn_on', { exact: false })).toBeVisible()
    await expect(suggestionWidget.getByText('turn_off', { exact: false })).toBeVisible()
    await expect(suggestionWidget.getByText('listen_state', { exact: false })).toBeVisible()
  })

  // ── 10. Autocomplete: self.turn filters correctly ────────────────────────────
  test('typing after self. filters method list', async ({ page }) => {
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await waitForEditor(page)

    await page.locator('.monaco-editor .view-lines').first().click()
    await page.keyboard.press('Control+End')
    await page.waitForTimeout(200)

    // Type "self.turn" — should filter to turn_on / turn_off
    await page.keyboard.type('\n        self.turn')
    await page.waitForTimeout(1_000)

    const suggestionWidget = page.locator('.editor-widget.suggest-widget')
    await expect(suggestionWidget).toBeVisible({ timeout: 5_000 })
    await expect(suggestionWidget.getByText('turn_on', { exact: false })).toBeVisible()
    await expect(suggestionWidget.getByText('turn_off', { exact: false })).toBeVisible()
  })

  // ── 11. Autocomplete: entity IDs inside string arguments ─────────────────────
  test('entity IDs appear inside string arguments', async ({ page }) => {
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await waitForEditor(page)

    // Wait for entities to load (status bar shows count, not "unavailable")
    await expect(page.locator('text=/\\d+ entities/')).toBeVisible({ timeout: 10_000 })

    await page.locator('.monaco-editor .view-lines').first().click()
    await page.keyboard.press('Control+End')
    await page.waitForTimeout(200)

    // Type opening quote inside a turn_on call — entity completions should appear
    await page.keyboard.type('\n        self.turn_on("')
    await page.waitForTimeout(1_000)

    const suggestionWidget = page.locator('.editor-widget.suggest-widget')
    await expect(suggestionWidget).toBeVisible({ timeout: 5_000 })

    // At least one entity ID should be listed
    await expect(suggestionWidget.locator('.monaco-list-row').first()).toBeVisible()
  })
})

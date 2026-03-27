import { test, expect, Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { setupMocks } from './mocks'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS = path.resolve(__dirname, '../../../../docs/screenshots')
fs.mkdirSync(SCREENSHOTS, { recursive: true })

const shot = (name: string) => path.join(SCREENSHOTS, `${name}.png`)

// Wait for the Monaco editor iframe/container to appear and be non-empty
async function waitForEditor(page: Page) {
  await page.waitForSelector('.monaco-editor', { timeout: 15_000 })
  // Give Monaco a moment to render the text
  await page.waitForTimeout(800)
}

test.describe('AppDaemon Studio', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
  })

  // ── 1. App list ─────────────────────────────────────────────────────────────
  test('shows app list in sidebar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('motion_lights')).toBeVisible()
    await expect(page.getByText('presence_tracker')).toBeVisible()
    // Hover to reveal per-app controls (enable/disable toggle, restart button)
    await page.locator('aside').getByText('motion_lights').hover()
    await page.waitForTimeout(200)
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
    await page.locator('button[title="New App"]').click()
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
    await page.getByText('motion_lights').click()
    await page.getByRole('button', { name: 'Logs' }).click()
    // Wait for log entries to render (filtered to motion_lights by default)
    await expect(page.getByText('Motion detected on binary_sensor.motion_hall')).toBeVisible({ timeout: 5_000 })
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
    const lspReady = await page.evaluate(async () => {
      const r = await fetch('api/health').then(res => res.json()).catch(() => ({}))
      return r.lspReady === true
    })
    test.skip(!lspReady, 'LSP not available in this environment')

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

    // Verify the widget has items — check one method near the top alphabetically.
    await expect(suggestionWidget.getByText('call_service', { exact: false })).toBeVisible()
    // Confirm the list has more than a single entry
    await expect(suggestionWidget.locator('.monaco-list-row').nth(1)).toBeVisible()
  })

  // ── 10. Autocomplete: self.turn filters correctly ────────────────────────────
  test('typing after self. filters method list', async ({ page }) => {
    await page.goto('/')
    const lspReady = await page.evaluate(async () => {
      const r = await fetch('api/health').then(res => res.json()).catch(() => ({}))
      return r.lspReady === true
    })
    test.skip(!lspReady, 'LSP not available in this environment')

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

  // ── 12. Sidebar shows instance name when it differs from module ──────────────
  test('sidebar shows instance name when module name differs', async ({ page }) => {
    // Override apps mock with instance ≠ module scenario
    await page.route('**/api/apps', route => {
      if (route.request().method() !== 'GET') return route.continue()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          apps: [{
            name: 'vp_vardagsrum',
            module: 'pid_heatpump',
            class_name: 'PIDHeatPump',
            description: '',
            has_python: true,
            has_yaml: true,
            last_modified: new Date().toISOString(),
            version_count: 0,
            icon: null,
            disabled: false,
          }],
          count: 1,
        }),
      })
    })
    await page.route('**/api/files/pid_heatpump/python', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: 'class PIDHeatPump: pass\n', last_modified: new Date().toISOString() }),
      })
    )
    await page.goto('/')
    await expect(page.getByText('vp_vardagsrum')).toBeVisible()
    await expect(page.getByText('pid_heatpump')).not.toBeVisible()
  })

  // ── 13. Yaml save shows toast for auto-created file ──────────────────────────
  test('yaml save auto-creates file and shows toast', async ({ page }) => {
    // Override yaml PUT to return created_files
    await page.route('**/api/files/*/yaml', route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, created_files: ['new_module.py'] }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: 'motion_lights:\n  module: motion_lights\n  class: MotionLights\n', last_modified: new Date().toISOString() }),
      })
    })
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await page.getByRole('button', { name: 'YAML' }).click()
    await page.waitForTimeout(800)
    // Type a space in the editor to make content dirty
    await page.locator('.monaco-editor').first().click()
    await page.keyboard.press('End')
    await page.keyboard.press('Space')
    await page.waitForTimeout(200)
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(500)
    await expect(page.getByText('Created new_module.py')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: shot('13-yaml-save-created-toast') })
  })

  // ── 14. Yaml save with validation error shows error toast ────────────────────
  test('yaml save with validation error shows error toast', async ({ page }) => {
    await page.route('**/api/files/*/yaml', route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'YAML validation failed',
            issues: [{ app: 'my_app', message: "'my_app': module file 'old_module.py' not found — did you rename it?", severity: 'error', line: 1 }],
          }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: 'motion_lights:\n  module: motion_lights\n  class: MotionLights\n', last_modified: new Date().toISOString() }),
      })
    })
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await page.getByRole('button', { name: 'YAML' }).click()
    await page.waitForTimeout(800)
    // Type a space in the editor to make content dirty
    await page.locator('.monaco-editor').first().click()
    await page.keyboard.press('End')
    await page.keyboard.press('Space')
    await page.waitForTimeout(200)
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(500)
    await expect(page.getByText(/not found/)).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: shot('14-yaml-validation-error-toast') })
  })

  // ── 15. Log filter: default shows current app only ───────────────────────────
  test('log filter shows only current app by default', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Logs' }).click()
    await page.waitForTimeout(1000)
    // Button should show the active app name (first app selected by default)
    const filterBtn = page.locator('button', { hasText: 'motion_lights' })
    await expect(filterBtn).toBeVisible()
    await page.screenshot({ path: shot('15-log-filter-app') })
  })

  // ── 16. Log filter: toggle shows all ────────────────────────────────────────
  test('log filter toggle shows all apps', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Logs' }).click()
    await page.waitForTimeout(500)
    // Click the filter toggle
    const filterBtn = page.locator('button', { hasText: 'motion_lights' })
    await filterBtn.click()
    await expect(page.locator('button', { hasText: 'All apps' })).toBeVisible()
    await page.screenshot({ path: shot('16-log-filter-all') })
  })

  // ── 11. Autocomplete: entity IDs inside string arguments ─────────────────────
  test('entity IDs appear inside string arguments', async ({ page }) => {
    await page.goto('/')
    await page.getByText('motion_lights').click()
    await waitForEditor(page)

    // Wait for entities to load — skip if HA is not connected in test environment
    const entityStatus = page.locator('text=/\\d+ entities/')
    const hasEntities = await entityStatus.isVisible({ timeout: 10_000 }).catch(() => false)
    test.skip(!hasEntities, 'HA entities not available in this environment')

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

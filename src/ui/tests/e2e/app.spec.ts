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

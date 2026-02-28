import { test, expect } from '@playwright/test';
import { join } from 'path';

const SCREENSHOTS_DIR = join(__dirname, '../screenshots/docs');

/**
 * Documentation screenshots
 * These are used in README, docs, and marketing materials
 */

test.describe('Documentation Screenshots @docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
  });

  test('01 - studio overview', async ({ page }) => {
    // Main studio interface
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, '01-studio-overview.png'),
      fullPage: false,
    });
  });

  test('02 - sidebar with apps', async ({ page }) => {
    // Create a test app first
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'motion_lights');
    await page.fill('[data-testid="class-name-input"]', 'MotionLights');
    await page.click('[data-testid="create-app-submit"]');
    
    // Wait for app to appear
    await page.waitForSelector('[data-testid="app-motion_lights"]');
    
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, '02-sidebar-apps.png'),
      clip: { x: 0, y: 40, width: 280, height: 600 },
    });
  });

  test('03 - editor panel', async ({ page }) => {
    // Click on an app to open editor
    await page.click('[data-testid="app-motion_lights"]');
    await page.waitForSelector('[data-testid="editor-panel"]');
    
    // Wait for Monaco editor
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, '03-editor-panel.png'),
      clip: { x: 280, y: 75, width: 1000, height: 565 },
    });
  });

  test('04 - version control panel', async ({ page }) => {
    // Open version panel
    await page.click('[data-testid="versions-tab"]');
    await page.waitForSelector('[data-testid="version-panel"]');
    
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, '04-version-control.png'),
      clip: { x: 280, y: 400, width: 1000, height: 240 },
    });
  });

  test('05 - log viewer', async ({ page }) => {
    // Open logs panel
    await page.click('[data-testid="logs-tab"]');
    await page.waitForSelector('[data-testid="log-viewer"]');
    
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, '05-log-viewer.png'),
      clip: { x: 280, y: 400, width: 1000, height: 240 },
    });
  });

  test('06 - create app modal', async ({ page }) => {
    // Open create modal
    await page.click('[data-testid="create-app-button"]');
    await page.waitForSelector('[data-testid="create-app-modal"]');
    
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, '06-create-app-modal.png'),
    });
  });

  test('07 - dark theme', async ({ page }) => {
    // Screenshot showing dark theme
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, '07-dark-theme.png'),
      fullPage: false,
    });
  });
});

/**
 * CI Regression Screenshots
 * These are used for visual regression testing
 */

test.describe('CI Regression Screenshots @ci', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
  });

  test('ci - full page layout @ci', async ({ page, browserName }) => {
    await page.screenshot({
      path: join(__dirname, `../screenshots/ci/${browserName}/full-page.png`),
      fullPage: true,
    });
  });

  test('ci - sidebar @ci', async ({ page, browserName }) => {
    await page.screenshot({
      path: join(__dirname, `../screenshots/ci/${browserName}/sidebar.png`),
      clip: { x: 0, y: 0, width: 280, height: 800 },
    });
  });

  test('ci - editor area @ci', async ({ page, browserName }) => {
    // Create and open an app
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'test_app');
    await page.fill('[data-testid="class-name-input"]', 'TestApp');
    await page.click('[data-testid="create-app-submit"]');
    await page.waitForSelector('[data-testid="app-test_app"]');
    await page.click('[data-testid="app-test_app"]');
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: join(__dirname, `../screenshots/ci/${browserName}/editor.png`),
      clip: { x: 280, y: 0, width: 1040, height: 800 },
    });
  });
});

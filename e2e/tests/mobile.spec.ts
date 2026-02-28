import { test, expect, devices } from '@playwright/test';
import { join } from 'path';

/**
 * Mobile-specific tests and screenshots
 */

const MOBILE_SCREENSHOTS_DIR = join(__dirname, '../screenshots/mobile');

test.describe('Mobile Screenshots @screenshot', () => {
  test.use({
    ...devices['iPhone 13'],
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="menu-button"]', { timeout: 10000 });
  });

  test('mobile - overview', async ({ page }) => {
    await page.screenshot({
      path: join(MOBILE_SCREENSHOTS_DIR, '01-mobile-overview.png'),
    });
  });

  test('mobile - sidebar drawer', async ({ page }) => {
    // Open sidebar
    await page.click('[data-testid="menu-button"]');
    await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible' });
    
    await page.screenshot({
      path: join(MOBILE_SCREENSHOTS_DIR, '02-mobile-sidebar.png'),
    });
  });

  test('mobile - editor', async ({ page }) => {
    // Create and open app
    await page.click('[data-testid="menu-button"]');
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'mobile_test');
    await page.fill('[data-testid="class-name-input"]', 'MobileTest');
    await page.click('[data-testid="create-app-submit"]');
    await page.click('[data-testid="app-mobile_test"]');
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: join(MOBILE_SCREENSHOTS_DIR, '03-mobile-editor.png'),
    });
  });

  test('mobile - bottom panel', async ({ page }) => {
    // Create app first
    await page.click('[data-testid="menu-button"]');
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'mobile_logs');
    await page.fill('[data-testid="class-name-input"]', 'MobileLogs');
    await page.click('[data-testid="create-app-submit"]');
    
    // Open logs
    await page.click('[data-testid="logs-tab"]');
    
    await page.screenshot({
      path: join(MOBILE_SCREENSHOTS_DIR, '04-mobile-logs.png'),
    });
  });
});

test.describe('Tablet Screenshots @screenshot', () => {
  test.use({
    ...devices['iPad Pro 11'],
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
  });

  test('tablet - landscape overview', async ({ page }) => {
    await page.screenshot({
      path: join(MOBILE_SCREENSHOTS_DIR, '05-tablet-landscape.png'),
    });
  });

  test('tablet - portrait overview', async ({ page }) => {
    // Change to portrait
    await page.setViewportSize({ width: 834, height: 1194 });
    
    await page.screenshot({
      path: join(MOBILE_SCREENSHOTS_DIR, '06-tablet-portrait.png'),
    });
  });
});

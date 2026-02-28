import { test, expect } from '@playwright/test';

/**
 * E2E Tests for AppDaemon Studio
 * Tests core functionality with mocked APIs (MSW)
 */

test.describe('App Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 15000 });
  });

  test('should display initial app list', async ({ page }) => {
    // The mock returns a sample_app by default
    await expect(page.locator('[data-testid="app-sample_app"]')).toBeVisible();
  });

  test('should create a new app', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-app-button"]');
    
    // Fill form
    await page.fill('[data-testid="app-name-input"]', 'my_test_app');
    await page.fill('[data-testid="class-name-input"]', 'MyTestApp');
    
    // Submit
    await page.click('[data-testid="create-app-submit"]');
    
    // Verify app appears in list
    await expect(page.locator('[data-testid="app-my_test_app"]')).toBeVisible();
  });

  test('should open app in editor', async ({ page }) => {
    // Create an app first
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'editor_test');
    await page.fill('[data-testid="class-name-input"]', 'EditorTest');
    await page.click('[data-testid="create-app-submit"]');
    
    // Click on the app to open it
    await page.click('[data-testid="app-editor_test"]');
    
    // Editor should appear with the app content
    await expect(page.locator('[data-testid="editor-panel"]')).toBeVisible();
    await expect(page.locator('text=editor_test.py')).toBeVisible();
  });

  test('should delete an app', async ({ page }) => {
    // Create an app
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'delete_test');
    await page.fill('[data-testid="class-name-input"]', 'DeleteTest');
    await page.click('[data-testid="create-app-submit"]');
    
    // Wait for app to appear
    await expect(page.locator('[data-testid="app-delete_test"]')).toBeVisible();
    
    // Click delete button (trash icon)
    await page.click('[data-testid="app-delete_test"] button[aria-label^="Delete"]');
    
    // Confirm delete in the confirmation dialog
    await page.click('button:has-text("Delete")');
    
    // App should be removed
    await expect(page.locator('[data-testid="app-delete_test"]')).not.toBeVisible();
  });
});

test.describe('Editor Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="sidebar"]');
    
    // Create and open an app for editing
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'edit_test');
    await page.fill('[data-testid="class-name-input"]', 'EditTest');
    await page.click('[data-testid="create-app-submit"]');
    await page.click('[data-testid="app-edit_test"]');
    await page.waitForTimeout(1000);
  });

  test('should save file and create version', async ({ page }) => {
    // Focus editor and type
    await page.click('.monaco-editor', { force: true });
    await page.keyboard.type('\n# New comment added');
    
    // Save with Ctrl+S
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(500);
    
    // Open versions panel
    await page.click('[data-testid="versions-tab"]');
    
    // Should show a version was created
    await expect(page.locator('[data-testid="version-item"]')).toHaveCount(1);
  });
});

test.describe('Logs Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="sidebar"]');
  });

  test('should display logs panel', async ({ page }) => {
    // Click logs tab
    await page.click('[data-testid="logs-tab"]');
    
    // Log viewer should be visible
    await expect(page.locator('[data-testid="log-viewer"]')).toBeVisible();
    
    // Should show mock log entries
    await expect(page.locator('text=AppDaemon Started')).toBeVisible();
  });
});

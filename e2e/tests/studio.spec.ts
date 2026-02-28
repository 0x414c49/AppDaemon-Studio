import { test, expect } from '@playwright/test';

/**
 * Core E2E Tests for AppDaemon Studio
 * Tests the main user flows
 */

test.describe('Studio Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
  });

  test('should load the studio', async ({ page }) => {
    // Check main elements exist
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-app-button"]')).toBeVisible();
    
    // Check title
    await expect(page.locator('text=AppDaemon Studio')).toBeVisible();
  });

  test('should create a new app', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-app-button"]');
    
    // Fill form
    await page.fill('[data-testid="app-name-input"]', 'my_test_app');
    await page.fill('[data-testid="class-name-input"]', 'MyTestApp');
    await page.fill('[data-testid="app-description-input"]', 'Test description');
    
    // Submit
    await page.click('[data-testid="create-app-submit"]');
    
    // Wait for app to appear in sidebar
    await expect(page.locator('[data-testid="app-my_test_app"]')).toBeVisible();
  });

  test('should open app in editor', async ({ page }) => {
    // Create app first
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'editor_test');
    await page.fill('[data-testid="class-name-input"]', 'EditorTest');
    await page.click('[data-testid="create-app-submit"]');
    
    // Click on app
    await page.click('[data-testid="app-editor_test"]');
    
    // Editor should appear
    await expect(page.locator('[data-testid="editor-panel"]')).toBeVisible();
  });

  test('should save file and create version', async ({ page }) => {
    // Create and open app
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'version_test');
    await page.fill('[data-testid="class-name-input"]', 'VersionTest');
    await page.click('[data-testid="create-app-submit"]');
    await page.click('[data-testid="app-version_test"]');
    
    // Wait for editor
    await page.waitForTimeout(1000);
    
    // Type in editor (Monaco editor interaction)
    await page.click('.monaco-editor');
    await page.keyboard.type('\n# Test comment added');
    
    // Save
    await page.keyboard.press('Control+s');
    
    // Wait for save
    await page.waitForTimeout(500);
    
    // Open versions panel
    await page.click('[data-testid="versions-tab"]');
    
    // Should show at least one version
    await expect(page.locator('[data-testid="version-item"]')).toHaveCount(1);
  });

  test('should show logs', async ({ page }) => {
    // Open logs panel
    await page.click('[data-testid="logs-tab"]');
    
    // Log viewer should be visible
    await expect(page.locator('[data-testid="log-viewer"]')).toBeVisible();
  });

  test('should delete an app', async ({ page }) => {
    // Create app
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'delete_me');
    await page.fill('[data-testid="class-name-input"]', 'DeleteMe');
    await page.click('[data-testid="create-app-submit"]');
    
    // Right click on app for context menu
    await page.click('[data-testid="app-delete_me"] button[aria-label="More"]');
    await page.click('text=Delete');
    
    // Confirm delete
    await page.click('[data-testid="confirm-delete"]');
    
    // App should be gone
    await expect(page.locator('[data-testid="app-delete_me"]')).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should show mobile drawer on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Sidebar should be hidden initially
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
    
    // Menu button should be visible
    await expect(page.locator('[data-testid="menu-button"]')).toBeVisible();
    
    // Click menu to open sidebar
    await page.click('[data-testid="menu-button"]');
    
    // Sidebar should now be visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('should adapt layout for tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Sidebar should be visible but narrower
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    
    const box = await sidebar.boundingBox();
    expect(box?.width).toBeLessThan(300);
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="sidebar"]');
    
    // Create an app
    await page.click('[data-testid="create-app-button"]');
    await page.fill('[data-testid="app-name-input"]', 'shortcut_test');
    await page.fill('[data-testid="class-name-input"]', 'ShortcutTest');
    await page.click('[data-testid="create-app-submit"]');
    await page.click('[data-testid="app-shortcut_test"]');
    await page.waitForTimeout(1000);
  });

  test('Ctrl+S should save file', async ({ page }) => {
    // Edit file
    await page.click('.monaco-editor');
    await page.keyboard.type('\n# Edit for save test');
    
    // Save with keyboard
    await page.keyboard.press('Control+s');
    
    // Should show success toast
    await expect(page.locator('text=File saved successfully')).toBeVisible();
  });
});

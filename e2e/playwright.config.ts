import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration with Mocked APIs (MSW)
 * 
 * Uses Vite dev server with MSW (Mock Service Worker) for API mocking.
 * MSW intercepts API calls in the browser - no backend required.
 */

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'iPad Pro',
      use: { ...devices['iPad Pro 12.9'] },
    },
    {
      name: 'iPhone 17',
      use: { ...devices['iPhone 14'] },
    },
  ],
  outputDir: './screenshots/test-results/',
  // Start Vite dev server with mocks enabled
  webServer: {
    command: 'cd ../ui && npx vite --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      VITE_ENABLE_MOCKS: 'true',
    },
  },
});

# Lesson: E2E Testing with Mocked APIs (MSW)

## Why This Matters

**E2E tests must run independently without requiring a backend server.**

Without mocked APIs:
- Tests fail if backend is not running
- Tests are slow (real network requests)
- Tests are flaky (timing issues, data state)
- CI/CD pipelines fail randomly

## The Solution: Mock Service Worker (MSW)

MSW is the industry standard for API mocking in browser-based tests. It works by:
1. Registering a Service Worker in the browser
2. Intercepting all HTTP requests before they leave the browser
3. Returning mock responses instantly

### Key Benefits

- **Fast**: No network latency
- **Reliable**: Same responses every time
- **Isolated**: No backend dependency
- **Realistic**: Tests actual HTTP layer, not just function calls

## Implementation

### 1. Setup MSW in the UI

```typescript
// ui/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/apps', () => {
    return HttpResponse.json({ 
      apps: [{ name: 'sample', class_name: 'Sample' }], 
      count: 1 
    });
  }),
  
  http.post('/api/apps', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body, { status: 201 });
  }),
  
  // ... more handlers
];
```

```typescript
// ui/src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

```typescript
// ui/src/main.tsx
async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
```

### 2. Configure Playwright

```typescript
// e2e/playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'cd ../ui && npx vite --port 5173',
    env: { VITE_ENABLE_MOCKS: 'true' },
    url: 'http://localhost:5173',
  },
  projects: [
    { name: 'iPad Pro', use: { ...devices['iPad Pro 12.9'] } },
    { name: 'iPhone 17', use: { ...devices['iPhone 14'] } },
  ],
});
```

### 3. Write Tests

```typescript
// e2e/tests/studio.spec.ts
test('should create a new app', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="create-app-button"]');
  await page.fill('[data-testid="app-name-input"]', 'my_app');
  await page.click('[data-testid="create-app-submit"]');
  
  // MSW intercepts the POST request and returns mock response
  await expect(page.locator('[data-testid="app-my_app"]')).toBeVisible();
});
```

## Common Pitfalls

### 1. CSS Not Loading (Tailwind/PostCSS)

**Problem**: Page is blank/white in tests

**Root Cause**: Missing `postcss.config.js`

**Fix**:
```javascript
// ui/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Lesson**: Vite processes CSS through PostCSS. Without the config, `@tailwind` directives are served raw instead of compiled.

### 2. API Response Format Mismatch

**Problem**: `apps.map is not a function` error

**Root Cause**: Frontend expects array, backend returns object:
```javascript
// Frontend expects:
const apps: AppInfo[] = await api.get('/apps');

// Backend returns:
{ apps: [...], count: 5 }
```

**Fix**: Update API service to extract the array:
```typescript
export const getApps = async (): Promise<AppInfo[]> => {
  const response = await api.get<{ apps: AppInfo[]; count: number }>('/apps');
  return response.data.apps;  // Extract from wrapper
};
```

### 3. Monaco Editor Click Issues

**Problem**: Clicking on editor fails with "element intercepts pointer events"

**Root Cause**: Monaco has overlay elements that capture clicks

**Fix**: Use `force: true` to bypass:
```typescript
await page.click('.monaco-editor', { force: true });
```

### 4. Mobile Viewport Tests

**Problem**: Tests fail on mobile because sidebar is hidden

**Root Cause**: Mobile has different layout (drawer instead of sidebar)

**Fix**: Either:
- Skip mobile-specific tests if not critical
- Use desktop viewport for most tests
- Add specific mobile test selectors

### 5. Test Data Persistence

**Problem**: Tests share state (apps created in test 1 exist in test 2)

**Root Cause**: MSW handlers share in-memory state

**Fix**: Reset mocks in beforeEach:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Navigate to home to reset state
});
```

## Best Practices

### 1. Use data-testid Attributes

```tsx
// Good: Reliable selector
<button data-testid="create-app-button">Create</button>

// Bad: Brittle selectors
<button class="btn-primary">Create</button>
<button>Create</button>  // text can change
```

### 2. Wait for Elements, Not Time

```typescript
// Good: Wait for specific element
await page.waitForSelector('[data-testid="sidebar"]');

// Bad: Arbitrary delays
await page.waitForTimeout(1000);
```

### 3. Test Behavior, Not Implementation

```typescript
// Good: Test what user sees
await expect(page.locator('text=File saved successfully')).toBeVisible();

// Bad: Test internal state
expect(mockSaveFile).toHaveBeenCalled();
```

### 4. Keep Tests Independent

Each test should:
- Start from clean state
- Not depend on other tests
- Clean up after itself (or use fresh browser context)

## Debugging Tips

### Enable Browser Console Logging

```typescript
test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    console.log(`[Browser ${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (error) => {
    console.error(`[Browser Error] ${error.message}`);
  });
});
```

### Use Playwright Inspector

```bash
npx playwright test --debug
```

### View Screenshots on Failure

```typescript
// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
}
```

Screenshots saved to `e2e/screenshots/test-results/`

### Check MSW Logs

MSW logs all intercepted requests to browser console:
```
[MSW] 14:43:13 GET /api/apps (200 OK)
```

## Installation in Home Assistant

### Why Not Like Zigbee2MQTT (z2m)?

**Z2M**: Published to HACS (Home Assistant Community Store) with a custom repository

**This Add-on**: Currently a local add-on that needs manual installation

### To Publish Like Z2M:

1. **Create a Repository**: GitHub repo with `repository.yaml`
2. **Add to HACS**: Users add your repo URL to HACS
3. **HACS.json**: Define the add-on structure
4. **Submit to Official**: Get added to official add-on store

### Current Installation Method:

```bash
# SSH into Home Assistant
ssh root@homeassistant.local

# Clone to add-ons directory
cd /usr/share/hassio/addons/local
git clone https://github.com/yourusername/appdaemon-studio.git

# Refresh add-ons in UI
# Settings → Add-ons → Add-on Store → ⋮ → Check for updates

# Install and start from UI
```

### .gitignore for E2E

```gitignore
# E2E test screenshots and results
e2e/screenshots/
e2e/test-results/
e2e/playwright-report/
```

## Summary

**Key Takeaways**:
1. MSW is the best way to mock APIs in browser tests
2. Always include PostCSS config for Tailwind
3. Match API response formats between mock and real backend
4. Use `force: true` for problematic elements like Monaco editor
5. Keep tests independent and focused on user behavior

**Definition of Done for E2E**:
- [ ] Tests run without backend server
- [ ] All tests pass consistently
- [ ] Screenshots excluded from git
- [ ] CI/CD runs tests automatically

## Resources

- [MSW Documentation](https://mswjs.io/docs/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Home Assistant Add-on Development](https://developers.home-assistant.io/docs/add-ons)

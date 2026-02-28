# E2E Testing with Playwright

This directory contains end-to-end tests using Playwright with screenshot capabilities.

## Directory Structure

```
e2e/
├── tests/                    # E2E test files
│   ├── studio.spec.ts       # Main studio tests
│   ├── screenshots.spec.ts  # Screenshot tests for docs
│   └── mobile.spec.ts       # Mobile/responsive tests
├── screenshots/             # Screenshot outputs
│   ├── docs/               # Documentation screenshots
│   ├── ci/                 # CI regression screenshots
│   └── test-results/       # Failed test screenshots
├── playwright.config.ts    # Playwright configuration
└── package.json            # Dependencies
```

## Installation

```bash
cd e2e
npm install
npx playwright install
```

## Running Tests

### Basic Tests
```bash
# Run all tests
npm test

# Run with UI mode (for debugging)
npm run test:ui

# Run in debug mode
npm run test:debug
```

### Screenshot Tests

```bash
# Take documentation screenshots
npm run screenshots:docs

# Take CI regression screenshots
npm run screenshots:ci

# Take all screenshots
npm run screenshots
```

## Screenshot Categories

### 1. Documentation Screenshots (`screenshots/docs/`)

Taken with `@docs` tag. Used for README, documentation, and marketing.

```typescript
test('studio overview @docs', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ 
    path: 'screenshots/docs/studio-overview.png',
    fullPage: true 
  });
});
```

### 2. CI Regression Screenshots (`screenshots/ci/`)

Taken with `@ci` tag. Used for visual regression testing in CI/CD.

```typescript
test('editor panel @ci', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ 
    path: 'screenshots/ci/editor-panel.png' 
  });
});
```

### 3. Test Failure Screenshots (`screenshots/test-results/`)

Automatically captured when tests fail.

## Screenshot Naming Convention

```
screenshots/
├── docs/
│   ├── 01-studio-overview.png
│   ├── 02-sidebar-apps.png
│   ├── 03-editor-panel.png
│   ├── 04-version-control.png
│   └── 05-log-viewer.png
└── ci/
    ├── desktop/
    │   ├── chromium/
    │   ├── firefox/
    │   └── webkit/
    └── mobile/
        └── chrome/
```

## CI Integration

The `.gitlab-ci.yml` includes an E2E stage:

```yaml
test-e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.41.0-jammy
  script:
    - cd e2e
    - npm install
    - npx playwright install
    - npm test
  artifacts:
    paths:
      - e2e/screenshots/
    expire_in: 1 week
```

## Best Practices

1. **Use stable selectors**: Prefer data-testid attributes
2. **Wait for content**: Always wait for elements before screenshots
3. **Consistent viewport**: Use device presets for consistency
4. **Clean state**: Reset app state between tests
5. **Tag appropriately**: Use @docs, @ci, @screenshot tags

## Environment Variables

```bash
BASE_URL=http://localhost:5000  # Target URL
CI=true                        # Run in CI mode (headless)
```

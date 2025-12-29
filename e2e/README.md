# End-to-End Tests

This directory contains Playwright end-to-end tests for the Daylio Viewer application.

## Setup

Install Playwright and browsers:

```bash
npm install
npx playwright install
```

## Running Tests

Run all tests:
```bash
npm run test:e2e
```

Run tests in headed mode (see browser):
```bash
npx playwright test --headed
```

Run tests in a specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

Run a specific test file:
```bash
npx playwright test e2e/example.spec.js
```

## Test Configuration

Configuration is defined in `playwright.config.js` at the project root:
- Tests run on Chromium, Firefox, and WebKit
- Web server automatically starts before tests
- Uses the test fixture at `e2e/fixtures/test-backup.daylio`
- Base URL: http://localhost:5000

## Test Fixtures

Test data is located in `e2e/fixtures/`:
- `test-backup.daylio` - Minimal Daylio backup with 5 entries, 5 moods, and 4 activities
- `create-test-backup.js` - Script to regenerate the test backup file

See `e2e/fixtures/README.md` for details about the test data.

## Writing Tests

Example test structure:

```javascript
const { test, expect } = require('@playwright/test');

test('test name', async ({ page }) => {
  await page.goto('/');
  // Your test code here
});
```

## Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

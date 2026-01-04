# End-to-End Tests

This directory contains Playwright end-to-end tests for the Daylio Viewer application.

## Structure

- `e2e/` - Test files (*.spec.js)
- `e2e/fixtures/` - Test data fixtures
  - `test-backup.daylio` - Minimal test Daylio backup with known data
  - `generate-test-backup.js` - Script to regenerate the test backup

## Test Fixture Data

The `test-backup.daylio` contains:

**Moods** (5 standard moods):
- rad (mood_group_id: 5)
- good (mood_group_id: 4)
- meh (mood_group_id: 3)
- bad (mood_group_id: 2)
- awful (mood_group_id: 1)

**Activities** (5 activities in 2 groups):
- Group 1 "activities": work, exercise, reading
- Group 2 "people": family, friends

**Entries** (5 entries):
1. Jan 1, 2024 - "Great Start" (rad mood, work + exercise)
2. Jan 2, 2024 - "Good Day" (good mood, work + reading)
3. Jan 3, 2024 - "Average Day" (meh mood, reading)
4. Jan 4, 2024 - "Family Time" (good mood, family + friends)
5. Jan 5, 2024 - "Amazing Morning" (rad mood, exercise + friends)

**Metadata**:
- Total entries: 5
- Longest streak: 3 days

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

Run tests with UI:
```bash
npm run test:e2e:ui
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

Run tests in debug mode:
```bash
npm run test:e2e:debug
```

## Test Configuration

Configuration is defined in `playwright.config.js` at the project root:
- Tests run on Chromium, Firefox, and WebKit
- Web server automatically starts before tests
- Uses the test fixture at `e2e/fixtures/test-backup.daylio`
- Base URL: http://localhost:5000

## Regenerating Test Fixture

If you need to modify the test backup data:

1. Edit `e2e/fixtures/generate-test-backup.js`
2. Run: `node e2e/fixtures/generate-test-backup.js`
3. The new `test-backup.daylio` will be created

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

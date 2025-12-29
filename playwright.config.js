const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5000',
    // Reduce timeouts for page actions and navigation to make tests fail faster on hangs
    actionTimeout: 5000, // 5s for clicks, fills and other actions
    navigationTimeout: 10000, // 10s for page.goto / navigation
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'node server.js e2e/fixtures/test-backup.daylio',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

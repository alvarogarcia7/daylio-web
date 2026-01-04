const { defineConfig, devices } = require('@playwright/test');

const port = process.env.PORT || 5000;

// Generate unique output folder.
const currentDateTime = new Date().toISOString().replace(/[:.]/g, "_").slice(0, -1);
const outputFolder = `./results/results-${currentDateTime}`;

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder } ]],
  use: {
    baseURL: `http://localhost:${port}`,
    // Reduce timeouts for page actions and navigation to make tests fail faster on hangs
    actionTimeout: 3000, // for clicks, fills and other actions
    navigationTimeout: 8000, // for page.goto / navigation
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'make set-fixture-1; npx node server.js',
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

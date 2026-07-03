const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: { timeout: 5000 },
  reporter: [['list']],
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
    slowMo: 1000,
    launchOptions: {
      slowMo: 1000,
    },
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

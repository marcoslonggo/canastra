const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Canastra Game Testing
 */

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Disable parallel execution for game tests to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Single worker to avoid game conflicts
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  outputDir: 'test-results/',
  timeout: 30000, // 30 seconds timeout for game operations
  
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI || process.env.HEADLESS === 'true',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Slow down actions for game testing
    actionTimeout: 10000,
    navigationTimeout: 15000
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
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    }
  ],

  webServer: [
    {
      command: 'npm start',
      cwd: '../server',
      port: 3002,
      env: {
        ADMIN_PASSWORD: 'test_admin_123',
        NODE_ENV: 'test'
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    },
    {
      command: 'PORT=3004 npm start',
      cwd: '../client',
      port: 3004,
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    }
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./utils/global-setup.js'),
  globalTeardown: require.resolve('./utils/global-teardown.js'),

  // Test configuration
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  // No additional retry configuration needed (already defined above)
});
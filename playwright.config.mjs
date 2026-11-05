import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.mjs',
  timeout: 50_000,
  globalTimeout: 9 * 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BBB_BASE_URL || 'https://bobbysbigboard.com',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 18_000,
    navigationTimeout: 25_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: false
  }
});

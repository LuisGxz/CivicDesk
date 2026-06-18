import { defineConfig, devices } from '@playwright/test';

// Drives the running dev servers (API on :5280, SPA on :4200). Start both before `npx playwright test`.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'en-US',
    actionTimeout: 15_000,
    trace: 'off'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

import { defineConfig } from '@playwright/test';
import { getTestDatabaseUrl } from './scripts/test-database.js';

const databaseUrl = getTestDatabaseUrl();
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30000,
  expect: { timeout: 7000 },
  outputDir: 'test-results',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    locale: 'en-GB',
    timezoneId: 'Asia/Kolkata',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' }, testIgnore: '**/visual.spec.ts' },
    { name: 'chromium-visual', use: { browserName: 'chromium' }, testMatch: '**/visual.spec.ts' },
  ],
  webServer: [
    {
      command: 'npm run start -w apps/api',
      url: 'http://127.0.0.1:3100/health',
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: databaseUrl,
        API_PORT: '3100',
        WEB_ORIGIN: 'http://127.0.0.1:5174',
      },
    },
    {
      command: 'npm run preview -w apps/web -- --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      env: { API_PORT: '3100' },
    },
  ],
});

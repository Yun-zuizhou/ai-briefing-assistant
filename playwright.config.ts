import { defineConfig, devices } from '@playwright/test';

const frontendPort = process.env.FRONTEND_PORT ?? '5173';
const baseURL = `http://127.0.0.1:${frontendPort}`;
const headed = process.env.PLAYWRIGHT_HEADED === '1';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'var/logs/playwright/test-results',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    browserName: 'chromium',
    headless: !headed,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node tools/scripts/dev-e2e.mjs',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});

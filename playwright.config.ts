import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const frontendPort = process.env.FRONTEND_PORT ?? '5173';
const baseURL = `http://127.0.0.1:${frontendPort}`;
const headed = process.env.PLAYWRIGHT_HEADED === '1';
const edgeExecutablePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const chromeExecutablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const preferredExecutablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || (existsSync(edgeExecutablePath) ? edgeExecutablePath : null)
  || (existsSync(chromeExecutablePath) ? chromeExecutablePath : null)
  || undefined;
const projectName = preferredExecutablePath
  ? (preferredExecutablePath === edgeExecutablePath ? 'edge-local' : 'chrome-local')
  : 'chromium-bundled';

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
    launchOptions: preferredExecutablePath
      ? {
          executablePath: preferredExecutablePath,
        }
      : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node tools/scripts/dev-e2e.mjs',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: projectName,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: preferredExecutablePath
          ? {
              executablePath: preferredExecutablePath,
            }
          : undefined,
      },
    },
  ],
});

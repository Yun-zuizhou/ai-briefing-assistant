import { existsSync } from 'node:fs';

import { isLocalPortListening, rootDir } from './_shared.mjs';

const frontendPort = process.env.FRONTEND_PORT ?? '5173';
const frontendUrl = `http://127.0.0.1:${frontendPort}/login`;
const edgeExecutablePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const chromeExecutablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

function resolveExecutablePath() {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  }
  if (existsSync(edgeExecutablePath)) {
    return edgeExecutablePath;
  }
  if (existsSync(chromeExecutablePath)) {
    return chromeExecutablePath;
  }
  return undefined;
}

if (!isLocalPortListening(frontendPort)) {
  console.error(`Frontend is not running on http://127.0.0.1:${frontendPort}/ . Start it first with: npm run task:start`);
  process.exit(1);
}

const { chromium } = await import('playwright');
const executablePath = resolveExecutablePath();

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  const page = await browser.newPage();
  await page.goto(frontendUrl, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForURL('**/today', { timeout: 30_000 });
  await page.getByRole('heading', { name: '今日内容摘要' }).waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('heading', { name: '头版重点' }).waitFor({ state: 'visible', timeout: 15_000 });
  const cookies = await page.context().cookies();
  const hasSession = cookies.some((cookie) => cookie.name === 'jianbao_session');
  if (!hasSession) {
    throw new Error('Expected jianbao_session cookie after dev auto-login, but none was found.');
  }

  console.log('Browser smoke passed.');
  console.log(`Verified URL: ${page.url()}`);
  console.log(`Browser runtime: ${executablePath ?? 'playwright-bundled-chromium'}`);
  console.log(`Workspace: ${rootDir}`);
} finally {
  await browser.close();
}

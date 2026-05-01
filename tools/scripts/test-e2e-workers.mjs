import path from 'node:path';
import { existsSync } from 'node:fs';

import { npmCommand, rootDir, runCommand } from './_shared.mjs';

const edgeExecutablePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const chromeExecutablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const passthroughArgs = process.argv.slice(2);

const env = {
  ...process.env,
  PLAYWRIGHT_BROWSERS_PATH: path.join(rootDir, 'var', 'tmp', 'playwright-browsers'),
  PLAYWRIGHT_EXECUTABLE_PATH:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH
    || (existsSync(edgeExecutablePath) ? edgeExecutablePath : '')
    || (existsSync(chromeExecutablePath) ? chromeExecutablePath : ''),
};

await runCommand(npmCommand(), ['exec', 'playwright', 'test', ...passthroughArgs], {
  cwd: rootDir,
  env,
});

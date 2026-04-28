import path from 'node:path';

import { npmCommand, rootDir, runCommand } from './_shared.mjs';

const env = {
  ...process.env,
  PLAYWRIGHT_BROWSERS_PATH: path.join(rootDir, 'var', 'tmp', 'playwright-browsers'),
};

await runCommand(npmCommand(), ['exec', 'playwright', 'test'], {
  cwd: rootDir,
  env,
});

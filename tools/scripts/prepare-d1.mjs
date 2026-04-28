import { existsSync } from 'node:fs';
import path from 'node:path';

import { makeBackendEnv, rootDir, runCommand, workerWranglerToml } from './_shared.mjs';

async function main() {
  await runCommand('python', ['tools/scripts/generate_d1_remote_seed.py'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });
  await runCommand('python', ['tools/scripts/split_d1_seed.py'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });

  const wranglerPath = process.platform === 'win32'
    ? path.join(process.env.APPDATA ?? '', 'npm', 'wrangler.cmd')
    : 'wrangler';

  if (process.platform === 'win32' && !existsSync(wranglerPath)) {
    console.log('Generated infra/cloudflare/d1/seeds/generated/seed.remote.sql, but wrangler is not installed in the current environment.');
    return;
  }

  console.log(`Generated the D1 remote seed file. Use ${path.relative(rootDir, workerWranglerToml)} in an authenticated Cloudflare environment.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

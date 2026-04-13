import { existsSync } from 'node:fs';
import path from 'node:path';

import { makeBackendEnv, rootDir, runCommand } from './_shared.mjs';

async function main() {
  await runCommand('python', ['scripts/generate_d1_remote_seed.py'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });
  await runCommand('python', ['scripts/split_d1_seed.py'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });

  const wranglerPath = process.platform === 'win32'
    ? path.join(process.env.APPDATA ?? '', 'npm', 'wrangler.cmd')
    : 'wrangler';

  if (!existsSync(path.join(rootDir, 'wrangler.toml'))) {
    throw new Error('未找到 wrangler.toml');
  }

  if (process.platform === 'win32' && !existsSync(wranglerPath)) {
    console.log('Generated cloudflare/d1/seed.remote.sql, but wrangler is not installed in the current environment.');
    return;
  }

  console.log('Generated the D1 remote seed file. Run wrangler d1 migrations apply and wrangler d1 execute in an authenticated Cloudflare environment.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

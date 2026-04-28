import fs from 'node:fs';
import path from 'node:path';

import { makeBackendEnv, rootDir, runCommand, workerWranglerToml } from './_shared.mjs';

const envPath = path.join(rootDir, '.env');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const map = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    map[key] = value;
  }
  return map;
}

function readDatabaseIdFromWrangler(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/database_id\s*=\s*"([^"]+)"/);
  return match?.[1] || '';
}

function assertRequiredConfig(envMap) {
  const required = ['D1_DATABASE_ID', 'D1_ACCOUNT_ID', 'D1_API_TOKEN'];
  const missing = required.filter((key) => !envMap[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required D1 config: ${missing.join(', ')}`);
  }
}

async function main() {
  const envMap = parseEnvFile(envPath);
  assertRequiredConfig(envMap);

  const workersDbId = readDatabaseIdFromWrangler(workerWranglerToml);
  if (!workersDbId) {
    throw new Error('Missing database_id in apps/edge-worker/wrangler.toml, cannot continue preflight.');
  }
  if (envMap.D1_DATABASE_ID && envMap.D1_DATABASE_ID !== workersDbId) {
    throw new Error(`D1 binding mismatch: env=${envMap.D1_DATABASE_ID}, worker=${workersDbId}`);
  }

  await runCommand('node', ['tools/scripts/test-workers.mjs'], { cwd: rootDir });

  if ((envMap.D1_USE_CLOUD_AS_SOURCE || '').toLowerCase() === 'true') {
    await runCommand('python', ['tools/scripts/verify_d1_behavior_mainline.py'], {
      cwd: rootDir,
      env: makeBackendEnv(),
    });
  } else {
    console.log('D1_USE_CLOUD_AS_SOURCE=false, skipped cloud D1 behavior verification.');
  }

  console.log('Workers + D1 preflight passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

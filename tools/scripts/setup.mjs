import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

import {
  edgeWorkerDir,
  makeBackendEnv,
  npmCommand,
  rootDir,
  runCommand,
  webDir,
} from './_shared.mjs';

function ensureFile(targetPath, sourcePath) {
  if (!existsSync(targetPath) && existsSync(sourcePath)) {
    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
    console.log(`Created ${path.relative(rootDir, targetPath)}`);
  }
}

async function ensureFrontendDeps() {
  const nodeModulesPath = path.join(webDir, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    console.log('Frontend dependencies already exist, skipping install');
    return;
  }
  console.log('Installing frontend dependencies...');
  await runCommand(npmCommand(), ['install'], { cwd: webDir });
}

async function ensureBackendRuntime() {
  try {
    await runCommand('python', ['-m', 'uvicorn', '--version'], {
      cwd: rootDir,
      env: makeBackendEnv(),
    });
    console.log('Backend runtime dependencies are available');
    return;
  } catch (error) {
    console.log('Embedded backend runtime not available, trying pip install -r requirements.txt');
  }

  await runCommand('python', ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
    cwd: rootDir,
  });
}

async function ensureWorkersDeps() {
  const nodeModulesPath = path.join(edgeWorkerDir, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    console.log('Workers dependencies already exist, skipping install');
    return;
  }
  console.log('Installing workers dependencies...');
  await runCommand(npmCommand(), ['install'], { cwd: edgeWorkerDir });
}

async function bootstrapLocalDb() {
  console.log('Bootstrapping local SQLite runtime data...');
  await runCommand('python', ['tools/scripts/bootstrap_local_runtime.py'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });
}

async function applyLocalWorkersD1Migrations() {
  console.log('Applying local Workers D1 migrations if a Miniflare database already exists...');
  await runCommand('python', ['tools/scripts/apply_d1_local.py'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });
}

async function main() {
  ensureFile(path.join(rootDir, '.env'), path.join(rootDir, '.env.example'));
  ensureFile(path.join(webDir, '.env'), path.join(webDir, '.env.example'));
  ensureFile(path.join(edgeWorkerDir, '.dev.vars'), path.join(edgeWorkerDir, '.dev.vars.example'));
  await ensureFrontendDeps();
  await ensureWorkersDeps();
  await ensureBackendRuntime();
  await bootstrapLocalDb();
  await applyLocalWorkersD1Migrations();
  console.log('Setup completed');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

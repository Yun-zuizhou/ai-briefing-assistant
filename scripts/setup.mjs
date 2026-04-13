import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

import {
  makeBackendEnv,
  npmCommand,
  prototypeDir,
  rootDir,
  runCommand,
} from './_shared.mjs';

function ensureFile(targetPath, sourcePath) {
  if (!existsSync(targetPath) && existsSync(sourcePath)) {
    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
    console.log(`Created ${path.relative(rootDir, targetPath)}`);
  }
}

async function ensureFrontendDeps() {
  const nodeModulesPath = path.join(prototypeDir, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    console.log('Frontend dependencies already exist, skipping install');
    return;
  }
  console.log('Installing frontend dependencies...');
  await runCommand(npmCommand(), ['install'], { cwd: prototypeDir });
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

async function bootstrapLocalDb() {
  console.log('Bootstrapping local SQLite runtime data...');
  await runCommand('python', ['scripts/bootstrap_local_runtime.py'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });
}

async function main() {
  ensureFile(path.join(rootDir, '.env'), path.join(rootDir, '.env.example'));
  ensureFile(path.join(prototypeDir, '.env'), path.join(prototypeDir, '.env.example'));
  await ensureFrontendDeps();
  await ensureBackendRuntime();
  await bootstrapLocalDb();
  console.log('Setup completed');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

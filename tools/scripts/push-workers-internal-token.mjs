import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { edgeWorkerDir, npmCommand, rootDir } from './_shared.mjs';

const localDevVarsPath = path.join(edgeWorkerDir, '.dev.vars');

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

function spawnWithPipe(command, args, options = {}) {
  const isWindowsCmd = process.platform === 'win32' && command.toLowerCase().endsWith('.cmd');
  if (isWindowsCmd) {
    return spawn('cmd.exe', ['/d', '/s', '/c', command, ...args], {
      cwd: options.cwd,
      env: options.env ?? process.env,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  return spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

async function putSecret(secretValue) {
  const command = npmCommand();
  const args = ['exec', '--', 'wrangler', 'secret', 'put', 'INTERNAL_API_TOKEN'];

  await new Promise((resolve, reject) => {
    const child = spawnWithPipe(command, args, { cwd: edgeWorkerDir });
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`wrangler secret put INTERNAL_API_TOKEN 失败，退出码 ${code ?? 'unknown'}\n${stderr}`));
    });

    child.stdin.write(`${secretValue}\n`);
    child.stdin.end();
  });
}

async function main() {
  if (!fs.existsSync(localDevVarsPath)) {
    throw new Error(
      '缺少 apps/edge-worker/.dev.vars。请先运行 npm.cmd run task:init，或按 .dev.vars.example 手动创建。'
    );
  }

  const envMap = parseEnvFile(localDevVarsPath);
  const token = String(envMap.INTERNAL_API_TOKEN || '').trim();
  if (!token) {
    throw new Error('apps/edge-worker/.dev.vars 缺少 INTERNAL_API_TOKEN，无法推送到远端 Worker secret。');
  }

  console.log('Pushing INTERNAL_API_TOKEN from local .dev.vars to the default Worker secret...');
  console.log(`Workspace: ${rootDir}`);
  console.log(`Source file: ${localDevVarsPath}`);
  await putSecret(token);
  console.log('Remote secret updated: INTERNAL_API_TOKEN');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { edgeWorkerDir, rootDir } from './_shared.mjs';

const localDevVarsPath = path.join(edgeWorkerDir, '.dev.vars');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

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

function runCapture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const isWindowsCmd = process.platform === 'win32' && command.toLowerCase().endsWith('.cmd');
    const child = isWindowsCmd
      ? spawn('cmd.exe', ['/d', '/s', '/c', command, ...args], {
          cwd: options.cwd,
          env: options.env ?? process.env,
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      : spawn(command, args, {
          cwd: options.cwd,
          env: options.env ?? process.env,
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} 失败，退出码 ${code ?? 'unknown'}\n${stderr || stdout}`));
    });
  });
}

function assertLocalDevVars() {
  if (!fs.existsSync(localDevVarsPath)) {
    throw new Error(
      '缺少 apps/edge-worker/.dev.vars。请先运行 npm.cmd run setup，或按 .dev.vars.example 手动创建。'
    );
  }

  const envMap = parseEnvFile(localDevVarsPath);
  if (!envMap.INTERNAL_API_TOKEN) {
    throw new Error('apps/edge-worker/.dev.vars 缺少 INTERNAL_API_TOKEN。');
  }

  return envMap;
}

async function assertRemoteSecret() {
  const { stdout } = await runCapture(
    npxCommand,
    ['wrangler', 'secret', 'list'],
    { cwd: edgeWorkerDir }
  );

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`无法解析 wrangler secret list 输出：${error instanceof Error ? error.message : 'unknown error'}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('wrangler secret list 输出不是数组。');
  }

  const found = parsed.some((item) => item?.name === 'INTERNAL_API_TOKEN');
  if (!found) {
    throw new Error('默认 Worker 当前缺少远端 secret：INTERNAL_API_TOKEN');
  }
}

async function main() {
  const localEnv = assertLocalDevVars();
  await assertRemoteSecret();

  console.log('Workers config preflight passed.');
  console.log(`Workspace: ${rootDir}`);
  console.log(`Local .dev.vars: ${localDevVarsPath}`);
  console.log(`Local INTERNAL_API_TOKEN length: ${localEnv.INTERNAL_API_TOKEN.length}`);
  console.log('Remote secret: INTERNAL_API_TOKEN exists on default Worker.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

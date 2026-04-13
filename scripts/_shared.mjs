import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = path.resolve(__dirname, '..');
export const prototypeDir = path.join(rootDir, 'prototype');
export const backendPort = process.env.BACKEND_PORT ?? '5000';
export const frontendPort = process.env.FRONTEND_PORT ?? '5173';

export function getPythonPath() {
  const parts = [rootDir];
  for (const relativePath of ['.pydeps_runtime', '.pydeps']) {
    const fullPath = path.join(rootDir, relativePath);
    if (existsSync(fullPath)) {
      parts.push(fullPath);
    }
  }
  if (process.env.PYTHONPATH) {
    parts.push(process.env.PYTHONPATH);
  }
  return parts.join(path.delimiter);
}

export function makeBackendEnv(extraEnv = {}) {
  return {
    ...process.env,
    PYTHONPATH: getPythonPath(),
    ...extraEnv,
  };
}

export function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function spawnLogged(command, args, options = {}) {
  if (process.platform === 'win32' && command.toLowerCase().endsWith('.cmd')) {
    return spawn('cmd.exe', ['/d', '/s', '/c', command, ...args], {
      stdio: 'inherit',
      shell: false,
      ...options,
    });
  }
  return spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });
}

export async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawnLogged(command, args, options);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} 失败，退出码 ${code ?? 'unknown'}`));
    });
    child.on('error', reject);
  });
}

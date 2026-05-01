import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = path.resolve(__dirname, '../..');
export const scriptsDir = path.join(rootDir, 'tools', 'scripts');
export const webDir = path.join(rootDir, 'apps', 'web');
export const edgeWorkerDir = path.join(rootDir, 'apps', 'edge-worker');
export const workerWranglerToml = path.join(edgeWorkerDir, 'wrangler.toml');
export const d1Dir = path.join(rootDir, 'infra', 'cloudflare', 'd1');
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

let cachedPythonCommand;

function resolvePythonCommand() {
  if (cachedPythonCommand) {
    return cachedPythonCommand;
  }

  if (process.env.PYTHON_EXECUTABLE) {
    cachedPythonCommand = process.env.PYTHON_EXECUTABLE;
    return cachedPythonCommand;
  }

  if (process.platform === 'win32') {
    try {
      const output = execFileSync('where.exe', ['python'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const match = output
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .find((entry) => entry.toLowerCase().endsWith('python.exe') && existsSync(entry));
      if (match) {
        cachedPythonCommand = match;
        return cachedPythonCommand;
      }
    } catch {
      // Fall back to PATH lookup below when where.exe is unavailable.
    }
  }

  cachedPythonCommand = 'python';
  return cachedPythonCommand;
}

export function spawnLogged(command, args, options = {}) {
  const resolvedCommand =
    command === 'python' ? resolvePythonCommand() : command;

  if (process.platform === 'win32' && resolvedCommand.toLowerCase().endsWith('.cmd')) {
    return spawn('cmd.exe', ['/d', '/s', '/c', resolvedCommand, ...args], {
      stdio: 'inherit',
      shell: false,
      ...options,
    });
  }
  return spawn(resolvedCommand, args, {
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

export function freeLocalPort(port) {
  if (!port) {
    return;
  }

  if (process.platform === 'win32') {
    const lookup = spawnSync('netstat', ['-ano', '-p', 'tcp'], {
      encoding: 'utf8',
      shell: false,
    });
    if (lookup.status !== 0 || !lookup.stdout) {
      return;
    }

    const portSuffix = `:${port}`;
    const procIds = new Set(
      lookup.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('TCP'))
        .map((line) => line.split(/\s+/))
        .filter((parts) => parts[1]?.endsWith(portSuffix) && parts[3] === 'LISTENING')
        .map((parts) => parts[4])
        .filter(Boolean),
    );

    for (const procId of procIds) {
      spawnSync('taskkill', ['/PID', procId, '/F', '/T'], {
        stdio: 'ignore',
        shell: false,
      });
    }
    return;
  }

  spawnSync('sh', ['-lc', `lsof -ti tcp:${port} | xargs -r kill -TERM`], {
    stdio: 'ignore',
    shell: false,
  });
}

export function isLocalPortListening(port) {
  if (!port) {
    return false;
  }

  if (process.platform === 'win32') {
    const lookup = spawnSync('netstat', ['-ano', '-p', 'tcp'], {
      encoding: 'utf8',
      shell: false,
    });
    if (lookup.status !== 0 || !lookup.stdout) {
      return false;
    }

    const portSuffix = `:${port}`;
    return lookup.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('TCP'))
      .map((line) => line.split(/\s+/))
      .some((parts) => parts[1]?.endsWith(portSuffix) && parts[3] === 'LISTENING');
  }

  const lookup = spawnSync('sh', ['-lc', `lsof -i tcp:${port} -sTCP:LISTEN -t`], {
    encoding: 'utf8',
    shell: false,
  });
  return lookup.status === 0 && Boolean(lookup.stdout?.trim());
}

export async function waitForLocalPort(port, timeoutMs = 20000, intervalMs = 250) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (isLocalPortListening(port)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return isLocalPortListening(port);
}

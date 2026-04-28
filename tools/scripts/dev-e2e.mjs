import {
  edgeWorkerDir,
  frontendPort,
  makeBackendEnv,
  npmCommand,
  rootDir,
  runCommand,
  spawnLogged,
  webDir,
} from './_shared.mjs';

const backendPort = process.env.BACKEND_PORT || '8787';

const backend = spawnLogged(
  npmCommand(),
  ['run', 'dev', '--', '--ip', '127.0.0.1', '--port', backendPort],
  {
    cwd: edgeWorkerDir,
  },
);

try {
  await runCommand('python', ['tools/scripts/apply_d1_local.py', '--wait-seconds', '60'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });

  await runCommand(
    'python',
    ['tools/scripts/apply_d1_local_seed.py', '--wait-seconds', '0', '--seed-group', 'content-minimal'],
    {
      cwd: rootDir,
      env: makeBackendEnv(),
    },
  );
} catch (error) {
  backend.kill('SIGINT');
  throw error;
}

const frontend = spawnLogged(
  npmCommand(),
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', frontendPort, '--strictPort'],
  {
    cwd: webDir,
  },
);

console.log(`Frontend: http://127.0.0.1:${frontendPort}`);
console.log(`Backend: http://127.0.0.1:${backendPort}`);
console.log('E2E Runtime: workers + web');

function shutdown(code = 0) {
  for (const child of [backend, frontend]) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }
  setTimeout(() => process.exit(code), 300);
}

for (const child of [backend, frontend]) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

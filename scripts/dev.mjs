import {
  backendPort,
  frontendPort,
  makeBackendEnv,
  npmCommand,
  prototypeDir,
  rootDir,
  spawnLogged,
} from './_shared.mjs';

const backend = spawnLogged(
  'python',
  ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', backendPort],
  {
    cwd: rootDir,
    env: makeBackendEnv(),
  },
);

const frontend = spawnLogged(
  npmCommand(),
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', frontendPort, '--strictPort'],
  {
    cwd: prototypeDir,
  },
);

console.log(`Frontend: http://127.0.0.1:${frontendPort}`);
console.log(`Backend: http://127.0.0.1:${backendPort}`);
console.log(`Docs: http://127.0.0.1:${backendPort}/docs`);

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

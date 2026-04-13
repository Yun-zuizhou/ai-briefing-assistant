import { backendPort, makeBackendEnv, rootDir, spawnLogged } from './_shared.mjs';

const child = spawnLogged(
  'python',
  ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', backendPort],
  {
    cwd: rootDir,
    env: makeBackendEnv(),
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});


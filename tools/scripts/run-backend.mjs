import { edgeWorkerDir, makeBackendEnv, npmCommand, rootDir, runCommand, spawnLogged } from './_shared.mjs';

const backendRuntime = (process.env.BACKEND_RUNTIME || 'workers').toLowerCase();
const backendPort =
  process.env.BACKEND_PORT || (backendRuntime === 'python' ? '5000' : '8787');

async function main() {
  if (backendRuntime === 'workers') {
    await runCommand('python', ['tools/scripts/apply_d1_local.py'], {
      cwd: rootDir,
      env: makeBackendEnv(),
    });
  }

  const child =
    backendRuntime === 'python'
      ? spawnLogged(
          'python',
          ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', backendPort],
          {
            cwd: rootDir,
            env: makeBackendEnv(),
          },
        )
      : spawnLogged(
          npmCommand(),
          ['run', 'dev', '--', '--ip', '127.0.0.1', '--port', backendPort],
          {
            cwd: edgeWorkerDir,
          },
        );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

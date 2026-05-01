import {
  edgeWorkerDir,
  frontendPort,
  isLocalPortListening,
  makeBackendEnv,
  npmCommand,
  rootDir,
  runCommand,
  spawnLogged,
  waitForLocalPort,
  webDir,
} from './_shared.mjs';

const cliArgs = process.argv.slice(2);
const argSet = new Set(cliArgs);
const fastMode = argSet.has('--fast') || argSet.has('--lite');
const skipD1Prepare = fastMode || argSet.has('--skip-d1-prepare');
const disablePythonScheduler = fastMode || argSet.has('--no-scheduler');

function readArgValue(name, fallback) {
  const prefix = `${name}=`;
  const matched = cliArgs.find((arg) => arg.startsWith(prefix));
  return matched ? matched.slice(prefix.length) : fallback;
}

const backendRuntime = (process.env.BACKEND_RUNTIME || 'workers').toLowerCase();
const backendPort =
  process.env.BACKEND_PORT || (backendRuntime === 'python' ? '5000' : '8787');
const d1PrepareWaitSeconds = readArgValue(
  '--d1-wait-seconds',
  process.env.D1_LOCAL_PREPARE_WAIT_SECONDS || '30',
);
const d1SeedGroup = readArgValue(
  '--d1-seed-group',
  process.env.D1_LOCAL_SEED_GROUP || 'content-minimal',
);

async function prepareLocalD1() {
  if (backendRuntime !== 'workers' || skipD1Prepare) {
    return;
  }

  await runCommand('python', ['tools/scripts/apply_d1_local.py', '--wait-seconds', d1PrepareWaitSeconds], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });

  if (d1SeedGroup && d1SeedGroup.toLowerCase() !== 'none') {
    await runCommand(
      'python',
      ['tools/scripts/apply_d1_local_seed.py', '--wait-seconds', '0', '--seed-group', d1SeedGroup],
      {
        cwd: rootDir,
        env: makeBackendEnv(),
      },
    );
  }
}

const backend =
  backendRuntime === 'python'
    ? spawnLogged(
        'python',
        ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', backendPort],
        {
          cwd: rootDir,
          env: makeBackendEnv(
            disablePythonScheduler ? { ENABLE_BACKGROUND_SCHEDULER: 'false' } : {},
          ),
        },
      )
    : spawnLogged(
        npmCommand(),
        ['run', 'dev', '--', '--ip', '127.0.0.1', '--port', backendPort],
        {
          cwd: edgeWorkerDir,
        },
      );

try {
  await prepareLocalD1();
} catch (error) {
  if (!backend.killed) {
    backend.kill('SIGINT');
  }
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
if (backendRuntime === 'python') {
  console.log(`Backend Runtime: python-fastapi`);
  console.log(`Background Scheduler: ${disablePythonScheduler ? 'disabled' : 'enabled'}`);
  console.log(`Docs: http://127.0.0.1:${backendPort}/docs`);
} else {
  console.log(`Backend Runtime: cloudflare-workers`);
  console.log(`Local D1 Prepare: ${skipD1Prepare ? 'skipped' : `migrations + ${d1SeedGroup}`}`);
}

let startupCompleted = false;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const child of [backend, frontend]) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }
  setTimeout(() => process.exit(code), 300);
}

const childLabels = new Map([
  [backend, 'backend'],
  [frontend, 'frontend'],
]);

for (const child of [backend, frontend]) {
  child.on('exit', (code) => {
    if (shuttingDown) {
      return;
    }

    if (!startupCompleted) {
      if (code && code !== 0) {
        shutdown(code);
      }
      return;
    }

    if (code && code !== 0) {
      const label = childLabels.get(child) || 'service';
      console.warn(`${label} exited with code ${code}, leaving the other service running.`);
      if (!isLocalPortListening(frontendPort) && !isLocalPortListening(backendPort)) {
        process.exit(code);
      }
      return;
    }

    if (!isLocalPortListening(frontendPort) && !isLocalPortListening(backendPort)) {
      shutdown(code);
    }
  });
}

const frontendReady = await waitForLocalPort(frontendPort);
const backendReady = await waitForLocalPort(backendPort);
if (!frontendReady || !backendReady) {
  shutdown(1);
  throw new Error(
    `Dev startup failed: frontend ready=${frontendReady}, backend ready=${backendReady}.`,
  );
}

startupCompleted = true;
console.log('Dev startup health check passed.');

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

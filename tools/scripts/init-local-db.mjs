import { makeBackendEnv, rootDir, runCommand } from './_shared.mjs';

async function main() {
  await runCommand('python', ['tools/scripts/bootstrap_local_runtime.py'], {
    cwd: rootDir,
    env: makeBackendEnv(),
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

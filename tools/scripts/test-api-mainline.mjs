import { makeBackendEnv, rootDir, runCommand } from './_shared.mjs';

async function main() {
  await runCommand('python', ['-m', 'pytest', 'tests/test_api_mainline.py'], {
    cwd: rootDir,
    env: makeBackendEnv({
      D1_USE_CLOUD_AS_SOURCE: 'false',
    }),
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

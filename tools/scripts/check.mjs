import { makeBackendEnv, npmCommand, rootDir, runCommand, webDir } from './_shared.mjs';

function shouldRunWorkersChecks() {
  if (process.argv.includes('--without-workers')) {
    return false;
  }
  return true;
}

async function main() {
  await runCommand(npmCommand(), ['run', 'build'], { cwd: webDir });
  await runCommand(npmCommand(), ['run', 'lint'], { cwd: webDir });
  await runCommand('python', ['-m', 'pytest', '-q'], {
    cwd: rootDir,
    env: makeBackendEnv({
      D1_USE_CLOUD_AS_SOURCE: 'false',
    }),
  });

  if (shouldRunWorkersChecks()) {
    console.log('Including workers checks in this run...');
    await runCommand('node', ['tools/scripts/test-workers.mjs'], { cwd: rootDir });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

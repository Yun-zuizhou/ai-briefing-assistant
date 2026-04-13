import { makeBackendEnv, npmCommand, prototypeDir, rootDir, runCommand } from './_shared.mjs';

async function main() {
  await runCommand(npmCommand(), ['run', 'build'], { cwd: prototypeDir });
  await runCommand(npmCommand(), ['run', 'lint'], { cwd: prototypeDir });
  await runCommand('python', ['-m', 'pytest', '-q'], {
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

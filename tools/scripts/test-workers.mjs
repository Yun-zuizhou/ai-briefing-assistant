import { edgeWorkerDir, npmCommand, runCommand } from './_shared.mjs';

async function main() {
  await runCommand(npmCommand(), ['run', 'typecheck'], { cwd: edgeWorkerDir });
  await runCommand(npmCommand(), ['run', 'test'], { cwd: edgeWorkerDir });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

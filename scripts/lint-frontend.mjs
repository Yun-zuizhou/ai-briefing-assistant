import { npmCommand, prototypeDir, runCommand } from './_shared.mjs';

async function main() {
  await runCommand(npmCommand(), ['run', 'lint'], { cwd: prototypeDir });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

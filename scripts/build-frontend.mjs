import { npmCommand, prototypeDir, runCommand } from './_shared.mjs';

async function main() {
  await runCommand(npmCommand(), ['run', 'build'], { cwd: prototypeDir });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

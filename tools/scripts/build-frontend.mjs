import { npmCommand, runCommand, webDir } from './_shared.mjs';

async function main() {
  await runCommand(npmCommand(), ['run', 'build'], { cwd: webDir });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

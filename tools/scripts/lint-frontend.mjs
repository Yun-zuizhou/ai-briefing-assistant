import { npmCommand, runCommand, webDir } from './_shared.mjs';

async function main() {
  await runCommand(npmCommand(), ['run', 'lint'], { cwd: webDir });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

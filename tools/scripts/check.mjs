import { npmCommand, rootDir, runCommand, webDir } from './_shared.mjs';

function shouldRunWorkersChecks() {
  if (process.argv.includes('--without-workers')) {
    return false;
  }
  return true;
}

function shouldRunLegacyPythonChecks() {
  return process.argv.includes('--with-legacy-python');
}

async function main() {
  await runCommand('node', ['tools/scripts/check-governance.mjs'], { cwd: rootDir });
  await runCommand(npmCommand(), ['run', 'build'], { cwd: webDir });
  await runCommand(npmCommand(), ['run', 'lint'], { cwd: webDir });

  if (shouldRunWorkersChecks()) {
    console.log('Including workers checks in this run...');
    await runCommand('node', ['tools/scripts/test-workers.mjs'], { cwd: rootDir });
  }

  if (shouldRunLegacyPythonChecks()) {
    console.log('Including legacy Python compatibility checks in this run...');
    await runCommand('node', ['tools/scripts/check-legacy-python.mjs'], { cwd: rootDir });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

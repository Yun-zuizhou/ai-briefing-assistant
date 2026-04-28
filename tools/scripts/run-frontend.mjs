import { frontendPort, npmCommand, spawnLogged, webDir } from './_shared.mjs';

const child = spawnLogged(
  npmCommand(),
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', frontendPort, '--strictPort'],
  {
    cwd: webDir,
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

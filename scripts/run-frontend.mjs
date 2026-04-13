import { frontendPort, npmCommand, prototypeDir, spawnLogged } from './_shared.mjs';

const child = spawnLogged(
  npmCommand(),
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', frontendPort, '--strictPort'],
  {
    cwd: prototypeDir,
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

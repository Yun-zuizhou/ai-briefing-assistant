#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const script = process.argv[2];
const rest = process.argv.slice(3);

if (!script) {
  console.log('Usage: ai-briefing <script> [args...]');
  console.log('');
  console.log('Available scripts (from package.json):');
  console.log('  dev, dev:fast, dev:frontend, dev:backend, dev:python');
  console.log('  build, lint');
  console.log('  check, check:proof, check:workers');
  console.log('  test:workers, test:e2e:workers');
  console.log('  db:init, db:d1:*');
  console.log('  pipeline:collect:ai, pipeline:summarize:ai');
  console.log('  setup, preflight:*, release:preflight');
  console.log('');
  console.log('Aliases: start=dev, verify=check, proof=check:proof');
  process.exit(0);
}

const aliasMap = {
  start: 'dev',
  verify: 'check',
  proof: 'check:proof',
};

const target = aliasMap[script] || script;

const child = spawn('npm', ['run', target, ...(rest.length ? ['--', ...rest] : [])], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code || 0));

import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { npmCommand, rootDir } from './_shared.mjs';

const logsDir = path.join(rootDir, 'var', 'logs', 'gate-check');

function pad(num) {
  return String(num).padStart(2, '0');
}

function formatId(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function formatHuman(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatTimezoneOffset(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `UTC${sign}${pad(hours)}:${pad(minutes)}`;
}

function buildCommand(command, args) {
  return [command, ...args].join(' ');
}

function stripAnsi(text) {
  return text
    .replace(/\u001B\[[0-9;?]*[ -/]*[@-~]/g, '')
    .replace(/\u009B[0-9;?]*[ -/]*[@-~]/g, '')
    .replace(/\r/g, '');
}

function spawnForCommand(command, args, options) {
  if (process.platform === 'win32' && command.toLowerCase().endsWith('.cmd')) {
    return spawn('cmd.exe', ['/d', '/s', '/c', command, ...args], options);
  }
  return spawn(command, args, options);
}

async function runAndTee({ command, args, logPath }) {
  const commandLine = buildCommand(command, args);
  const startedAt = new Date();
  const stream = createWriteStream(logPath, { flags: 'a' });
  stream.write(`[${formatHuman(startedAt)}] START ${commandLine}\n`);

  let mergedOutput = '';

  try {
    const code = await new Promise((resolve, reject) => {
      const child = spawnForCommand(command, args, {
        cwd: rootDir,
        env: process.env,
        shell: false,
      });

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        mergedOutput += text;
        stream.write(text);
        process.stdout.write(text);
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        mergedOutput += text;
        stream.write(text);
        process.stderr.write(text);
      });

      child.on('close', (exitCode) => resolve(exitCode ?? 1));
      child.on('error', reject);
    });

    const endedAt = new Date();
    stream.write(`\n[${formatHuman(endedAt)}] END code=${code}\n`);
    stream.end();
    return { commandLine, code, output: mergedOutput, startedAt, endedAt, logPath };
  } catch (error) {
    stream.write(`\n[${formatHuman(new Date())}] ERROR ${error.message}\n`);
    stream.end();
    throw error;
  }
}

function parsePytestPassed(output) {
  const normalized = stripAnsi(output);
  const matches = [...normalized.matchAll(/(^|\n)(\d+)\s+passed(?:,[^\n]*)?\s+in\s+[0-9.]+s/gi)];
  if (matches.length === 0) {
    return null;
  }
  const last = matches[matches.length - 1];
  return Number(last[2]);
}

function parseWorkersSummary(output) {
  const normalized = stripAnsi(output);
  const filesMatch = normalized.match(/Test Files\s+(\d+)\s+passed/i);
  const testsMatch = normalized.match(/Tests\s+(\d+)\s+passed/i);
  if (!filesMatch || !testsMatch) {
    return null;
  }
  return {
    filesPassed: Number(filesMatch[1]),
    testsPassed: Number(testsMatch[1]),
  };
}

function stepStatus(code) {
  return code === 0 ? '通过' : '失败';
}

function buildStepSummary(step) {
  const parts = [];
  if (step.pytestPassed != null) {
    parts.push(`Python ${step.pytestPassed} passed`);
  }
  if (step.workersSummary) {
    parts.push(`Workers ${step.workersSummary.filesPassed} files / ${step.workersSummary.testsPassed} tests`);
  }
  return parts.length > 0 ? parts.join('；') : '-';
}

function buildReport({ sessionStartedAt, sessionEndedAt, includeStandaloneWorkers, steps }) {
  const timezone = formatTimezoneOffset(sessionEndedAt);
  const mode = includeStandaloneWorkers ? 'check + check:workers' : 'check';
  const overallPassed = steps.every((step) => step.code === 0);

  const lines = [
    '# 门禁执行摘要',
    '',
    `- 执行开始：${formatHuman(sessionStartedAt)} (${timezone})`,
    `- 执行结束：${formatHuman(sessionEndedAt)} (${timezone})`,
    `- 执行模式：${mode}`,
    `- 根目录：\`${rootDir}\``,
    `- 总结论：${overallPassed ? '通过，可用于文档同步' : '失败，禁止更新“通过”口径'}`,
    '',
    '## 步骤结果',
    '',
    '| 步骤 | 命令 | 状态 | 摘要 |',
    '|---|---|---|---|',
  ];

  for (const step of steps) {
    lines.push(`| ${step.name} | \`${step.commandLine}\` | ${stepStatus(step.code)} | ${buildStepSummary(step)} |`);
  }

  lines.push('');
  lines.push('## 日志文件');
  lines.push('');

  steps.forEach((step, index) => {
    lines.push(`${index + 1}. \`${step.logPath}\``);
  });

  lines.push('');
  lines.push('## 文档同步建议');
  lines.push('');
  lines.push('1. 将本摘要贴入“当前测试与验收总表”的当轮记录。');
  lines.push('2. 若结果失败，只能记录失败，不可写“已通过”。');

  return lines.join('\n');
}

async function main() {
  const includeStandaloneWorkers = process.argv.includes('--with-workers-standalone');
  const sessionStartedAt = new Date();
  const runId = formatId(sessionStartedAt);

  await mkdir(logsDir, { recursive: true });

  const steps = [];
  const npm = npmCommand();

  const checkStep = await runAndTee({
    command: npm,
    args: ['run', 'check'],
    logPath: path.join(logsDir, `${runId}-check.log`),
  });

  steps.push({
    name: 'check',
    ...checkStep,
    pytestPassed: parsePytestPassed(checkStep.output),
    workersSummary: parseWorkersSummary(checkStep.output),
  });

  if (includeStandaloneWorkers && checkStep.code === 0) {
    const workersStep = await runAndTee({
      command: npm,
      args: ['run', 'check:workers'],
      logPath: path.join(logsDir, `${runId}-check-workers.log`),
    });
    steps.push({
      name: 'check:workers',
      ...workersStep,
      pytestPassed: null,
      workersSummary: parseWorkersSummary(workersStep.output),
    });
  }

  const sessionEndedAt = new Date();
  const report = buildReport({
    sessionStartedAt,
    sessionEndedAt,
    includeStandaloneWorkers,
    steps,
  });

  const reportPath = path.join(logsDir, `${runId}-summary.md`);
  const latestPath = path.join(logsDir, 'latest-summary.md');
  await writeFile(reportPath, report, 'utf8');
  await writeFile(latestPath, report, 'utf8');

  console.log('');
  console.log(`门禁摘要已生成：${reportPath}`);
  console.log(`最新摘要固定路径：${latestPath}`);

  if (steps.some((step) => step.code !== 0)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

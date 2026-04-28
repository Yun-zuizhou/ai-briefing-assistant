import fs from 'node:fs';
import path from 'node:path';

import { edgeWorkerDir, rootDir } from './_shared.mjs';

const envPath = path.join(rootDir, '.env');
const devVarsPath = path.join(edgeWorkerDir, '.dev.vars');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const map = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1);
    map[key] = value;
  }
  return map;
}

function toLines(map) {
  return Object.entries(map).map(([key, value]) => `${key}=${value ?? ''}`);
}

function providerFields(provider) {
  const normalized = String(provider || '').trim().toLowerCase();
  switch (normalized) {
    case 'deepseek':
      return {
        apiKeyField: 'DEEPSEEK_API_KEY',
        apiUrlField: 'DEEPSEEK_API_URL',
        modelField: 'DEEPSEEK_MODEL',
      };
    case 'openai':
      return {
        apiKeyField: 'OPENAI_API_KEY',
        apiUrlField: 'OPENAI_API_URL',
        modelField: 'OPENAI_MODEL',
      };
    case 'nvidia':
      return {
        apiKeyField: 'NVIDIA_API_KEY',
        apiUrlField: 'NVIDIA_API_URL',
        modelField: 'NVIDIA_MODEL',
      };
    case 'anthropic':
      return {
        apiKeyField: 'ANTHROPIC_API_KEY',
        apiUrlField: 'ANTHROPIC_API_URL',
        modelField: 'ANTHROPIC_MODEL',
      };
    case 'gemini':
      return {
        apiKeyField: 'GEMINI_API_KEY',
        apiUrlField: 'GEMINI_API_URL',
        modelField: 'GEMINI_MODEL',
      };
    case 'zhipu':
      return {
        apiKeyField: 'ZHIPU_API_KEY',
        apiUrlField: 'ZHIPU_API_URL',
        modelField: 'ZHIPU_MODEL',
      };
    case 'qwen':
      return {
        apiKeyField: 'QWEN_API_KEY',
        apiUrlField: 'QWEN_API_URL',
        modelField: 'QWEN_MODEL',
      };
    case 'local':
      return {
        apiKeyField: 'LOCAL_API_KEY',
        apiUrlField: 'LOCAL_API_URL',
        modelField: 'LOCAL_MODEL',
      };
    default:
      return null;
  }
}

function hasConfiguredValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  if (normalized.startsWith('your-')) return false;
  return true;
}

function main() {
  const envMap = parseEnvFile(envPath);
  const devVarsMap = parseEnvFile(devVarsPath);

  if (!fs.existsSync(envPath)) {
    throw new Error('未找到根目录 .env，无法同步 AI Digest provider 配置。');
  }
  if (!fs.existsSync(devVarsPath)) {
    throw new Error('未找到 apps/edge-worker/.dev.vars，先执行 npm.cmd run setup。');
  }

  const provider = String(envMap.AI_PROVIDER || '').trim().toLowerCase();
  const fields = providerFields(provider);
  if (!fields) {
    throw new Error(`当前 AI_PROVIDER=${provider || '未配置'} 不在同步脚本支持范围内。当前仅支持 deepseek/openai/nvidia/anthropic/gemini/zhipu/qwen/local。`);
  }

  const apiKey = String(envMap[fields.apiKeyField] || '');
  const apiUrl = String(envMap[fields.apiUrlField] || '');
  const model = String(envMap[fields.modelField] || '');

  if (provider !== 'local' && !hasConfiguredValue(apiKey)) {
    throw new Error(`当前 AI_PROVIDER=${provider}，但 ${fields.apiKeyField} 为空，无法同步到 Workers consult 配置。`);
  }
  if (!hasConfiguredValue(apiUrl)) {
    throw new Error(`当前 ${fields.apiUrlField} 为空，无法同步到 Workers consult 配置。`);
  }
  if (!hasConfiguredValue(model)) {
    throw new Error(`当前 ${fields.modelField} 为空，无法同步到 Workers consult 配置。`);
  }

  const nextMap = {
    ...devVarsMap,
    SUMMARY_PROVIDER_ENABLED: 'true',
    SUMMARY_PROVIDER_API_URL: apiUrl,
    SUMMARY_PROVIDER_API_KEY: provider === 'local' ? '' : apiKey,
    SUMMARY_PROVIDER_MODEL: model,
  };

  const header = [
    '# Cloudflare Workers local-only variables.',
    '# `npm.cmd run setup` will copy this file to `apps/edge-worker/.dev.vars` if it does not exist.',
    '',
    '# Internal executor token for protected system write endpoints:',
    '# - POST /api/v1/system/ingestion-runs',
    '# - POST /api/v1/system/ai-processing-runs',
  ];

  const lines = [
    ...header,
    `INTERNAL_API_TOKEN=${nextMap.INTERNAL_API_TOKEN || 'dev-internal-token'}`,
    '',
    '# Optional summary / consult provider configuration for Workers read-side consult endpoint.',
    `SUMMARY_PROVIDER_ENABLED=${nextMap.SUMMARY_PROVIDER_ENABLED}`,
    `SUMMARY_PROVIDER_API_URL=${nextMap.SUMMARY_PROVIDER_API_URL || ''}`,
    `SUMMARY_PROVIDER_API_KEY=${nextMap.SUMMARY_PROVIDER_API_KEY || ''}`,
    `SUMMARY_PROVIDER_MODEL=${nextMap.SUMMARY_PROVIDER_MODEL || ''}`,
  ];

  fs.writeFileSync(devVarsPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Synced AI Digest consult provider from .env to ${path.relative(rootDir, devVarsPath)}.`);
  console.log(`- provider: ${provider}`);
  console.log(`- model: ${model}`);
  console.log(`- api url configured: ${hasConfiguredValue(apiUrl)}`);
  console.log(`- api key configured: ${provider === 'local' ? 'local-provider-no-key' : hasConfiguredValue(apiKey)}`);
}

main();

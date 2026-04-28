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
    const value = trimmed.slice(eq + 1).trim();
    map[key] = value;
  }
  return map;
}

function hasConfiguredValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  if (normalized.startsWith('your-')) return false;
  return true;
}

function providerKeyField(provider) {
  const normalized = String(provider || '').trim().toLowerCase();
  switch (normalized) {
    case 'deepseek':
      return 'DEEPSEEK_API_KEY';
    case 'openai':
      return 'OPENAI_API_KEY';
    case 'nvidia':
      return 'NVIDIA_API_KEY';
    case 'anthropic':
      return 'ANTHROPIC_API_KEY';
    case 'gemini':
      return 'GEMINI_API_KEY';
    case 'zhipu':
      return 'ZHIPU_API_KEY';
    case 'qwen':
      return 'QWEN_API_KEY';
    case 'local':
      return 'LOCAL_API_URL';
    default:
      return '';
  }
}

function providerUrlField(provider) {
  const normalized = String(provider || '').trim().toLowerCase();
  switch (normalized) {
    case 'deepseek':
      return 'DEEPSEEK_API_URL';
    case 'openai':
      return 'OPENAI_API_URL';
    case 'nvidia':
      return 'NVIDIA_API_URL';
    case 'anthropic':
      return 'ANTHROPIC_API_URL';
    case 'gemini':
      return 'GEMINI_API_URL';
    case 'zhipu':
      return 'ZHIPU_API_URL';
    case 'qwen':
      return 'QWEN_API_URL';
    case 'local':
      return 'LOCAL_API_URL';
    default:
      return '';
  }
}

function providerModelField(provider) {
  const normalized = String(provider || '').trim().toLowerCase();
  switch (normalized) {
    case 'deepseek':
      return 'DEEPSEEK_MODEL';
    case 'openai':
      return 'OPENAI_MODEL';
    case 'nvidia':
      return 'NVIDIA_MODEL';
    case 'anthropic':
      return 'ANTHROPIC_MODEL';
    case 'gemini':
      return 'GEMINI_MODEL';
    case 'zhipu':
      return 'ZHIPU_MODEL';
    case 'qwen':
      return 'QWEN_MODEL';
    case 'local':
      return 'LOCAL_MODEL';
    default:
      return '';
  }
}

function logCheck(label, ok, detail) {
  const prefix = ok ? '[ok]' : '[missing]';
  console.log(`${prefix} ${label}${detail ? `: ${detail}` : ''}`);
}

async function checkLocalProviderReachable(url) {
  if (!hasConfiguredValue(url)) {
    return { ok: false, detail: 'LOCAL_API_URL 未配置' };
  }
  try {
    const tagsUrl = String(url).replace(/\/api\/chat\s*$/i, '/api/tags');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(tagsUrl, { signal: controller.signal });
    clearTimeout(timer);
    return { ok: response.ok, detail: response.ok ? `reachable (${response.status})` : `unreachable (${response.status})` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : 'unknown error' };
  }
}

async function main() {
  const requireConsult = process.argv.includes('--require-consult');
  const envMap = parseEnvFile(envPath);
  const devVarsMap = parseEnvFile(devVarsPath);

  const failures = [];
  const warnings = [];

  console.log('AI Digest preflight');
  console.log(`- env file: ${fs.existsSync(envPath) ? '.env present' : '.env missing'}`);
  console.log(`- dev vars: ${fs.existsSync(devVarsPath) ? 'apps/edge-worker/.dev.vars present' : 'apps/edge-worker/.dev.vars missing'}`);

  const d1Fields = ['D1_ACCOUNT_ID', 'D1_DATABASE_ID', 'D1_API_TOKEN'];
  for (const field of d1Fields) {
    const ok = hasConfiguredValue(envMap[field]);
    logCheck(field, ok);
    if (!ok) failures.push(field);
  }

  const provider = envMap.AI_PROVIDER || '';
  const providerKey = providerKeyField(provider);
  const providerUrl = providerUrlField(provider);
  const providerModel = providerModelField(provider);
  const summaryDebugFallback = String(envMap.AI_DIGEST_DEBUG_FALLBACK || '').trim().toLowerCase();
  const summaryFallbackEnabled = ['1', 'true', 'yes', 'on'].includes(summaryDebugFallback);

  const providerRecognized = Boolean(provider && providerKey);
  logCheck('AI_PROVIDER', providerRecognized, provider || '未配置');
  if (!providerRecognized) {
    failures.push('AI_PROVIDER');
  }

  if (providerRecognized) {
    const keyOk = hasConfiguredValue(envMap[providerKey]);
    const urlOk = hasConfiguredValue(envMap[providerUrl]);
    const modelOk = hasConfiguredValue(envMap[providerModel]);

    logCheck(providerKey, keyOk);
    logCheck(providerUrl, urlOk);
    logCheck(providerModel, modelOk);

    if (!keyOk && !summaryFallbackEnabled) failures.push(providerKey);
    if (!urlOk) failures.push(providerUrl);
    if (!modelOk) failures.push(providerModel);

    if (!keyOk && summaryFallbackEnabled) {
      console.log('[warn] AI_DIGEST_DEBUG_FALLBACK 已启用，摘要执行将允许使用本地调试 fallback。');
    }

    if (String(provider).toLowerCase() === 'local') {
      const localCheck = await checkLocalProviderReachable(envMap.LOCAL_API_URL);
      const localOk = localCheck.ok;
      const localLabel = 'LOCAL provider reachability';
      console.log(`${localOk ? '[ok]' : '[warn]'} ${localLabel}: ${localCheck.detail}`);
      if (!localOk) warnings.push(localLabel);
    }
  }

  const consultEnabled = String(devVarsMap.SUMMARY_PROVIDER_ENABLED || '').trim().toLowerCase();
  const consultOn = ['1', 'true', 'yes', 'on'].includes(consultEnabled);
  const consultDebugEnabled = ['1', 'true', 'yes', 'on'].includes(String(devVarsMap.SUMMARY_PROVIDER_DEBUG_FALLBACK || '').trim().toLowerCase());
  console.log(`${consultOn ? '[ok]' : '[warn]'} SUMMARY_PROVIDER_ENABLED: ${consultEnabled || 'false / 未配置'}`);
  console.log(`${consultDebugEnabled ? '[warn]' : '[ok]'} SUMMARY_PROVIDER_DEBUG_FALLBACK: ${consultDebugEnabled}`);

  const consultFields = [
    'SUMMARY_PROVIDER_API_URL',
    'SUMMARY_PROVIDER_API_KEY',
    'SUMMARY_PROVIDER_MODEL',
  ];

  if (consultOn || requireConsult) {
    for (const field of consultFields) {
      const ok = hasConfiguredValue(devVarsMap[field]);
      logCheck(field, ok);
      if (!ok) {
        if (requireConsult) {
          failures.push(field);
        } else {
          warnings.push(field);
        }
      }
    }
  } else {
    console.log('[warn] consult provider 未启用，/api/v1/content/consult 当前会按设计返回配置错误');
  }

  if (!consultOn && consultDebugEnabled) {
    console.log('[warn] consult 当前将允许本地 debug fallback 返回明确标记的调试回答。');
  }

  if (failures.length > 0) {
    console.error(`AI Digest preflight failed: ${failures.join(', ')}`);
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log(`AI Digest preflight passed with warnings: ${warnings.join(', ')}`);
    return;
  }

  console.log('AI Digest preflight passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

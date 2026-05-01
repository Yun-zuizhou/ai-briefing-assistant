import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { rootDir } from './_shared.mjs';
import { checkUiActionContracts } from './check-ui-action-contracts.mjs';
import { checkUiGovernance } from './check-ui-governance.mjs';

const failures = [];

const sourceExtensions = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.json',
  '.css',
  '.html',
  '.md',
  '.py',
  '.sql',
]);

const ignoredDirNames = new Set([
  '.git',
  '.vite',
  'node_modules',
  '__pycache__',
  'dist',
  'build',
]);

function normalizeForLog(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, '/');
}

function addFailure(message) {
  failures.push(message);
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function listFiles(dirPath) {
  if (!(await exists(dirPath))) {
    return [];
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirNames.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function readText(filePath) {
  return readFile(filePath, 'utf8');
}

async function checkRetiredDemoPaths() {
  const retiredPaths = [
    'apps/web/demo/formal-ui-copy',
    'apps/web/demo/mock-data',
  ];

  for (const retiredPath of retiredPaths) {
    const fullPath = path.join(rootDir, retiredPath);
    const files = await listFiles(fullPath);
    const sourceFiles = files.filter((file) => sourceExtensions.has(path.extname(file)));
    if (sourceFiles.length > 0) {
      addFailure([
        `Retired demo path still contains source files: ${retiredPath}`,
        ...sourceFiles.slice(0, 10).map((file) => `  - ${normalizeForLog(file)}`),
      ].join('\n'));
    }
  }
}

async function checkFormalFrontendDoesNotImportDemo() {
  const srcDir = path.join(rootDir, 'apps/web/src');
  const files = (await listFiles(srcDir)).filter((file) => {
    if (!['.ts', '.tsx'].includes(path.extname(file))) {
      return false;
    }
    return !normalizeForLog(file).startsWith('apps/web/src/demo/');
  });

  const demoImportPattern = /(?:from\s+['"][^'"]*(?:\/|\.\.\/)demo(?:\/|['"])|import\(\s*['"][^'"]*(?:\/|\.\.\/)demo(?:\/|['"]))/;
  for (const file of files) {
    const text = await readText(file);
    if (demoImportPattern.test(text)) {
      addFailure(`Formal frontend source imports demo code: ${normalizeForLog(file)}`);
    }
  }
}

async function checkNoRuntimeImportFromPythonApp() {
  const runtimeRoots = [
    'apps/web',
    'apps/edge-worker',
    'packages',
  ];

  const runtimeImportPattern = /(?:from\s+['"][^'"]*(?:^|\/|\.\.\/)app(?:\/|['"])|require\(\s*['"][^'"]*(?:^|\/|\.\.\/)app(?:\/|['"])|import\(\s*['"][^'"]*(?:^|\/|\.\.\/)app(?:\/|['"]))/;
  for (const relativeRoot of runtimeRoots) {
    const files = (await listFiles(path.join(rootDir, relativeRoot))).filter((file) => {
      return ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'].includes(path.extname(file));
    });
    for (const file of files) {
      const text = await readText(file);
      if (runtimeImportPattern.test(text)) {
        addFailure(`Formal runtime source imports Python app code: ${normalizeForLog(file)}`);
      }
    }
  }
}

async function checkCloudflareEntrypoint() {
  const rootWrangler = path.join(rootDir, 'wrangler.toml');
  const rootWorker = path.join(rootDir, 'worker.js');
  const workerWrangler = path.join(rootDir, 'apps/edge-worker/wrangler.toml');

  if (await exists(rootWrangler)) {
    addFailure('Root wrangler.toml exists. Formal Cloudflare entrypoint must remain apps/edge-worker/wrangler.toml.');
  }
  if (await exists(rootWorker)) {
    addFailure('Root worker.js exists. Formal Worker source must remain under apps/edge-worker.');
  }
  if (!(await exists(workerWrangler))) {
    addFailure('Missing formal Cloudflare entrypoint: apps/edge-worker/wrangler.toml.');
  }

  const readme = await readText(path.join(rootDir, 'README.md'));
  if (!readme.includes('当前正式 Cloudflare 入口只认 `apps/edge-worker/wrangler.toml`')) {
    addFailure('README.md no longer states the single formal Cloudflare entrypoint.');
  }
}

async function checkContractReExportShims() {
  const shims = [
    'apps/web/src/types/page-data.ts',
    'apps/edge-worker/src/types/page-data.ts',
  ];

  for (const relativePath of shims) {
    const fullPath = path.join(rootDir, relativePath);
    const text = (await readText(fullPath)).trim();
    if (!text.includes('packages/contracts/src/page-data')) {
      addFailure(`${relativePath} no longer re-exports the shared contracts package.`);
    }
  }
}

async function checkSharedContractBoundaries() {
  const compatibilityBarrelPath = path.join(rootDir, 'packages/contracts/src/page-data.ts');
  const compatibilityBarrelText = await readText(compatibilityBarrelPath);
  const requiredDomains = [
    'common',
    'content',
    'dashboard',
    'chat',
    'behavior',
    'reports',
    'preferences',
    'system',
  ];

  if (/export\s+(?:interface|type)\s+/.test(compatibilityBarrelText)) {
    addFailure('packages/contracts/src/page-data.ts must remain a compatibility barrel; put contract definitions in packages/contracts/src/page-data/<domain>.ts.');
  }

  for (const domain of requiredDomains) {
    const domainPath = path.join(rootDir, `packages/contracts/src/page-data/${domain}.ts`);
    if (!(await exists(domainPath))) {
      addFailure(`Missing shared contract domain file: packages/contracts/src/page-data/${domain}.ts.`);
    }
    if (!compatibilityBarrelText.includes(`./page-data/${domain}`)) {
      addFailure(`packages/contracts/src/page-data.ts must re-export the ${domain} contract domain.`);
    }
  }

  const packageJsonText = await readText(path.join(rootDir, 'packages/contracts/package.json'));
  if (!packageJsonText.includes('"./page-data/*"')) {
    addFailure('packages/contracts/package.json must expose domain contract subpaths through ./page-data/*.');
  }
}

async function checkFrontendApiServiceBoundaries() {
  const apiServicePath = path.join(rootDir, 'apps/web/src/services/api.ts');
  const apiValidationPath = path.join(rootDir, 'apps/web/src/services/apiValidation.ts');
  const apiPayloadsPath = path.join(rootDir, 'apps/web/src/services/apiPayloads.ts');
  const apiGuardsPath = path.join(rootDir, 'apps/web/src/services/apiGuards.ts');
  const apiGuardDomainDir = path.join(rootDir, 'apps/web/src/services/apiGuards');
  const apiDomainDir = path.join(rootDir, 'apps/web/src/services/apiDomains');
  const apiDomainReadmePath = path.join(apiDomainDir, 'README.md');
  const apiServiceText = await readText(apiServicePath);
  const apiGuardsText = await readText(apiGuardsPath);
  const apiGuardDomains = [
    'dashboard',
    'content',
    'behavior',
    'reports',
    'preferences',
    'system',
    'chat',
  ];
  const apiDomains = [
    'auth',
    'behavior',
    'chat',
    'content',
    'dashboard',
    'preferences',
    'reports',
    'system',
  ];

  if (!(await exists(apiValidationPath))) {
    addFailure('Missing frontend API validation module: apps/web/src/services/apiValidation.ts.');
  }
  if (!(await exists(apiPayloadsPath))) {
    addFailure('Missing frontend API payload module: apps/web/src/services/apiPayloads.ts.');
  }
  if (!(await exists(apiGuardsPath))) {
    addFailure('Missing frontend API guard module: apps/web/src/services/apiGuards.ts.');
  }
  for (const domain of apiGuardDomains) {
    const domainPath = path.join(apiGuardDomainDir, `${domain}.ts`);
    if (!(await exists(domainPath))) {
      addFailure(`Missing frontend API guard domain module: apps/web/src/services/apiGuards/${domain}.ts.`);
    }
    if (!apiGuardsText.includes(`./apiGuards/${domain}`)) {
      addFailure(`apps/web/src/services/apiGuards.ts must re-export the ${domain} API guard domain.`);
    }
  }
  if (/export\s+function\s+is[A-Z]/.test(apiGuardsText) || /function\s+is[A-Z]/.test(apiGuardsText)) {
    addFailure('apps/web/src/services/apiGuards.ts must remain a compatibility barrel; put guard implementations in apps/web/src/services/apiGuards/<domain>.ts.');
  }
  if (!(await exists(apiDomainReadmePath))) {
    addFailure('Missing frontend API domain placement guide: apps/web/src/services/apiDomains/README.md.');
  }
  for (const domain of apiDomains) {
    const domainPath = path.join(apiDomainDir, `${domain}.ts`);
    if (!(await exists(domainPath))) {
      addFailure(`Missing frontend API implementation domain module: apps/web/src/services/apiDomains/${domain}.ts.`);
    }
    if (!apiServiceText.includes(`./apiDomains/${domain}`)) {
      addFailure(`apps/web/src/services/api.ts must delegate to the ${domain} API implementation domain.`);
    }
  }
  if (!apiServiceText.includes("from './apiPayloads'")) {
    addFailure('apps/web/src/services/api.ts no longer imports/re-exports shared API payload types.');
  }
  if (apiServiceText.includes("from './apiGuards'")) {
    addFailure('apps/web/src/services/api.ts must stay a facade; import API response guards from apps/web/src/services/apiDomains/<domain>.ts instead.');
  }
  if (apiServiceText.includes("from './apiValidation'")) {
    addFailure('apps/web/src/services/api.ts must stay a facade; import API validation helpers from apps/web/src/services/apiDomains/<domain>.ts instead.');
  }
  if (apiServiceText.includes("from './apiUrl'")) {
    addFailure('apps/web/src/services/api.ts must stay a facade; build endpoint URLs inside apps/web/src/services/apiDomains/<domain>.ts.');
  }
  if (/function\s+validateApiResponse\b/.test(apiServiceText)) {
    addFailure('apps/web/src/services/api.ts must not redefine validateApiResponse; keep it in apiValidation.ts.');
  }
  if (/^export\s+interface\s+(Auth|User|Daily|Digest|Summary|Briefing|Llm|Feedback|Favorite|Note|Intent)/m.test(apiServiceText)) {
    addFailure('apps/web/src/services/api.ts must not own API payload interfaces; keep them in apiPayloads.ts.');
  }
  if (/function\s+is[A-Z]/.test(apiServiceText)) {
    addFailure('apps/web/src/services/api.ts must not own API response guard functions; keep them in apiGuards.ts.');
  }
}

async function checkWorkerDashboardBoundaries() {
  const dashboardRoutePath = path.join(rootDir, 'apps/edge-worker/src/routes/dashboard.ts');
  const dashboardPublicApiPath = path.join(rootDir, 'apps/edge-worker/src/services/dashboard/index.ts');
  const dashboardPageServicePath = path.join(rootDir, 'apps/edge-worker/src/services/dashboard/today-page.ts');
  const dashboardContentServicePath = path.join(rootDir, 'apps/edge-worker/src/services/dashboard/today-content.ts');
  const dashboardPayloadServicePath = path.join(rootDir, 'apps/edge-worker/src/services/dashboard/today-briefing-payload.ts');
  const dashboardStoreServicePath = path.join(rootDir, 'apps/edge-worker/src/services/dashboard/today-briefing-store.ts');
  const dashboardGenerationServicePath = path.join(rootDir, 'apps/edge-worker/src/services/dashboard/today-briefing-generation.ts');
  const dashboardRouteText = await readText(dashboardRoutePath);
  const dashboardPublicApiText = await readText(dashboardPublicApiPath);

  if (!(await exists(dashboardPageServicePath))) {
    addFailure('Missing Today page loader module: apps/edge-worker/src/services/dashboard/today-page.ts.');
  }
  if (!(await exists(dashboardContentServicePath))) {
    addFailure('Missing Today content builder module: apps/edge-worker/src/services/dashboard/today-content.ts.');
  }
  if (!(await exists(dashboardPayloadServicePath))) {
    addFailure('Missing Today briefing payload module: apps/edge-worker/src/services/dashboard/today-briefing-payload.ts.');
  }
  if (!(await exists(dashboardStoreServicePath))) {
    addFailure('Missing Today briefing store module: apps/edge-worker/src/services/dashboard/today-briefing-store.ts.');
  }
  if (!(await exists(dashboardGenerationServicePath))) {
    addFailure('Missing Today briefing generation module: apps/edge-worker/src/services/dashboard/today-briefing-generation.ts.');
  }
  if (/export\s+\*/.test(dashboardPublicApiText)) {
    addFailure('apps/edge-worker/src/services/dashboard/index.ts must explicitly export the public dashboard API; wildcard exports blur internal boundaries.');
  }
  if (/export\s+\{[^}]*\b(?:buildRecommendations|buildWorthKnowing|buildWorthActing|parseBriefingPayload|normalizeAiBriefing|normalizeLeadItem|normalizeExtensionSlots|buildFallbackLeadItem|buildFallbackExtensionSlots|buildBriefingPayload|getLatestReadyBriefingPayload|getTodayReadyBriefingPayload|upsertTodayBriefing|listActiveMorningBriefingSchedules|recordBriefingCronDispatch|generateAndPersistTodayBriefingForUser)\b/s.test(dashboardPublicApiText)) {
    addFailure('apps/edge-worker/src/services/dashboard/index.ts exports internal dashboard helpers. Keep the public API to page loading and scheduler entrypoints.');
  }
  if (!dashboardRouteText.includes('loadTodayPageData')) {
    addFailure('apps/edge-worker/src/routes/dashboard.ts must load Today data through loadTodayPageData().');
  }
  if (!dashboardRouteText.includes("from '../services/dashboard'")) {
    addFailure('apps/edge-worker/src/routes/dashboard.ts must depend on the explicit dashboard service public API.');
  }
  if (/from\s+['"]\.\.\/services\/(?:content|dashboard\/today-[^'"]+)['"]/.test(dashboardRouteText)) {
    addFailure('apps/edge-worker/src/routes/dashboard.ts must not import dashboard internals or content services directly.');
  }
  if (/function\s+build(?:Recommendations|WorthKnowing|WorthActing)\b/.test(dashboardRouteText)) {
    addFailure('apps/edge-worker/src/routes/dashboard.ts must not own Today content builder functions; keep them in services/dashboard.');
  }
  if (/function\s+(?:parsePayload|normalizeAiBriefing|normalizeLeadItem|normalizeExtensionSlots|buildFallbackLeadItem|buildFallbackExtensionSlots|buildBriefingPayload)\b/.test(dashboardRouteText)) {
    addFailure('apps/edge-worker/src/routes/dashboard.ts must not own Today briefing payload normalization or fallback builders; keep them in services/dashboard.');
  }
  if (/function\s+(?:getLatestReadyBriefingPayload|getTodayReadyBriefingPayload|upsertTodayBriefing|listActiveMorningBriefingSchedules|recordBriefingCronDispatch)\b/.test(dashboardRouteText)) {
    addFailure('apps/edge-worker/src/routes/dashboard.ts must not own Today briefing database access; keep it in services/dashboard.');
  }
  if (/function\s+(?:tryGenerateTodayBriefing|generateAndPersistTodayBriefingForUser|runTodayBriefingCron)\b/.test(dashboardRouteText)) {
    addFailure('apps/edge-worker/src/routes/dashboard.ts must not own Today briefing generation or cron orchestration; keep it in services/dashboard.');
  }
}

async function checkWorkerChatBoundaries() {
  const chatRoutePath = path.join(rootDir, 'apps/edge-worker/src/routes/chat.ts');
  const chatPublicApiPath = path.join(rootDir, 'apps/edge-worker/src/services/chat/index.ts');
  const chatFlowPath = path.join(rootDir, 'apps/edge-worker/src/services/chat/flow.ts');
  const chatContractsPath = path.join(rootDir, 'packages/contracts/src/page-data/chat.ts');
  const webApiPath = path.join(rootDir, 'apps/web/src/services/api.ts');
  const webChatHookPath = path.join(rootDir, 'apps/web/src/hooks/useChatLogic.ts');
  const webChatStreamPath = path.join(rootDir, 'apps/web/src/hooks/chat/chatStreamEvents.ts');
  const webChatTransitionsPath = path.join(rootDir, 'apps/web/src/hooks/chat/chatStateTransitions.ts');
  const chatRouteText = await readText(chatRoutePath);
  const chatPublicApiText = await readText(chatPublicApiPath);
  const chatFlowText = await readText(chatFlowPath);
  const chatContractsText = await readText(chatContractsPath);
  const webApiText = await readText(webApiPath);
  const webChatHookText = await readText(webChatHookPath);
  const webChatStreamText = await readText(webChatStreamPath);

  if (!(await exists(chatFlowPath))) {
    addFailure('Missing Chat flow module: apps/edge-worker/src/services/chat/flow.ts.');
  }
  if (!(await exists(webChatTransitionsPath))) {
    addFailure('Missing frontend Chat state transition module: apps/web/src/hooks/chat/chatStateTransitions.ts.');
  }
  if (!chatContractsText.includes('ChatStreamEventPayloadMap') || !chatContractsText.includes('ChatMessageStreamRequest')) {
    addFailure('Shared Chat contract domain must own request and SSE event protocol types in packages/contracts/src/page-data/chat.ts.');
  }
  if (!chatFlowText.includes("from '../../types/page-data'")) {
    addFailure('apps/edge-worker/src/services/chat/flow.ts must use shared Chat protocol contracts from ../../types/page-data.');
  }
  if (/export\s+type\s+Chat(?:MessageStream|Confirm|Reclassify)Request\s*=/.test(chatFlowText)) {
    addFailure('apps/edge-worker/src/services/chat/flow.ts must not redefine Chat request protocol types; keep them in shared contracts.');
  }
  if (/sendChatMessage\(data:\s*\{/.test(webApiText) || /confirmChat\(data:\s*\{/.test(webApiText) || /reclassifyChat\(data:\s*\{/.test(webApiText)) {
    addFailure('apps/web/src/services/api.ts must not inline Chat request protocol shapes; import shared contract types.');
  }
  if (!webChatStreamText.includes("from '../../types/page-data'")) {
    addFailure('apps/web/src/hooks/chat/chatStreamEvents.ts must parse Chat SSE events against shared protocol contracts.');
  }
  if (!webChatHookText.includes("from './chat/chatStateTransitions'")) {
    addFailure('apps/web/src/hooks/useChatLogic.ts must delegate Chat stream state transitions to chatStateTransitions.ts.');
  }
  if (/case\s+['"](?:intent_analysis|pending_confirmation|execution_result|error|done)['"]/.test(webChatHookText)) {
    addFailure('apps/web/src/hooks/useChatLogic.ts must not own Chat SSE event cases; keep event state transitions in chatStateTransitions.ts.');
  }
  if (/export\s+\*/.test(chatPublicApiText)) {
    addFailure('apps/edge-worker/src/services/chat/index.ts must explicitly export the public chat API; wildcard exports blur internal boundaries.');
  }
  if (!chatRouteText.includes('createChatMessageStream')) {
    addFailure('apps/edge-worker/src/routes/chat.ts must stream chat messages through createChatMessageStream().');
  }
  if (!chatRouteText.includes('confirmChatMessage')) {
    addFailure('apps/edge-worker/src/routes/chat.ts must confirm chat actions through confirmChatMessage().');
  }
  if (!chatRouteText.includes('reclassifyChatMessage')) {
    addFailure('apps/edge-worker/src/routes/chat.ts must reclassify chat actions through reclassifyChatMessage().');
  }
  if (/from\s+['"]\.\.\/services\/(?:behavior|ai-provider|ai-key-crypto|chat\/(?:actions|intent|llm-classify|llm-reply|context|store|types))['"]/.test(chatRouteText)) {
    addFailure('apps/edge-worker/src/routes/chat.ts must not import chat internals or provider plumbing directly.');
  }
  if (/function\s+(?:sendSSE|resolveChatProviderConfig|buildIntentAnalysisText|buildAssistantReplyText|buildSuggestedActions|intentLabel)\b/.test(chatRouteText)) {
    addFailure('apps/edge-worker/src/routes/chat.ts must not own chat protocol/helper logic; keep it in services/chat.');
  }
  if (/\b(?:parseIntent|classifyIntent|generateChatReply|appendChatMessage|executeConfirmedChatAction|reclassifyChatAction|buildChatReplyContext)\b/.test(chatRouteText)) {
    addFailure('apps/edge-worker/src/routes/chat.ts must not orchestrate chat intent, persistence, or LLM calls directly; use services/chat public API.');
  }
}

async function checkWorkerReportsBoundaries() {
  const reportsRoutePath = path.join(rootDir, 'apps/edge-worker/src/routes/reports.ts');
  const reportsPublicApiPath = path.join(rootDir, 'apps/edge-worker/src/services/reports/index.ts');
  const reportsFlowPath = path.join(rootDir, 'apps/edge-worker/src/services/reports/flow.ts');
  const reportsRouteText = await readText(reportsRoutePath);
  const reportsPublicApiText = await readText(reportsPublicApiPath);

  if (!(await exists(reportsFlowPath))) {
    addFailure('Missing Reports flow module: apps/edge-worker/src/services/reports/flow.ts.');
  }
  if (/export\s+\*/.test(reportsPublicApiText)) {
    addFailure('apps/edge-worker/src/services/reports/index.ts must explicitly export the public reports API; wildcard exports blur internal boundaries.');
  }
  if (!reportsRouteText.includes("from '../services/reports'")) {
    addFailure('apps/edge-worker/src/routes/reports.ts must depend on the explicit reports service public API.');
  }
  for (const publicFunction of ['listReportSummaries', 'loadPeriodicReport', 'loadAnnualReport']) {
    if (!reportsRouteText.includes(publicFunction)) {
      addFailure(`apps/edge-worker/src/routes/reports.ts must use ${publicFunction}() from the reports service flow.`);
    }
  }
  if (/from\s+['"]\.\.\/services\/(?:ai-key-crypto|ai-provider|behavior|content|llm-invocations|reference-registry|reports\/(?:builder|llm-blocks|store))['"]/.test(reportsRouteText)) {
    addFailure('apps/edge-worker/src/routes/reports.ts must not import report internals, provider plumbing, quota checks, or source readers directly.');
  }
  if (/function\s+(?:extractReportEvidenceRefs|mergeReportBlocks|mergeAnnualReportBlocks|tryGeneratePeriodicReportBlocks|tryGenerateAnnualReportBlocks|buildPeriodicReport|buildAnnualReport)\b/.test(reportsRouteText)) {
    addFailure('apps/edge-worker/src/routes/reports.ts must not own report generation helpers; keep them in services/reports/flow.ts.');
  }
  if (/\b(?:generateReportBlocks|generateAnnualReportBlocks|upsertReportResult|listReportSourceNotes|listReportSourceFavorites|listReportSourceTodos|listReportSourceHistory|checkLlmSoftQuota|resolveStoredAiApiKey|resolveUserAiProviderConfig|getUserSettings)\b/.test(reportsRouteText)) {
    addFailure('apps/edge-worker/src/routes/reports.ts must not orchestrate report sources, LLM provider setup, quota, or persistence directly; use services/reports public API.');
  }
}

async function checkWorkerPreferencesBoundaries() {
  const preferencesRoutePath = path.join(rootDir, 'apps/edge-worker/src/routes/preferences.ts');
  const preferencesPublicApiPath = path.join(rootDir, 'apps/edge-worker/src/services/preferences/index.ts');
  const preferencesFlowPath = path.join(rootDir, 'apps/edge-worker/src/services/preferences/flow.ts');
  const preferencesRouteText = await readText(preferencesRoutePath);
  const preferencesPublicApiText = await readText(preferencesPublicApiPath);

  if (!(await exists(preferencesFlowPath))) {
    addFailure('Missing Preferences flow module: apps/edge-worker/src/services/preferences/flow.ts.');
  }
  if (/export\s+\*/.test(preferencesPublicApiText)) {
    addFailure('apps/edge-worker/src/services/preferences/index.ts must explicitly export the public preferences API; wildcard exports blur internal boundaries.');
  }
  if (!preferencesRouteText.includes("from '../services/preferences'")) {
    addFailure('apps/edge-worker/src/routes/preferences.ts must use the explicit preferences service public API for profile and growth flows.');
  }
  for (const publicFunction of ['loadUserProfile', 'generateUserProfileForUser', 'loadGrowthOverview']) {
    if (!preferencesRouteText.includes(publicFunction)) {
      addFailure(`apps/edge-worker/src/routes/preferences.ts must use ${publicFunction}() from the preferences service flow.`);
    }
  }
  if (/from\s+['"]\.\.\/services\/(?:ai-key-crypto|ai-provider|llm-invocations|profile-generation|reports)['"]/.test(preferencesRouteText)) {
    addFailure('apps/edge-worker/src/routes/preferences.ts must not import profile generation, reports source readers, provider plumbing, or quota checks directly.');
  }
  if (/function\s+(?:parseProfileData|parseEvidenceRefs)\b/.test(preferencesRouteText)) {
    addFailure('apps/edge-worker/src/routes/preferences.ts must not own profile parsing helpers; keep them in services/preferences/flow.ts.');
  }
  if (/\b(?:generateUserProfile|getLatestUserProfile|checkLlmSoftQuota|resolveStoredAiApiKey|resolveUserAiProviderConfig|listReportSourceNotes|listReportSourceFavorites|listReportSourceTodos|listReportSourceHistory|buildRecentHistoryItems|buildRadarMetrics|buildPersonaSummary|buildGrowthKeywords|getProfileCounts|getActivityStreak|getLatestBriefing|getLatestNote|getLatestOpportunityFollow)\b/.test(preferencesRouteText)) {
    addFailure('apps/edge-worker/src/routes/preferences.ts must not assemble profile/growth flows directly; use services/preferences public API.');
  }
}

async function checkWorkerCoreServiceBarrels() {
  const serviceDomains = [
    'behavior',
    'chat',
    'content',
    'dashboard',
    'preferences',
    'reports',
    'system',
  ];

  for (const domain of serviceDomains) {
    const publicApiPath = path.join(rootDir, `apps/edge-worker/src/services/${domain}/index.ts`);
    const publicApiText = await readText(publicApiPath);
    if (/export\s+\*/.test(publicApiText)) {
      addFailure(`apps/edge-worker/src/services/${domain}/index.ts must explicitly export its public API; wildcard exports blur service boundaries.`);
    }
    if (!publicApiText.includes(`Public ${domain[0].toUpperCase()}${domain.slice(1)} service API`)) {
      addFailure(`apps/edge-worker/src/services/${domain}/index.ts must describe the service boundary for future maintainers.`);
    }
  }

  const rootServicesPath = path.join(rootDir, 'apps/edge-worker/src/services/index.ts');
  const rootServicesText = await readText(rootServicesPath);
  if (/export\s+\*/.test(rootServicesText)) {
    addFailure('apps/edge-worker/src/services/index.ts must not use wildcard namespace exports; import and re-export domain public APIs explicitly.');
  }
  for (const domain of serviceDomains) {
    if (!rootServicesText.includes(`* as ${domain}`)) {
      addFailure(`apps/edge-worker/src/services/index.ts must expose the ${domain} service namespace explicitly.`);
    }
  }

  const servicesReadmeText = await readText(path.join(rootDir, 'apps/edge-worker/src/services/README.md'));
  for (const domain of serviceDomains) {
    if (!servicesReadmeText.includes(`- \`${domain}/\``)) {
      addFailure(`apps/edge-worker/src/services/README.md must list the ${domain} service domain.`);
    }
    if (!servicesReadmeText.includes(`### \`${domain}\``)) {
      addFailure(`apps/edge-worker/src/services/README.md must describe the ${domain} service boundary.`);
    }
  }

  const routeFiles = (await listFiles(path.join(rootDir, 'apps/edge-worker/src/routes'))).filter((file) => {
    return path.extname(file) === '.ts';
  });
  for (const routeFile of routeFiles) {
    const text = await readText(routeFile);
    if (/from\s+['"]\.\.\/services\/(?:behavior|content|system)\//.test(text)) {
      addFailure(`${normalizeForLog(routeFile)} must import behavior/content/system through the domain public API, not service internals.`);
    }
  }
}

async function checkCodeTemplates() {
  const requiredTemplates = [
    'tools/templates/README.md',
    'tools/templates/manifest.json',
    'tools/templates/page/Page.template.tsx',
    'tools/templates/page/usePageLogic.template.ts',
    'tools/templates/page/PageStyle.template.css',
    'tools/templates/information-page/InformationPage.template.tsx',
    'tools/templates/information-page/useInformationPageLogic.template.ts',
    'tools/templates/information-page/InformationPageStyle.template.css',
    'tools/templates/mutation-page/MutationPage.template.tsx',
    'tools/templates/mutation-page/useMutationPageLogic.template.ts',
    'tools/templates/mutation-page/MutationPageStyle.template.css',
    'tools/templates/component/BusinessComponent.template.tsx',
    'tools/templates/component/UiComponent.template.tsx',
    'tools/templates/component/LayoutComponent.template.tsx',
    'tools/templates/api/apiDomain.template.ts',
    'tools/templates/api/apiGuard.template.ts',
    'tools/templates/api/pageContract.template.ts',
    'tools/templates/worker/route.template.ts',
    'tools/templates/worker/service.template.ts',
  ];

  const manifestPath = path.join(rootDir, 'tools/templates/manifest.json');
  const manifest = JSON.parse(await readText(manifestPath));
  const documentedTokens = new Set(Object.keys(manifest.replacementTokens || {}));
  const seenTemplateSetIds = new Set();

  if (!Array.isArray(manifest.sets) || manifest.sets.length === 0) {
    addFailure('tools/templates/manifest.json must define at least one template set.');
  }

  for (const templateSet of manifest.sets || []) {
    if (!templateSet.id) {
      addFailure('Every template set in tools/templates/manifest.json must have an id.');
      continue;
    }
    if (seenTemplateSetIds.has(templateSet.id)) {
      addFailure(`Duplicate template set id in tools/templates/manifest.json: ${templateSet.id}.`);
    }
    seenTemplateSetIds.add(templateSet.id);

    if (!Array.isArray(templateSet.requiredTokens) || templateSet.requiredTokens.length === 0) {
      addFailure(`Template set ${templateSet.id} must declare requiredTokens.`);
    }
    for (const token of templateSet.requiredTokens || []) {
      if (!documentedTokens.has(token)) {
        addFailure(`Template set ${templateSet.id} uses undocumented replacement token ${token}.`);
      }
    }

    if (!Array.isArray(templateSet.files) || templateSet.files.length === 0) {
      addFailure(`Template set ${templateSet.id} must declare generated files.`);
      continue;
    }

    const templateSetTextParts = [];
    for (const file of templateSet.files) {
      if (!file.template || !file.output) {
        addFailure(`Template set ${templateSet.id} has a file entry without template or output.`);
        continue;
      }
      const templatePath = path.join(rootDir, 'tools/templates', file.template);
      if (!(await exists(templatePath))) {
        addFailure(`Template set ${templateSet.id} points to missing template: ${file.template}.`);
        continue;
      }
      templateSetTextParts.push(file.output, await readText(templatePath));
    }

    const templateSetText = templateSetTextParts.join('\n');
    for (const token of templateSet.requiredTokens || []) {
      if (!templateSetText.includes(token)) {
        addFailure(`Template set ${templateSet.id} does not use required token ${token} in any template or output path.`);
      }
    }
  }

  for (const relativePath of requiredTemplates) {
    const fullPath = path.join(rootDir, relativePath);
    if (!(await exists(fullPath))) {
      addFailure(`Missing managed code template: ${relativePath}.`);
      continue;
    }

    const text = await readText(fullPath);
    if (!['tools/templates/README.md', 'tools/templates/manifest.json'].includes(relativePath) && !/__[A-Za-z]+__/.test(text)) {
      addFailure(`${relativePath} must keep at least one documented replacement token.`);
    }
  }

  const readmeText = await readText(path.join(rootDir, 'tools/templates/README.md'));
  for (const token of ['__Feature__', '__feature__', '__Domain__', '__domain__', '__RouteBase__']) {
    if (!readmeText.includes(token)) {
      addFailure(`tools/templates/README.md must document the ${token} replacement token.`);
    }
  }

  const packageJsonText = await readText(path.join(rootDir, 'package.json'));
  if (!packageJsonText.includes('"generate:template": "node tools/scripts/generate-template.mjs"')) {
    addFailure('package.json must expose the managed template generator as generate:template.');
  }

  if (!seenTemplateSetIds.has('information-page')) {
    addFailure('tools/templates/manifest.json must expose the information-page template set for information-dense pages.');
  }
  if (!readmeText.includes('information-page')) {
    addFailure('tools/templates/README.md must document the information-page template set.');
  }
}

async function main() {
  await checkRetiredDemoPaths();
  await checkFormalFrontendDoesNotImportDemo();
  await checkNoRuntimeImportFromPythonApp();
  await checkCloudflareEntrypoint();
  await checkContractReExportShims();
  await checkSharedContractBoundaries();
  await checkFrontendApiServiceBoundaries();
  await checkWorkerDashboardBoundaries();
  await checkWorkerChatBoundaries();
  await checkWorkerReportsBoundaries();
  await checkWorkerPreferencesBoundaries();
  await checkWorkerCoreServiceBarrels();
  await checkCodeTemplates();
  await checkUiActionContracts(addFailure);
  await checkUiGovernance(addFailure);

  if (failures.length > 0) {
    console.error('Governance check failed:');
    for (const failure of failures) {
      console.error(`\n- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Governance check passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

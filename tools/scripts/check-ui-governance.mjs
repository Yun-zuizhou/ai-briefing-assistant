import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rootDir } from './_shared.mjs';

const ignoredDirNames = new Set(['.git', '.vite', 'node_modules', 'dist', 'build']);

function normalizeForLog(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, '/');
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

function countIndexClassSelectors(indexCssText) {
  return indexCssText
    .split(/\r?\n/)
    .filter((line) => /^\.[A-Za-z0-9_-]/.test(line.trim()))
    .length;
}

function countIndexNonImportLines(indexCssText) {
  const lines = indexCssText.split(/\r?\n/);
  const lastImportIndex = lines.reduce((lastIndex, line, index) => {
    return line.trim().startsWith('@import') ? index : lastIndex;
  }, -1);
  return lines
    .slice(lastImportIndex + 1)
    .filter((line) => line.trim().length > 0)
    .length;
}

function getRelativeStyleImports(indexCssText) {
  return indexCssText
    .split(/\r?\n/)
    .map((line) => line.trim().match(/^@import\s+['"](\.\/styles\/[^'"]+\.css)['"];?$/)?.[1])
    .filter(Boolean);
}

function checkIndexStyleInterface(indexCssText, addFailure) {
  const expectedImports = [
    './styles/foundation.css',
    './styles/shell.css',
    './styles/navigation.css',
    './styles/surfaces.css',
    './styles/status-ui.css',
    './styles/decor-frame.css',
    './styles/auth-pages.css',
    './styles/my-pages.css',
    './styles/journal-feedback.css',
    './styles/help-about.css',
    './styles/hot-topics.css',
    './styles/article-page.css',
    './styles/today-page.css',
    './styles/chat-page.css',
    './styles/actions-page.css',
    './styles/history-pages.css',
    './styles/ai-digest.css',
    './styles/diagnostics-page.css',
    './styles/report-pages.css',
    './styles/preferences-pages.css',
    './styles/insights-pages.css',
  ];
  const actualImports = getRelativeStyleImports(indexCssText);

  if (actualImports.join('\n') !== expectedImports.join('\n')) {
    addFailure([
      'apps/web/src/index.css style imports no longer match the governed style interface.',
      'Keep foundation styles before page styles; preview styles must be route-owned by their preview page.',
      `Expected: ${expectedImports.join(', ')}`,
      `Actual: ${actualImports.join(', ')}`,
    ].join('\n'));
  }

  const bannedEntrypointSelectors = [
    'domain-card',
    'domain-header',
    'article-list',
    'article-item',
    'chat-input',
    'newspaper-search',
    'collection-card',
    'domain-footer',
    'app-route-fallback',
    'app-routes-shell',
    'trending-scroll',
    'trending-item',
    'domain-tabs',
    'domain-tab',
  ];
  const leakedEntrypointSelector = bannedEntrypointSelectors.find((selector) => {
    return new RegExp(`^\\.${selector}\\b`, 'm').test(indexCssText);
  });
  if (leakedEntrypointSelector) {
    addFailure(`Selector .${leakedEntrypointSelector} does not belong in apps/web/src/index.css. Move it to its owning style layer or delete it if unused.`);
  }
}

async function collectCssFiles() {
  const stylesDir = path.join(rootDir, 'apps/web/src/styles');
  const indexCssPath = path.join(rootDir, 'apps/web/src/index.css');
  const styleCssFiles = (await listFiles(stylesDir)).filter((file) => path.extname(file) === '.css');
  return [indexCssPath, ...styleCssFiles];
}

function findFilesContaining(filesWithText, pattern) {
  return filesWithText
    .filter(({ text }) => pattern.test(text))
    .map(({ file }) => normalizeForLog(file))
    .sort();
}

function addLimitFailure(addFailure, name, current, limit) {
  if (current > limit) {
    addFailure(`UI governance ${name} increased from baseline: ${current} > ${limit}. Reduce debt or update the architecture deliberately before raising the baseline.`);
  }
}

function requireTextTokens(addFailure, owner, text, tokens) {
  for (const token of tokens) {
    if (!text.includes(token)) {
      addFailure(`${owner} must include ${token}.`);
    }
  }
}

async function checkBusinessGovernance(addFailure) {
  const businessDir = path.join(rootDir, 'apps/web/src/components/business');
  const registryPath = path.join(businessDir, 'business-governance.json');
  if (!(await exists(registryPath))) {
    addFailure('Missing business component governance registry: apps/web/src/components/business/business-governance.json.');
    return;
  }

  const registry = JSON.parse(await readText(registryPath));
  const rules = registry.rules || {};
  const governance = registry.governance || {};
  const largeFileBytes = rules.largeFileBytes || 8000;
  const facadeMaxBytes = rules.facadeMaxBytes || 1600;
  const directFiles = registry.directFiles || {};
  const activeCandidates = new Set(governance.activeCandidates || []);
  const deferredCandidates = new Set(governance.deferredCandidates || []);
  const knownCandidates = new Set([...activeCandidates, ...deferredCandidates]);
  if (governance.mode === 'stabilize') {
    if (activeCandidates.size === 0) {
      addFailure('Business governance stabilize mode must declare activeCandidates.');
    }
    if (activeCandidates.size > 3) {
      addFailure('Business governance stabilize mode allows at most 3 activeCandidates; defer the rest to avoid open-ended refactoring.');
    }
    if (!Array.isArray(governance.packageCriteria) || governance.packageCriteria.length < 3) {
      addFailure('Business governance stabilize mode must declare packageCriteria before upgrading more files into packages.');
    }
  }
  const businessFiles = (await listFiles(businessDir))
    .filter((file) => path.dirname(file) === businessDir && path.extname(file) === '.tsx')
    .map((file) => ({
      file,
      name: path.basename(file),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const { file, name } of businessFiles) {
    const entry = directFiles[name];
    const fileSize = (await stat(file)).size;
    if (!entry) {
      addFailure(`Business component file ${name} is not registered in business-governance.json.`);
      continue;
    }
    if (!entry.owner || !entry.status) {
      addFailure(`Business component registry entry ${name} must include owner and status.`);
    }
    if (governance.mode === 'stabilize' && entry.status === 'package-candidate' && !knownCandidates.has(name)) {
      addFailure(`Business package-candidate ${name} must be listed as activeCandidates or deferredCandidates in business-governance.json.`);
    }
    if (governance.mode === 'stabilize' && entry.status !== 'package-candidate' && knownCandidates.has(name)) {
      addFailure(`Business governance candidate queue references ${name}, but its status is ${entry.status}. Keep the queue in sync.`);
    }
    if (entry.maxBytes && fileSize > entry.maxBytes) {
      addFailure(`Business component file ${name} exceeded its governance budget: ${fileSize} > ${entry.maxBytes}. Split deliberately or update the registry with a new decision.`);
    }
    if (fileSize >= largeFileBytes && !entry.decision && entry.status !== 'facade') {
      addFailure(`Large business component file ${name} must include a governance decision in business-governance.json.`);
    }
    if (entry.status === 'facade') {
      const text = await readText(file);
      const maxBytes = entry.maxBytes || facadeMaxBytes;
      if (fileSize > maxBytes) {
        addFailure(`Business facade ${name} exceeded facade budget: ${fileSize} > ${maxBytes}.`);
      }
      if (/export function\b/.test(text) || /className=/.test(text)) {
        addFailure(`Business facade ${name} must not contain component implementation JSX. Keep implementation in its package.`);
      }
    }
  }

  for (const registeredFileName of Object.keys(directFiles)) {
    if (!(await exists(path.join(businessDir, registeredFileName)))) {
      addFailure(`Business governance registry references missing file: ${registeredFileName}.`);
    }
  }

  for (const [packageName, packageEntry] of Object.entries(registry.packages || {})) {
    const packageDir = path.join(businessDir, packageName);
    if (!(await exists(packageDir))) {
      addFailure(`Business governance registry references missing package directory: ${packageName}.`);
      continue;
    }
    if (!packageEntry.facade || !(await exists(path.join(businessDir, packageEntry.facade)))) {
      addFailure(`Business package ${packageName} must declare an existing facade file.`);
    }
    for (const requiredFile of packageEntry.requiredFiles || []) {
      if (!(await exists(path.join(businessDir, requiredFile)))) {
        addFailure(`Business package ${packageName} missing required file: ${requiredFile}.`);
      }
    }
  }
}

async function checkComponentInterfaces(addFailure) {
  const componentReadmePath = path.join(rootDir, 'apps/web/src/components/README.md');
  const requiredInterfaces = [
    'apps/web/src/components/ui/index.ts',
    'apps/web/src/components/layout/index.ts',
    'apps/web/src/components/business/index.ts',
    'apps/web/src/components/chat/index.ts',
    'apps/web/src/components/decor/index.ts',
    'apps/web/src/components/decor/preview.ts',
  ];

  if (!(await exists(componentReadmePath))) {
    addFailure('Missing frontend component interface guide: apps/web/src/components/README.md.');
  }
  for (const interfacePath of requiredInterfaces) {
    if (!(await exists(path.join(rootDir, interfacePath)))) {
      addFailure(`Missing frontend component public interface: ${interfacePath}.`);
    }
  }

  const decorPublicApiPath = path.join(rootDir, 'apps/web/src/components/decor/index.ts');
  const decorPreviewApiPath = path.join(rootDir, 'apps/web/src/components/decor/preview.ts');
  const decorPublicApiText = await readText(decorPublicApiPath);
  const decorPreviewApiText = await readText(decorPreviewApiPath);
  if (/\b(?:Bookish|Sample|StateMatrix|SectionHeader|SystemBriefCard|ChipGroup)\b/.test(decorPublicApiText)) {
    addFailure('apps/web/src/components/decor/index.ts must stay the formal decor interface; preview, migration, and exploratory assets belong in decor/preview.ts.');
  }
  for (const requiredPreviewExport of ['EditorialStateMatrix', 'EditorialChatSample', 'EditorialTodaySample', 'EditorialPageReframeSample']) {
    if (!decorPreviewApiText.includes(requiredPreviewExport)) {
      addFailure(`apps/web/src/components/decor/preview.ts must expose preview asset ${requiredPreviewExport}.`);
    }
  }

  const reportBusinessFacadePath = path.join(rootDir, 'apps/web/src/components/business/reports.tsx');
  const reportBusinessFacadeText = await readText(reportBusinessFacadePath);
  requireTextTokens(addFailure, 'apps/web/src/components/business/reports.tsx', reportBusinessFacadeText, [
    "from './reports/annual'",
    "from './reports/periodic'",
    "from './reports/shared'",
    "from './reports/sheets'",
    "from './reports/contracts'",
  ]);
  if (/export function\b/.test(reportBusinessFacadeText) || /className=/.test(reportBusinessFacadeText)) {
    addFailure('apps/web/src/components/business/reports.tsx must stay a report business facade. Put implementation in components/business/reports/*.');
  }
  const requiredReportPackageFiles = [
    'apps/web/src/components/business/reports/annual.tsx',
    'apps/web/src/components/business/reports/contracts.ts',
    'apps/web/src/components/business/reports/exportFormats.ts',
    'apps/web/src/components/business/reports/periodic.tsx',
    'apps/web/src/components/business/reports/periodicAi.tsx',
    'apps/web/src/components/business/reports/periodicGrowth.tsx',
    'apps/web/src/components/business/reports/periodicOverview.tsx',
    'apps/web/src/components/business/reports/periodicState.tsx',
    'apps/web/src/components/business/reports/periodicTrends.tsx',
    'apps/web/src/components/business/reports/shared.tsx',
    'apps/web/src/components/business/reports/sheets.tsx',
  ];
  for (const reportPackageFile of requiredReportPackageFiles) {
    if (!(await exists(path.join(rootDir, reportPackageFile)))) {
      addFailure(`Missing report business package file: ${reportPackageFile}.`);
    }
  }
  const reportSharedText = await readText(path.join(rootDir, 'apps/web/src/components/business/reports/shared.tsx'));
  if (/\bexport\s+(?:type|const)\b/.test(reportSharedText)) {
    addFailure('apps/web/src/components/business/reports/shared.tsx must only export React components. Put shared report types/constants in .ts files.');
  }
  const reportPeriodicFacadeText = await readText(path.join(rootDir, 'apps/web/src/components/business/reports/periodic.tsx'));
  requireTextTokens(addFailure, 'apps/web/src/components/business/reports/periodic.tsx', reportPeriodicFacadeText, [
    "from './periodicAi'",
    "from './periodicGrowth'",
    "from './periodicOverview'",
    "from './periodicState'",
    "from './periodicTrends'",
  ]);
  if (/export function\b/.test(reportPeriodicFacadeText) || /className=/.test(reportPeriodicFacadeText)) {
    addFailure('apps/web/src/components/business/reports/periodic.tsx must stay a periodic report facade. Put implementation in periodic*.tsx modules.');
  }
  await checkBusinessGovernance(addFailure);

  const sourceFiles = (await listFiles(path.join(rootDir, 'apps/web/src'))).filter((file) => {
    const normalized = normalizeForLog(file);
    return ['.ts', '.tsx'].includes(path.extname(file))
      && !normalized.startsWith('apps/web/src/demo/');
  });
  const deepComponentImportPattern = /from\s+['"][^'"]*components\/(?:ui|layout|business|chat|decor)\/(?!preview['"])[^'"]+['"]/;
  const previewInterfaceImportPattern = /from\s+['"][^'"]*components\/decor\/preview['"]/;
  const crossPackageImplementationImportPattern = /from\s+['"]\.\.\/(?:ui|layout|business|chat|decor)\/[^'"]+['"]/;

  for (const file of sourceFiles) {
    const normalized = normalizeForLog(file);
    const text = await readText(file);
    if (deepComponentImportPattern.test(text)) {
      addFailure(`${normalized} imports component implementation files directly. Use the component package public interface instead.`);
    }
    if (previewInterfaceImportPattern.test(text) && normalized !== 'apps/web/src/pages/DecorPreviewPage.tsx') {
      addFailure(`${normalized} imports the decor preview interface. Preview assets must not enter formal UI callers.`);
    }
    const sourcePackageMatch = normalized.match(/^apps\/web\/src\/components\/([^/]+)\//);
    if (sourcePackageMatch && crossPackageImplementationImportPattern.test(text)) {
      addFailure(`${normalized} imports another component package implementation directly. Use that package index.ts interface.`);
    }
    if (
      normalized.startsWith('apps/web/src/components/business/')
      && !normalized.startsWith('apps/web/src/components/business/systemDiagnostics/')
      && text.includes('providerModel')
    ) {
      addFailure(`${normalized} must not render providerModel in formal business UI. Provider/model metadata belongs to diagnostics views.`);
    }
    const rawContentEnumDisplaySnippets = [
      'eyebrow={item.contentType}',
      'eyebrow={topItem.contentType}',
      '{item.sourceName || item.contentType}',
      'category: item.contentType',
      'category: leadContentType',
      'category: detail.contentType',
      'topic.categories?.slice(0, 3).map((cat)',
    ];
    for (const snippet of rawContentEnumDisplaySnippets) {
      if (
        (normalized.startsWith('apps/web/src/pages/') || normalized.startsWith('apps/web/src/components/business/'))
        && text.includes(snippet)
      ) {
        addFailure(`${normalized} must not display raw content enum/category via ${snippet}. Use utils/contentLabels formatters before data reaches formal UI.`);
      }
    }
    if (
      normalized.startsWith('apps/web/src/pages/')
      && text.includes('article: {')
    ) {
      addFailure(`${normalized} must normalize article route state through utils/articleDisplay normalizeArticleState instead of constructing article display state inline.`);
    }
    if (
      normalized.startsWith('apps/web/src/components/business/article/')
      && (
        text.includes('activeArticle.category')
        || text.includes('activeArticle.source')
        || text.includes('formatContentTypeLabel')
        || text.includes('formatContentCategoryLabel')
      )
    ) {
      addFailure(`${normalized} must render ArticleState.display fields instead of formatting raw article contract fields inside article components.`);
    }
  }
}

async function checkPageContracts(indexCssText, addFailure) {
  const pageReadmePath = path.join(rootDir, 'apps/web/src/pages/README.md');
  if (!(await exists(pageReadmePath))) {
    addFailure('Missing frontend page contracts: apps/web/src/pages/README.md.');
    return;
  }

  const text = await readText(pageReadmePath);
  const requiredContracts = [
    {
      heading: '## TodayPage',
      tokens: [
        'TodayPage.tsx',
        'TodayPageData',
        'services/dashboard',
        'apiService.getTodayPageData()',
        'components/business',
        'styles/today-page.css',
      ],
    },
    {
      heading: '## ChatPage',
      tokens: [
        'ChatPage.tsx',
        'page-data/chat.ts',
        'services/chat',
        'services/apiDomains/chat.ts',
        'components/chat',
        'styles/chat-page.css',
      ],
    },
    {
      heading: '## WelcomePage',
      tokens: [
        'WelcomePage.tsx',
        'useWelcomePageLogic',
        'components/business',
        'styles/auth-pages.css',
      ],
    },
    {
      heading: '## Report Pages',
      tokens: [
        'WeeklyReportPage.tsx',
        'MonthlyReportPage.tsx',
        'AnnualReportPage.tsx',
        'page-data/reports.ts',
        'services/reports',
        'styles/report-pages.css',
      ],
    },
    {
      heading: '## GrowthPage',
      tokens: [
        'GrowthPage.tsx',
        'page-data/preferences.ts',
        'services/preferences',
        'services/apiDomains/preferences.ts',
        'components/business',
        'styles/insights-pages.css',
      ],
    },
    {
      heading: '## MyPage',
      tokens: [
        'MyPage.tsx',
        'AppContext',
        'apiService',
        'components/business',
        'styles/my-pages.css',
      ],
    },
  ];

  for (const contract of requiredContracts) {
    if (!text.includes(contract.heading)) {
      addFailure(`Missing core page contract section: ${contract.heading}.`);
      continue;
    }
    for (const token of contract.tokens) {
      if (!text.includes(token)) {
        addFailure(`Page contract ${contract.heading} must document ${token}.`);
      }
    }
  }

  for (const requiredSection of ['UX intent', 'Data contract', 'Frontend API', 'Component owner', 'Style owner', 'Non-goals']) {
    if (!text.includes(requiredSection)) {
      addFailure(`Page contracts must include ${requiredSection} for ownership handoff.`);
    }
  }

  const contractImplementationChecks = [
    {
      owner: 'TodayPage contract implementation',
      files: [
        'apps/web/src/pages/TodayPage.tsx',
        'apps/web/src/pages/useTodayPageLogic.ts',
        'apps/web/src/components/business/today.tsx',
      ],
      style: './styles/today-page.css',
      tokens: [
        'apiService.getTodayPageData()',
        'useTodayPageLogic',
        "from './useTodayPageLogic'",
        "from '../types/page-data'",
        'TodayPageData',
        "from '../components/layout'",
        "from '../components/business'",
        "from '../components/ui'",
        'PageSection',
        'PageStack',
        'today-',
      ],
      forbiddenTokens: [
        'TodaySection',
        'TodaySectionHeader',
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/TodayPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useNavigate',
            'aiBriefing.provider',
            'aiBriefing.model',
          ],
        },
      ],
    },
    {
      owner: 'ChatPage contract implementation',
      files: [
        'apps/web/src/pages/ChatPage.tsx',
        'apps/web/src/pages/useChatPageLogic.ts',
        'apps/web/src/hooks/useChatLogic.ts',
      ],
      style: './styles/chat-page.css',
      tokens: [
        'useChatPageLogic',
        "from './useChatPageLogic'",
        'useChatLogic',
        "from '../components/chat'",
        'ChatEditorialShell',
        'apiService.sendChatMessage',
        'apiService.confirmChat',
        'apiService.reclassifyChat',
        'apiService.deleteChatMessage',
        'chat-',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/ChatPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useRef',
            'useLocation',
            'useNavigate',
            'useSearchParams',
            'confirmPendingIntent',
            'setIsTyping',
            'navigate',
          ],
        },
      ],
    },
    {
      owner: 'Report pages contract implementation',
      files: [
        'apps/web/src/pages/WeeklyReportPage.tsx',
        'apps/web/src/pages/MonthlyReportPage.tsx',
        'apps/web/src/pages/AnnualReportPage.tsx',
        'apps/web/src/pages/useWeeklyReportPageLogic.ts',
        'apps/web/src/pages/useMonthlyReportPageLogic.ts',
        'apps/web/src/pages/useAnnualReportPageLogic.ts',
        'apps/web/src/components/business/reports.tsx',
        'apps/web/src/components/business/reports/contracts.ts',
        'apps/web/src/components/business/reports/exportFormats.ts',
        'apps/web/src/components/business/reports/shared.tsx',
        'apps/web/src/components/business/reports/periodic.tsx',
        'apps/web/src/components/business/reports/periodicAi.tsx',
        'apps/web/src/components/business/reports/periodicGrowth.tsx',
        'apps/web/src/components/business/reports/periodicOverview.tsx',
        'apps/web/src/components/business/reports/periodicState.tsx',
        'apps/web/src/components/business/reports/periodicTrends.tsx',
        'apps/web/src/components/business/reports/annual.tsx',
        'apps/web/src/components/business/reports/sheets.tsx',
        'apps/web/src/utils/reportPageFormatting.ts',
      ],
      style: './styles/report-pages.css',
      tokens: [
        'apiService.getWeeklyReport',
        'apiService.getMonthlyReport',
        'apiService.getAnnualReport',
        'useWeeklyReportPageLogic',
        'useMonthlyReportPageLogic',
        'useAnnualReportPageLogic',
        "from './useWeeklyReportPageLogic'",
        "from './useMonthlyReportPageLogic'",
        "from './useAnnualReportPageLogic'",
        "from '../components/business'",
        'AnnualReportAiSection',
        'AnnualReportContent',
        'AnnualReportHero',
        'AnnualReportQualityCard',
        'AnnualReportStateCard',
        'MonthlyReportGrowthSection',
        'MonthlyReportOverviewSection',
        'MonthlyReportTrendSections',
        'PeriodicReportAiSection',
        'PeriodicReportQualityCard',
        'PeriodicReportStateCard',
        'ReportActionBar',
        'ReportExportSheet',
        'ReportShareSheet',
        'WeeklyReportGrowthSection',
        'WeeklyReportOverviewSection',
        'WeeklyReportTrendSections',
        "from '../../../utils/reportPageFormatting'",
        "from '../types/page-data'",
        "from '../components/layout'",
        'report-',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/WeeklyReportPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useLocation',
            'useNavigate',
            'useAppContext',
            'downloadFile',
            'getPeriodicReportAiStatus',
            'buildWeeklyMarkdown',
            'setOpenChatPanel',
            '<RefreshCw',
            'report-ai-evidence-list',
            'report-ai-summary-grid',
            'report-sheet-overlay',
            'weekly-report-modal-overlay',
            'weekly-report-format-option',
            'weekly-report-share-options',
            'domain-card',
            'weekly-report-error-card',
            'weekly-report-empty-card',
            'weekly-report-quality-card',
            'report-actions weekly-report-actions',
            'section-header',
            'report-section',
            'section-content',
            'overview-stats',
            'trend-heat',
            'trend-hotspot',
            'growth-stats',
            '<Button',
          ],
        },
        {
          file: 'apps/web/src/pages/MonthlyReportPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useLocation',
            'useNavigate',
            'useAppContext',
            'downloadFile',
            'getPeriodicReportAiStatus',
            'buildMonthlyMarkdown',
            'setOpenChatPanel',
            '<RefreshCw',
            'report-ai-evidence-list',
            'report-ai-summary-grid',
            'report-sheet-overlay',
            'report-sheet-option',
            'report-sheet-share-grid',
            'domain-card',
            'monthly-report-error-card',
            'monthly-report-empty-card',
            'monthly-report-quality-card',
            'report-actions monthly-report-actions',
            'section-header',
            'report-section',
            'section-content',
            'overview-stats',
            'trend-heat',
            'trend-hotspot',
            'growth-comparison',
            '<Button',
            'buildTrendBarWidth',
          ],
        },
        {
          file: 'apps/web/src/pages/AnnualReportPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useLocation',
            'downloadFile',
            'getAnnualReportAiStatus',
            'buildAnnualMarkdown',
            '<RefreshCw',
            'report-ai-evidence-list',
            'report-ai-summary-grid',
            'report-sheet-overlay',
            'report-sheet-option',
            'report-sheet-share-grid',
            'domain-card',
            'annual-error-card',
            'annual-state-card',
            'annual-quality-card',
            'report-actions annual-actions',
            'annual-hero',
            'annual-section',
            'annual-overview-grid',
            'annual-chip-list',
            'annual-keyword-box',
          ],
        },
      ],
    },
    {
      owner: 'GrowthPage contract implementation',
      files: [
        'apps/web/src/pages/GrowthPage.tsx',
        'apps/web/src/pages/useGrowthPageLogic.ts',
        'apps/web/src/components/business/growth.tsx',
      ],
      style: './styles/insights-pages.css',
      tokens: [
        'apiService.getGrowthOverview',
        'useGrowthPageLogic',
        "from './useGrowthPageLogic'",
        'GrowthOverviewData',
        "from '../types/page-data'",
        "from '../components/layout'",
        'PageSection',
        'PageStack',
        'PageGrid',
        "from '../components/business'",
        'GrowthProfileCard',
        'GrowthWeeklyCard',
        'GrowthReportList',
        'growth-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
        'page-section-action-button',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/GrowthPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useMemo',
            'useNavigate',
            'useAppContext',
            'domain-card',
            'PageGrid',
            '<Tag',
            'NavigationEntryCard',
            'growth-profile-card',
            'growth-weekly-card',
            'growth-keyword-card',
            'growth-persona-card',
            'growth-history-card',
            'growth-report-list',
          ],
        },
      ],
    },
    {
      owner: 'MyPage contract implementation',
      files: [
        'apps/web/src/pages/MyPage.tsx',
        'apps/web/src/pages/useMyPageLogic.ts',
        'apps/web/src/components/business/my.tsx',
      ],
      style: './styles/my-pages.css',
      tokens: [
        "from '../context/useAppContext'",
        'useMyPageLogic',
        "from './useMyPageLogic'",
        "from '../components/layout'",
        'PageSection',
        'PageStack',
        'PageGrid',
        "from '../components/business'",
        'MyAccountOverviewCard',
        'MyEntryGrid',
        'MyAccountSecurityCard',
        'my-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/MyPage.tsx',
          tokens: [
            'useNavigate',
            'useAppContext',
            'formatSubtitleWithLunar',
            'domain-card',
            'action-chip',
            'PageGrid',
            'NavigationEntryCard',
            'Button',
            'my-account-overview-card',
            'my-account-card',
          ],
        },
      ],
    },
    {
      owner: 'AboutPage contract implementation',
      files: [
        'apps/web/src/pages/AboutPage.tsx',
        'apps/web/src/pages/useAboutPageLogic.ts',
        'apps/web/src/components/business/about.tsx',
      ],
      style: './styles/help-about.css',
      tokens: [
        'useAboutPageLogic',
        "from './useAboutPageLogic'",
        "from '../components/business'",
        'AboutHeroCard',
        'AboutLinksCard',
        'AboutFeaturesCard',
        'about-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/AboutPage.tsx',
          tokens: [
            'useNavigate',
            'window.open',
            'domain-card',
            'Button',
            'ChevronRight',
            'Heart',
            'FileText',
            'about-hero-card',
            'about-links-card',
            'about-features-card',
          ],
        },
      ],
    },
    {
      owner: 'HelpFeedbackPage contract implementation',
      files: [
        'apps/web/src/pages/HelpFeedbackPage.tsx',
        'apps/web/src/pages/useHelpFeedbackPageLogic.ts',
        'apps/web/src/components/business/helpFeedback.tsx',
      ],
      style: './styles/help-about.css',
      tokens: [
        'apiService.submitFeedback',
        'useHelpFeedbackPageLogic',
        "from './useHelpFeedbackPageLogic'",
        "from '../components/layout'",
        'PageSection',
        'PageStack',
        "from '../components/business'",
        'HelpFeedbackCategoryGrid',
        'HelpFeedbackFAQCard',
        'HelpFeedbackFormCard',
        'help-feedback-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/HelpFeedbackPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useCallback',
            'domain-card',
            'Button',
            'MessageCircle',
            'Book',
            'HelpCircle',
            'Send',
            'Check',
            'section-title',
            'help-feedback-faq-card',
            'help-feedback-form-card',
          ],
        },
      ],
    },
    {
      owner: 'SettingsPage contract implementation',
      files: [
        'apps/web/src/pages/SettingsPage.tsx',
        'apps/web/src/pages/useSettingsPageLogic.ts',
        'apps/web/src/components/business/settings.tsx',
      ],
      style: './styles/preferences-pages.css',
      tokens: [
        'apiService.getUserSettings',
        'apiService.updateUserSettings',
        'useSettingsPageLogic',
        "from './useSettingsPageLogic'",
        "from '../components/business'",
        'SettingsGroupList',
        'SettingsStatusCard',
        'settings-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/SettingsPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useNavigate',
            'domain-card',
            '<Button',
            '<Switch',
            'ChevronRight',
            'settings-group-card',
            'settings-item-',
            'settings-footnote-card',
          ],
        },
      ],
    },
    {
      owner: 'NotificationSettingsPage contract implementation',
      files: [
        'apps/web/src/pages/NotificationSettingsPage.tsx',
        'apps/web/src/pages/useNotificationSettingsPageLogic.ts',
        'apps/web/src/components/business/settings.tsx',
      ],
      style: './styles/preferences-pages.css',
      tokens: [
        'apiService.getUserSettings',
        'apiService.updateUserSettings',
        'useNotificationSettingsPageLogic',
        "from './useNotificationSettingsPageLogic'",
        "from '../components/layout'",
        'PageSection',
        'PageStack',
        "from '../components/business'",
        'NotificationTimeSlotsCard',
        'NotificationDndCard',
        'NotificationReminderMethodCard',
        'notification-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/NotificationSettingsPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'domain-card',
            '<Button',
            '<Switch',
            'Bell',
            'Clock',
            'Moon',
            'Volume2',
            'Smartphone',
            'Check',
            'section-title',
            'notification-group-card',
            'notification-item',
            'notification-save-btn',
          ],
        },
      ],
    },
    {
      owner: 'AiProviderSettingsPage contract implementation',
      files: [
        'apps/web/src/pages/AiProviderSettingsPage.tsx',
        'apps/web/src/pages/useAiProviderSettingsPageLogic.ts',
        'apps/web/src/components/business/aiProvider.tsx',
      ],
      style: './styles/preferences-pages.css',
      tokens: [
        'apiService.getUserAiProviderSettings',
        'apiService.updateUserAiProviderSettings',
        'useAiProviderSettingsPageLogic',
        "from './useAiProviderSettingsPageLogic'",
        "from '../components/layout'",
        'PageStack',
        "from '../components/business'",
        'AiProviderFormCard',
        'AiProviderActionBar',
        'ai-provider-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/AiProviderSettingsPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'domain-card',
            '<Button',
            '<select',
            '<input',
            '<Server',
            '<Check',
            '<RotateCcw',
            '<Key',
            'ai-provider-info-card',
            'ai-provider-form-card',
            'ai-provider-current-card',
            'ai-provider-actions',
          ],
        },
      ],
    },
    {
      owner: 'InterestConfigPage contract implementation',
      files: [
        'apps/web/src/pages/InterestConfigPage.tsx',
        'apps/web/src/pages/useInterestConfigPageLogic.ts',
        'apps/web/src/components/business/interestConfig.tsx',
      ],
      style: './styles/preferences-pages.css',
      tokens: [
        'apiService.getUserInterests',
        'apiService.updateUserInterests',
        'useInterestConfigPageLogic',
        "from './useInterestConfigPageLogic'",
        "from '../components/layout'",
        'PageFooter',
        "from '../components/business'",
        'InterestConfigCategoryList',
        'InterestConfigSubmitButton',
        'interest-config-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/InterestConfigPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useNavigate',
            'domain-card',
            '<Button',
            '<ArrowLeft',
            '<ChevronRight',
            'interest-config-category-card',
            'interest-config-interest-chip',
          ],
        },
        {
          file: 'apps/web/src/components/business/interestConfig.tsx',
          tokens: [
            "from '../../pages",
            "from '../pages",
          ],
        },
      ],
    },
    {
      owner: 'HotTopicsPage contract implementation',
      files: [
        'apps/web/src/pages/HotTopicsPage.tsx',
        'apps/web/src/pages/useHotTopicsPageLogic.ts',
        'apps/web/src/components/business/hotTopics.tsx',
      ],
      style: './styles/hot-topics.css',
      tokens: [
        'apiService.getHotTopics',
        'apiService.getFavorites',
        'apiService.createFavorite',
        'apiService.deleteFavorite',
        'useHotTopicsPageLogic',
        "from './useHotTopicsPageLogic'",
        "from '../types/page-data'",
        "from '../components/layout'",
        'PageSection',
        'PageStack',
        "from '../components/business'",
        'HotTopicsContent',
        'HotTopicsModal',
        'hot-topics-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/HotTopicsPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useNavigate',
            'domain-card',
            '<Button',
            '<Tag',
            '<Bookmark',
            'section-header',
            'hot-topics-detail-item',
            'hot-topics-modal-panel',
          ],
        },
        {
          file: 'apps/web/src/components/business/hotTopics.tsx',
          tokens: [
            "from '../../pages",
            "from '../pages",
          ],
        },
      ],
    },
    {
      owner: 'AiDigestLabPage contract implementation',
      files: [
        'apps/web/src/pages/AiDigestLabPage.tsx',
        'apps/web/src/pages/useAiDigestLabPageLogic.ts',
        'apps/web/src/components/business/aiDigestLab.tsx',
      ],
      style: './styles/ai-digest.css',
      tokens: [
        'apiService.getDailyDigest',
        'apiService.consultDigest',
        'useAiDigestLabPageLogic',
        "from './useAiDigestLabPageLogic'",
        "from '../components/layout'",
        "from '../components/business'",
        'AiDigestLabIntroCard',
        'AiDigestLabWorkspace',
        'ai-digest-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/AiDigestLabPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'domain-card',
            '<Button',
            '<Tag',
            '<textarea',
            '<ExternalLink',
            '<RefreshCw',
            '<Send',
            'ai-digest-card',
            'ai-digest-list-item',
            'ai-digest-consult-box',
          ],
        },
        {
          file: 'apps/web/src/components/business/aiDigestLab.tsx',
          tokens: [
            "from '../../pages",
            "from '../pages",
          ],
        },
      ],
    },
    {
      owner: 'ArticlePage contract implementation',
      files: [
        'apps/web/src/pages/ArticlePage.tsx',
        'apps/web/src/pages/useArticlePageLogic.ts',
        'apps/web/src/components/business/article.tsx',
        'apps/web/src/types/article.ts',
      ],
      style: './styles/article-page.css',
      tokens: [
        'apiService.getContentDetailByRef',
        'apiService.getFavorites',
        'apiService.createFavorite',
        'apiService.deleteFavorite',
        'useArticlePageLogic',
        "from './useArticlePageLogic'",
        "from '../types/article'",
        "from '../components/layout'",
        "from '../components/business'",
        'ArticleMainContent',
        'ArticleProgressBar',
        'article-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/ArticlePage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useNavigate',
            'useLocation',
            'domain-card',
            '<Button',
            '<Bookmark',
            '<Share2',
            '<ExternalLink',
            '<Chevron',
            '<Clock',
            '<User',
            'article-hero-card',
            'article-section-card',
            'article-related-card',
          ],
        },
        {
          file: 'apps/web/src/components/business/article.tsx',
          tokens: [
            "from '../../pages",
            "from '../pages",
          ],
        },
      ],
    },
    {
      owner: 'LoginPage contract implementation',
      files: [
        'apps/web/src/pages/LoginPage.tsx',
        'apps/web/src/pages/useLoginPageLogic.ts',
        'apps/web/src/components/business/login.tsx',
      ],
      style: './styles/auth-pages.css',
      tokens: [
        'useAppContext',
        'useLoginPageLogic',
        "from './useLoginPageLogic'",
        "from '../components/layout'",
        "from '../components/business'",
        'LoginAuthCard',
        'LoginModeSwitch',
        'login-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/LoginPage.tsx',
          tokens: [
            'useAppContext',
            'useState',
            'useEffect',
            'useCallback',
            'useNavigate',
            'useLocation',
            'domain-card',
            '<Button',
            '<input',
            '<SocialLoginButtons',
            '<Eye',
            '<ArrowLeft',
            '<Newspaper',
            'login-auth-card',
            'login-form-grid',
          ],
        },
        {
          file: 'apps/web/src/components/business/login.tsx',
          tokens: [
            "from '../../pages",
            "from '../pages",
          ],
        },
      ],
    },
    {
      owner: 'WelcomePage contract implementation',
      files: [
        'apps/web/src/pages/WelcomePage.tsx',
        'apps/web/src/pages/useWelcomePageLogic.ts',
        'apps/web/src/components/business/login.tsx',
      ],
      style: './styles/auth-pages.css',
      tokens: [
        'useWelcomePageLogic',
        "from './useWelcomePageLogic'",
        "from '../components/layout'",
        "from '../components/business'",
        'WelcomeSlideDeck',
        'welcome-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/WelcomePage.tsx',
          tokens: [
            'useState',
            'useRef',
            'useNavigate',
            'useLocation',
            '<BookOpen',
            '<ChevronRight',
            '<Newspaper',
            '<Radar',
            'welcome-slide-card',
            'welcome-slider-shell',
          ],
        },
      ],
    },
    {
      owner: 'ProfilePage contract implementation',
      files: [
        'apps/web/src/pages/ProfilePage.tsx',
        'apps/web/src/pages/useProfilePageLogic.ts',
        'apps/web/src/components/business/profile.tsx',
      ],
      style: './styles/insights-pages.css',
      tokens: [
        'apiService.getUserProfile',
        'apiService.generateUserProfile',
        'useProfilePageLogic',
        "from './useProfilePageLogic'",
        "from '../components/layout'",
        'PageSection',
        'PageStack',
        "from '../components/business'",
        'ProfileGenerateCard',
        'ProfileContent',
        'profile-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/ProfilePage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useMemo',
            'domain-card',
            '<Button',
            '<Tag',
            '<RefreshCw',
            '<svg',
            'report-section',
            'section-header',
            'profile-stat-card',
            'profile-evidence-item',
          ],
        },
        {
          file: 'apps/web/src/components/business/profile.tsx',
          tokens: [
            "from '../../pages",
            "from '../pages",
          ],
        },
      ],
    },
    {
      owner: 'SystemDiagnosticsPage contract implementation',
      files: [
        'apps/web/src/pages/SystemDiagnosticsPage.tsx',
        'apps/web/src/pages/useSystemDiagnosticsPageLogic.ts',
        'apps/web/src/components/business/systemDiagnostics.tsx',
      ],
      style: './styles/diagnostics-page.css',
      tokens: [
        'apiService.getLlmInvocationStats',
        'apiService.getBriefingDispatchStats',
        'useSystemDiagnosticsPageLogic',
        "from './useSystemDiagnosticsPageLogic'",
        "from '../components/layout'",
        "from '../components/business'",
        'DiagnosticsGuardCard',
        'DiagnosticsContent',
        'diagnostics-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/SystemDiagnosticsPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'domain-card',
            '<Button',
            '<Activity',
            '<AlertTriangle',
            '<BarChart3',
            '<RefreshCw',
            '<ShieldCheck',
            'diagnostics-row',
            'diagnostics-metric-card',
          ],
        },
        {
          file: 'apps/web/src/components/business/systemDiagnostics.tsx',
          tokens: [
            "from '../../pages",
            "from '../pages",
          ],
        },
      ],
    },
    {
      owner: 'CollectionsPage contract implementation',
      files: [
        'apps/web/src/pages/CollectionsPage.tsx',
        'apps/web/src/pages/useCollectionsPageLogic.ts',
        'apps/web/src/components/business/collections.tsx',
      ],
      style: './styles/insights-pages.css',
      tokens: [
        'apiService.getFavorites',
        'apiService.getActionsOverview',
        'apiService.deleteFavorite',
        'useCollectionsPageLogic',
        "from './useCollectionsPageLogic'",
        "from '../types/page-data'",
        "from '../components/business'",
        'CollectionsSearchBox',
        'CollectionsList',
        'CollectionsDeleteModal',
        'collections-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/CollectionsPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useNavigate',
            'domain-card',
            '<Button',
            '<Search',
            '<Trash2',
            '<ChevronDown',
            '<ChevronUp',
            '<ConfirmModal',
            'collection-card',
            'collections-item-card',
          ],
        },
      ],
    },
    {
      owner: 'HistoryLogsPage contract implementation',
      files: [
        'apps/web/src/pages/HistoryLogsPage.tsx',
        'apps/web/src/pages/useHistoryLogsPageLogic.ts',
        'apps/web/src/components/business/historyLogs.tsx',
      ],
      style: './styles/history-pages.css',
      tokens: [
        'apiService.getHistory',
        'apiService.getNotes',
        'apiService.getFavorites',
        'useHistoryLogsPageLogic',
        "from './useHistoryLogsPageLogic'",
        "from '../types/page-data'",
        "from '../components/layout'",
        "from '../components/business'",
        'PageSection',
        'PageStack',
        'HistoryLogsArchiveList',
        'HistoryLogsStateCard',
        'history-logs-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/HistoryLogsPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useNavigate',
            'domain-card',
            '<Button',
            'section-title',
            'history-logs-archive-card',
            'history-logs-record-card',
          ],
        },
      ],
    },
    {
      owner: 'HistoryBriefPage contract implementation',
      files: [
        'apps/web/src/pages/HistoryBriefPage.tsx',
        'apps/web/src/pages/useHistoryBriefPageLogic.ts',
        'apps/web/src/components/business/historyBrief.tsx',
      ],
      style: './styles/history-pages.css',
      tokens: [
        'apiService.getReports',
        'useHistoryBriefPageLogic',
        "from './useHistoryBriefPageLogic'",
        "from '../types/page-data'",
        "from '../components/layout'",
        'PageSection',
        'PageStack',
        "from '../components/business'",
        'HistoryBriefSearchBox',
        'HistoryBriefReportSection',
        'history-brief-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/HistoryBriefPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useMemo',
            'useNavigate',
            'domain-card',
            '<Button',
            '<Search',
            '<ChevronRight',
            'section history-brief-section',
            'history-brief-report-card',
          ],
        },
      ],
    },
    {
      owner: 'ActionsPage contract implementation',
      files: [
        'apps/web/src/pages/ActionsPage.tsx',
        'apps/web/src/pages/useActionsPageLogic.ts',
        'apps/web/src/components/business/actions.tsx',
      ],
      style: './styles/actions-page.css',
      tokens: [
        'apiService.getActionsOverview',
        'apiService.updateTodo',
        'apiService.deleteTodo',
        'apiService.checkInToday',
        'useActionsPageLogic',
        "from './useActionsPageLogic'",
        "from '../types/page-data'",
        "from '../components/layout'",
        'PageSection',
        'PageStack',
        'PageGrid',
        "from '../components/business'",
        "from '../ui'",
        'ActionsPrimaryCard',
        'ActionsTodoList',
        'ActionsRhythmSummary',
        'actions-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/ActionsPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'domain-card',
            'action-chip',
            'ContentListCard',
            'Button',
            'PageGrid',
          ],
        },
      ],
    },
    {
      owner: 'JournalPage contract implementation',
      files: [
        'apps/web/src/pages/JournalPage.tsx',
        'apps/web/src/pages/useJournalPageLogic.ts',
        'apps/web/src/components/business/journal.tsx',
      ],
      style: './styles/journal-feedback.css',
      tokens: [
        'apiService.getJournalOverview',
        'apiService.deleteNote',
        'useJournalPageLogic',
        "from './useJournalPageLogic'",
        "from '../types/page-data'",
        "from '../components/layout'",
        "from '../components/business'",
        'PageSection',
        'PageStack',
        'PageGrid',
        'JournalOverviewCard',
        'JournalThoughtList',
        'JournalReviewCard',
        'journal-',
      ],
      forbiddenTokens: [
        'section-header',
        'section-more',
      ],
      fileForbiddenTokens: [
        {
          file: 'apps/web/src/pages/JournalPage.tsx',
          tokens: [
            'apiService',
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useNavigate',
            'domain-card',
            'PageGrid',
            '<Tag',
            'Trash2',
            'journal-overview-card',
            'journal-thought-card',
            'journal-compact-card',
            'journal-keep-card',
            'journal-review-card',
          ],
        },
      ],
    },
  ];

  for (const check of contractImplementationChecks) {
    if (!indexCssText.includes(check.style)) {
      addFailure(`${check.owner} style owner ${check.style} must be imported by apps/web/src/index.css.`);
    }

    const fileTexts = [];
    for (const relativeFilePath of check.files) {
      const fullPath = path.join(rootDir, relativeFilePath);
      if (!(await exists(fullPath))) {
        addFailure(`${check.owner} missing implementation file: ${relativeFilePath}.`);
        continue;
      }
      fileTexts.push(await readText(fullPath));
    }

    const joinedText = fileTexts.join('\n');
    requireTextTokens(addFailure, check.owner, joinedText, check.tokens);
    for (const token of check.forbiddenTokens || []) {
      if (joinedText.includes(token)) {
        addFailure(`${check.owner} must not include ${token}. Use the layout composition components instead.`);
      }
    }
    for (const fileCheck of check.fileForbiddenTokens || []) {
      const fullPath = path.join(rootDir, fileCheck.file);
      if (!(await exists(fullPath))) {
        addFailure(`${check.owner} missing file for scoped forbidden-token check: ${fileCheck.file}.`);
        continue;
      }
      const fileText = await readText(fullPath);
      for (const token of fileCheck.tokens || []) {
        if (fileText.includes(token)) {
          addFailure(`${check.owner} ${fileCheck.file} must not include ${token}. Move page control logic into its page hook.`);
        }
      }
    }
  }
}

export async function checkUiGovernance(addFailure) {
  const readmePath = path.join(rootDir, 'apps/web/src/styles/README.md');
  const baselinePath = path.join(rootDir, 'apps/web/src/styles/ui-governance-baseline.json');
  const indexCssPath = path.join(rootDir, 'apps/web/src/index.css');

  if (!(await exists(readmePath))) {
    addFailure('Missing UI style governance guide: apps/web/src/styles/README.md.');
    return;
  }
  if (!(await exists(baselinePath))) {
    addFailure('Missing UI governance baseline: apps/web/src/styles/ui-governance-baseline.json.');
    return;
  }

  const baseline = JSON.parse(await readText(baselinePath));
  const limits = baseline.limits || {};
  const indexCssText = await readText(indexCssPath);
  const surfacesCssText = await readText(path.join(rootDir, 'apps/web/src/styles/surfaces.css'));
  const cssFiles = await collectCssFiles();
  const filesWithText = await Promise.all(cssFiles.map(async (file) => ({ file, text: await readText(file) })));

  await checkComponentInterfaces(addFailure);
  await checkPageContracts(indexCssText, addFailure);
  checkIndexStyleInterface(indexCssText, addFailure);
  requireTextTokens(addFailure, 'apps/web/src/styles/surfaces.css', surfacesCssText, [
    '.domain-card',
    '.domain-header',
    '.domain-summary',
    '.domain-trend',
    '.article-list',
    '.article-item',
    '.chat-input',
    '.newspaper-search',
    '.collection-card',
    '.domain-footer',
    '.with-border',
  ]);

  const pageLayoutText = await readText(path.join(rootDir, 'apps/web/src/components/layout/PageLayout.tsx'));
  if (/export function PageSection[\s\S]*?<span\s*\/>/.test(pageLayoutText)) {
    addFailure('PageSection must not use empty placeholder elements. Use explicit header layout classes instead.');
  }

  addLimitFailure(addFailure, 'index.css class selector count', countIndexClassSelectors(indexCssText), limits.indexCssClassSelectors);
  addLimitFailure(addFailure, 'index.css non-import line count', countIndexNonImportLines(indexCssText), limits.indexCssNonImportLines);

  const previewSelectorFiles = findFilesContaining(filesWithText, /\.preview-[A-Za-z0-9_-]+/);
  addLimitFailure(addFailure, 'preview selector file count', previewSelectorFiles.length, limits.previewSelectorCssFiles);
  const allowedPreviewFiles = new Set(baseline.allowedPreviewSelectorCssFiles || []);
  for (const file of previewSelectorFiles) {
    if (!allowedPreviewFiles.has(file)) {
      addFailure(`Preview selector leaked into non-baselined stylesheet: ${file}. Keep experiments isolated or deliberately migrate the baseline downward.`);
    }
  }

  const sourceFiles = (await listFiles(path.join(rootDir, 'apps/web/src'))).filter((file) => {
    return ['.css', '.ts', '.tsx'].includes(path.extname(file));
  });
  const sourceFilesWithText = await Promise.all(sourceFiles.map(async (file) => ({ file, text: await readText(file) })));
  const sectionHeaderFiles = findFilesContaining(sourceFilesWithText, /\bsection-header\b/);
  addLimitFailure(addFailure, 'generic section-header file count', sectionHeaderFiles.length, limits.genericSectionHeaderFiles);

  const extraViewportShellFiles = filesWithText
    .filter(({ file, text }) => normalizeForLog(file) !== 'apps/web/src/styles/shell.css'
      && /height:\s*100dvh/.test(text)
      && /overflow:\s*hidden/.test(text))
    .map(({ file }) => normalizeForLog(file))
    .sort();
  addLimitFailure(addFailure, 'extra viewport shell file count', extraViewportShellFiles.length, limits.extraViewportShellCssFiles);
  const allowedViewportFiles = new Set(baseline.allowedExtraViewportShellCssFiles || []);
  for (const file of extraViewportShellFiles) {
    if (!allowedViewportFiles.has(file)) {
      addFailure(`Viewport shell rules leaked outside the shell baseline: ${file}. Keep 100dvh/overflow shell ownership in PageLayout/shell.css.`);
    }
  }
}

async function main() {
  const failures = [];
  await checkUiGovernance((message) => failures.push(message));
  if (failures.length > 0) {
    console.error(['UI governance check failed:', ...failures.map((failure) => `- ${failure}`)].join('\n'));
    process.exit(1);
  }
  console.log('UI governance check passed.');
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

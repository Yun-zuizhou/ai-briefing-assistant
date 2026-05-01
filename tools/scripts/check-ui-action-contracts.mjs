import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { rootDir } from './_shared.mjs';

function normalizeForLog(filePath) {
  return filePath.replaceAll(path.sep, '/');
}

async function readProjectFile(relativePath) {
  return readFile(path.join(rootDir, relativePath), 'utf8');
}

function addTokenFailures(addFailure, contractName, relativePath, text, tokens = []) {
  for (const token of tokens) {
    if (!text.includes(token)) {
      addFailure(`UI action contract "${contractName}" is missing ${JSON.stringify(token)} in ${relativePath}.`);
    }
  }
}

function addPatternFailures(addFailure, contractName, relativePath, text, patterns = []) {
  for (const pattern of patterns) {
    if (!pattern.test(text)) {
      addFailure(`UI action contract "${contractName}" is missing pattern ${pattern} in ${relativePath}.`);
    }
  }
}

const actionContracts = [
  {
    name: 'Today headline content handoff',
    checks: [
      {
        file: 'apps/web/src/pages/useTodayPageLogic.ts',
        tokens: [
          'resolveLeadArticleContentType',
          'const leadContentType = resolveLeadArticleContentType(leadItem?.contentRef);',
          'if (leadItem?.contentRef && leadContentType)',
          'navigate(`/article?ref=${encodeURIComponent(leadItem.contentRef)}`',
          "contentType: leadContentType",
          "navigate('/history-brief'",
        ],
      },
      {
        file: 'apps/edge-worker/src/services/dashboard/today-briefing-payload.ts',
        tokens: [
          'resolveLeadItemType',
          "refType === 'hot_topic' || refType === 'article' || refType === 'opportunity'",
          "resolveLeadItemType(firstSource?.contentRef, 'briefing')",
        ],
      },
    ],
  },
  {
    name: 'Article favorite toggle',
    checks: [
      {
        file: 'apps/web/src/pages/ArticlePage.tsx',
        tokens: [
          'ArticleMainContent',
          'onCollect={() => void handleCollect()}',
        ],
      },
      {
        file: 'apps/web/src/components/business/article/controls.tsx',
        tokens: [
          'onClick={onCollect}',
          'onClick={onOpenOriginal}',
          'onClick={onShare}',
        ],
      },
      {
        file: 'apps/web/src/pages/useArticlePageLogic.ts',
        tokens: [
          'apiService.createFavorite',
          'apiService.deleteFavorite',
          'content_ref: activeArticle.contentRef',
          "showTemporaryToast('已收藏')",
          "showTemporaryToast('已取消收藏')",
        ],
      },
      {
        file: 'apps/web/src/services/apiDomains/behavior.ts',
        tokens: [
          "request<FavoriteApiItem>('/favorites'",
          "method: 'POST'",
          'request<{ success: boolean; message: string }>(`/favorites/${id}`',
          "method: 'DELETE'",
        ],
      },
      {
        file: 'apps/edge-worker/tests/favorites.route.test.ts',
        tokens: [
          'creates favorite from content_ref when no existing record is found',
          "withSession({ method: 'DELETE' })",
          '/api/v1/favorites',
        ],
      },
    ],
  },
  {
    name: 'Settings persisted controls',
    checks: [
      {
        file: 'apps/web/src/pages/SettingsPage.tsx',
        tokens: [
          'useSettingsPageLogic',
          '<SettingsGroupList groups={settingsGroups} />',
        ],
      },
      {
        file: 'apps/web/src/components/business/settings.tsx',
        tokens: [
          'onClick={control.onToggle}',
          'onChange={(event) => control.onChange(event.target.value)}',
        ],
      },
      {
        file: 'apps/web/src/pages/useSettingsPageLogic.ts',
        tokens: [
          'apiService.updateUserSettings(nextSettings)',
          'setSettingsSnapshot(previousSettings)',
          'setMorningPushTime(previousSettings.morning_brief_time)',
          'setSoundEnabled(previousSettings.sound_enabled)',
          'setVibrationEnabled(previousSettings.vibration_enabled)',
        ],
      },
      {
        file: 'apps/web/src/services/apiDomains/preferences.ts',
        tokens: [
          "request<UserSettingsPayload>('/preferences/settings'",
          "method: 'PUT'",
        ],
      },
      {
        file: 'apps/edge-worker/tests/preferences.route.test.ts',
        tokens: [
          'syncs morning schedule fact layer when updating settings',
          '/api/v1/preferences/settings',
          "method: 'PUT'",
        ],
      },
    ],
  },
  {
    name: 'Profile generation refresh',
    checks: [
      {
        file: 'apps/web/src/pages/ProfilePage.tsx',
        tokens: [
          'onGenerate={() => void handleGenerateProfile()}',
          'ProfileGenerateCard',
        ],
      },
      {
        file: 'apps/web/src/components/business/profile.tsx',
        tokens: [
          'onClick={onGenerate}',
          'loading={generating}',
          'disabled={loading || !aiStatus.canRegenerate}',
        ],
      },
      {
        file: 'apps/web/src/pages/useProfilePageLogic.ts',
        tokens: [
          'apiService.generateUserProfile()',
          'apiService.getUserProfile()',
          'setGenerating(true)',
          'setGenerating(false)',
        ],
      },
      {
        file: 'apps/web/src/services/apiDomains/preferences.ts',
        tokens: [
          "request<UserProfileGeneratePayload>('/preferences/profile/generate'",
          "method: 'POST'",
        ],
      },
      {
        file: 'apps/edge-worker/tests/preferences.route.test.ts',
        tokens: [
          'generates AI profile with evidence refs and persists the result',
          '/api/v1/preferences/profile/generate',
          "method: 'POST'",
        ],
      },
    ],
  },
  {
    name: 'AI digest consult submission',
    checks: [
      {
        file: 'apps/web/src/pages/AiDigestLabPage.tsx',
        tokens: [
          'onConsult={() => void handleConsult()}',
          'consulting={consulting}',
          'onQuestionChange={setQuestion}',
        ],
      },
      {
        file: 'apps/web/src/components/business/aiDigestLab.tsx',
        tokens: [
          'disabled={consulting || !question.trim()}',
          "{consulting ? '咨询中…' : '发送咨询'}",
          '<AiDigestConsultError error={consultError} />',
          '<AiDigestConsultResult result={consultResult} />',
        ],
      },
      {
        file: 'apps/web/src/pages/useAiDigestLabPageLogic.ts',
        tokens: [
          'apiService.consultDigest({',
          'result_ref: activeItem.resultRef',
          'question: question.trim()',
          'setConsulting(true)',
          'setConsulting(false)',
        ],
      },
      {
        file: 'apps/web/src/services/apiDomains/content.ts',
        tokens: [
          "request<DigestConsultResponse>('/content/consult'",
          "method: 'POST'",
        ],
      },
      {
        file: 'apps/edge-worker/tests/content.route.test.ts',
        tokens: [
          'returns 503 when consult provider is not configured',
          'returns consult answer for authenticated user when provider succeeds',
          '/api/v1/content/consult',
        ],
      },
    ],
  },
  {
    name: 'Help feedback submission',
    checks: [
      {
        file: 'apps/web/src/pages/HelpFeedbackPage.tsx',
        tokens: [
          'onSubmit={handleSubmitFeedback}',
          'canSubmit={canSubmit}',
          'submitting={submitting}',
        ],
      },
      {
        file: 'apps/web/src/components/business/helpFeedback.tsx',
        tokens: [
          'onClick={onSubmit}',
          'disabled={!canSubmit || submitting}',
        ],
      },
      {
        file: 'apps/web/src/pages/useHelpFeedbackPageLogic.ts',
        tokens: [
          'apiService.submitFeedback({',
          "source_page: 'help_feedback'",
          'setShowSubmitted(true)',
          'setSubmitError(error instanceof Error ? error.message',
        ],
      },
      {
        file: 'apps/web/src/services/apiDomains/behavior.ts',
        tokens: [
          "request<{ success: boolean; submission: FeedbackSubmission }>('/feedback'",
          "method: 'POST'",
        ],
      },
      {
        file: 'apps/edge-worker/tests/feedback.route.test.ts',
        tokens: [
          'creates feedback submission for current user',
          '/api/v1/feedback',
          "method: 'POST'",
        ],
      },
    ],
  },
  {
    name: 'Interest completion save',
    checks: [
      {
        file: 'apps/web/src/pages/InterestConfigPage.tsx',
        tokens: [
          'onComplete={() => void handleComplete()}',
          'disabled={selectedCount === 0 || disabled}',
          'onToggle={toggleInterest}',
        ],
      },
      {
        file: 'apps/web/src/pages/useInterestConfigPageLogic.ts',
        tokens: [
          'apiService.updateUserInterests(selectedInterests)',
          "navigate('/today')",
          'setSaving(true)',
          'setSaving(false)',
        ],
      },
      {
        file: 'apps/web/src/services/apiDomains/preferences.ts',
        tokens: [
          "request<{ interests: string[] }>('/preferences/interests'",
          "method: 'PUT'",
          'body: JSON.stringify({ interests })',
        ],
      },
      {
        file: 'apps/edge-worker/tests/user-flows.route.test.ts',
        tokens: [
          'supports the Interest Config -> Preferences -> Today recommendation refresh flow',
          '/api/v1/preferences/interests',
          "method: 'PUT'",
        ],
      },
    ],
  },
  {
    name: 'Actions check-in',
    checks: [
      {
        file: 'apps/web/src/pages/ActionsPage.tsx',
        tokens: [
          'onCheckIn={handleCheckIn}',
          'ActionsRhythmSummary',
        ],
      },
      {
        file: 'apps/web/src/components/business/actions.tsx',
        tokens: [
          'onClick={onCheckIn}',
          'checkedInToday',
        ],
      },
      {
        file: 'apps/web/src/pages/useActionsPageLogic.ts',
        tokens: [
          'apiService.checkInToday()',
          'setCheckedInToday(response.data?.checkedInToday ?? true)',
          'setStreakDays(response.data?.streakDays ?? streakDays)',
          'setError(\'今日打卡失败，请稍后重试。\')',
        ],
      },
      {
        file: 'apps/web/src/services/apiDomains/behavior.ts',
        tokens: [
          "request<ActionCheckInData>('/actions/check-in'",
          "method: 'POST'",
        ],
      },
      {
        file: 'apps/edge-worker/tests/actions.route.test.ts',
        tokens: [
          'appends history and returns updated streak on first check-in',
          'does not append history when user already checked in today',
          '/api/v1/actions/check-in',
        ],
      },
    ],
  },
];

export async function checkUiActionContracts(addFailure) {
  for (const contract of actionContracts) {
    for (const check of contract.checks) {
      const file = normalizeForLog(check.file);
      const text = await readProjectFile(file);
      addTokenFailures(addFailure, contract.name, file, text, check.tokens);
      addPatternFailures(addFailure, contract.name, file, text, check.patterns);
    }
  }
}

async function main() {
  const failures = [];
  await checkUiActionContracts((message) => failures.push(message));
  if (failures.length > 0) {
    console.error(['UI action contract check failed:', ...failures.map((failure) => `- ${failure}`)].join('\n'));
    process.exit(1);
  }
  console.log('UI action contract check passed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

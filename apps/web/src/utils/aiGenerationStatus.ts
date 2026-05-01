import type { AnnualReportData, PeriodicReportData } from '../types/page-data';
import type { UserProfilePayload } from '../services/api';

export type AiGenerationStatus =
  | 'idle'
  | 'generating'
  | 'success'
  | 'fallback'
  | 'failed'
  | 'stale'
  | 'readonly';

export interface AiGenerationStatusView {
  status: AiGenerationStatus;
  title: string;
  detail: string;
  actionLabel: string;
  loadingLabel: string;
  canRegenerate: boolean;
}

interface StatusOptions {
  loading?: boolean;
  generating?: boolean;
  readonly?: boolean;
  failed?: boolean;
}

function buildStatusView(params: {
  status: AiGenerationStatus;
  title: string;
  detail: string;
  actionLabel?: string;
  loadingLabel?: string;
  canRegenerate?: boolean;
}): AiGenerationStatusView {
  return {
    actionLabel: params.actionLabel || '重新生成',
    loadingLabel: params.loadingLabel || '生成中',
    canRegenerate: params.canRegenerate ?? false,
    ...params,
  };
}

export function getPeriodicReportAiStatus(
  report: PeriodicReportData | null,
  reportName: '周报' | '月报',
  options: StatusOptions = {},
): AiGenerationStatusView {
  if (options.loading || options.generating) {
    return buildStatusView({
      status: 'generating',
      title: `正在生成 AI ${reportName}解读`,
      detail: '请稍候，生成完成后会自动刷新。',
      canRegenerate: false,
    });
  }

  if (!report) {
    return buildStatusView({
      status: options.failed ? 'failed' : 'idle',
      title: options.failed ? '生成失败' : `暂无 AI ${reportName}解读`,
      detail: options.failed ? '当前没有可展示结果，可稍后重试。' : '可在正式报告生成后再创建 AI 解读。',
      canRegenerate: !options.failed,
    });
  }

  if (options.readonly) {
    return buildStatusView({
      status: 'readonly',
      title: report.llmBlocks ? `历史 AI ${reportName}解读` : `历史规则${reportName}`,
      detail: '这是历史生成结果，保留当时内容，不支持重新生成。',
      canRegenerate: false,
    });
  }

  if (report.llmBlocks && report.generationSource === 'llm') {
    return buildStatusView({
      status: 'success',
      title: `已生成可追溯 AI ${reportName}解读`,
      detail: '可查看趋势解释、周期总结、下一步建议和证据来源。',
      canRegenerate: true,
    });
  }

  return buildStatusView({
    status: 'fallback',
    title: `当前为规则${reportName}`,
    detail: `AI 暂未生成或已回退，当前展示规则${reportName}结果。`,
    canRegenerate: true,
  });
}

export function getAnnualReportAiStatus(
  report: AnnualReportData | null,
  options: StatusOptions = {},
): AiGenerationStatusView {
  if (options.loading || options.generating) {
    return buildStatusView({
      status: 'generating',
      title: '正在生成 AI 年度解读',
      detail: '请稍候，年度解读生成完成后会自动刷新。',
      canRegenerate: false,
    });
  }

  if (!report) {
    return buildStatusView({
      status: options.failed ? 'failed' : 'idle',
      title: options.failed ? '生成失败' : '暂无 AI 年度解读',
      detail: options.failed ? '当前没有可展示结果，可稍后重试。' : '可在正式年度报告生成后再创建 AI 解读。',
      canRegenerate: !options.failed,
    });
  }

  if (options.readonly) {
    return buildStatusView({
      status: 'readonly',
      title: report.annualLlmBlocks ? '历史 AI 年度解读' : '历史规则年报',
      detail: '这是历史生成结果，保留当时内容，不支持重新生成。',
      canRegenerate: false,
    });
  }

  if (report.annualLlmBlocks && report.generationSource === 'llm') {
    return buildStatusView({
      status: 'success',
      title: '已生成可追溯 AI 年度解读',
      detail: '可查看思考总结、行动总结、下一年建议和证据来源。',
      canRegenerate: true,
    });
  }

  return buildStatusView({
    status: 'fallback',
    title: '当前为规则年报',
    detail: 'AI 暂未生成或已回退，当前展示规则年报结果。',
    canRegenerate: true,
  });
}

export function getProfileAiStatus(
  profile: UserProfilePayload | null,
  options: StatusOptions = {},
): AiGenerationStatusView {
  if (options.generating) {
    return buildStatusView({
      status: 'generating',
      title: '正在生成 AI 画像',
      detail: '请稍候，画像生成完成后会刷新证据与关键词。',
      canRegenerate: false,
    });
  }

  if (!profile) {
    return buildStatusView({
      status: options.failed ? 'failed' : 'idle',
      title: options.loading ? '画像加载中' : options.failed ? '画像生成失败' : '暂无 AI 画像',
      detail: options.failed ? '当前没有可展示画像，可稍后重试。' : '可基于真实记录、收藏、任务与关注生成画像。',
      canRegenerate: !options.loading,
    });
  }

  if (profile.ai_generated) {
    return buildStatusView({
      status: 'success',
      title: '已生成可追溯 AI 画像',
      detail: profile.persona_generated_at
        ? `生成时间：${profile.persona_generated_at}`
        : '已基于当前事实生成画像。',
      canRegenerate: true,
    });
  }

  return buildStatusView({
    status: 'fallback',
    title: '当前为规则画像',
    detail: profile.persona_generated_at
      ? `生成时间：${profile.persona_generated_at}`
      : '可使用已配置的大模型基于真实记录重新生成画像。',
    canRegenerate: true,
  });
}

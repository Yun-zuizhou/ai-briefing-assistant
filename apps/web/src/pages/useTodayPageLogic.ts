import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';
import type { TodayPageData } from '../types/page-data';
import { normalizeArticleState } from '../utils/articleDisplay';
import { formatContentTypeLabel } from '../utils/contentLabels';

export function buildReadableSummary(pageData: TodayPageData | null): string {
  if (!pageData) {
    return '正在为你整理今天的简报摘要。';
  }

  const summary = pageData.summary.summaryText
    .replace(/当前 Today 已进入真实聚合阶段[，,]但部分排序和内容补齐仍在继续收口。?/g, '')
    .replace(/当前.*?过渡态加工规则。?/g, '')
    .replace(/真实热点/g, '重点报道')
    .replace(/真实机会池/g, '补充线索')
    .replace(/值得行动的机会/g, '补充线索')
    .replace(/今天先看\s*(\d+)\s*条内容，再处理\s*(\d+)\s*个可行动机会。?/g, '今天为你整理了 $1 条重点报道。你可以先看摘要，再打开具体报道核对原文。')
    .trim();

  if (summary.length > 0) return summary;

  return pageData.worthKnowing.length > 0
    ? `今天为你整理了 ${pageData.worthKnowing.length} 条重点报道和 ${pageData.recommendedForYou.length} 组关注相关内容。你可以先看摘要，再打开具体报道核对原文。`
    : '今天暂时没有足够新内容形成简报摘要。你可以更新关注领域，或稍后等待下一次同步。';
}

export function getActionTypeLabel(type: TodayPageData['worthActing'][number]['actionType']): string {
  const labels: Record<TodayPageData['worthActing'][number]['actionType'], string> = {
    apply: '可申请',
    follow: '可跟进',
    submit: '可提交',
    read_later: '稍后读',
    create_todo: '可转待办',
  };
  return labels[type] ?? '可行动';
}

export function formatDateLabel(value?: string): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

type LeadArticleContentType = 'hot_topic' | 'article' | 'opportunity';

type TodayRecommendedTopItem = TodayPageData['recommendedForYou'][number]['topItems'][number];
type TodayKnowledgeItem = TodayPageData['worthKnowing'][number];
type TodayActionItem = TodayPageData['worthActing'][number];

export interface TodayReadingReportItem extends TodayRecommendedTopItem {
  display: {
    sourceLabel: string;
  };
}

export interface TodayReadingGroup {
  id: string;
  title: string;
  items: TodayReadingReportItem[];
}

export interface TodayAuxiliaryFlow {
  actionItems: Array<TodayActionItem & { featured: boolean }>;
  hasActionItems: boolean;
  hasKnowledgeItems: boolean;
  knowledgeItems: Array<TodayKnowledgeItem & { featured: boolean }>;
}

export interface TodayInformationFlow {
  auxiliary: TodayAuxiliaryFlow;
  groupedReports: TodayReadingGroup[];
  headline: {
    primaryActionLabel: string;
    relevanceLabel?: string;
    secondaryActionLabel: string;
    sourceLabel?: string;
    summary: string;
    title: string;
  };
  overview: {
    statusLabel?: string;
    text: string;
  };
  shouldShowContent: boolean;
  extensionSlots: NonNullable<TodayPageData['extensionSlots']>;
}

const TODAY_INFORMATION_BOUNDARIES = {
  showInMainFlow: ['overview', 'headline', 'groupedReports'],
  showInAuxiliaryFlow: ['knowledgeItems', 'quickNoteEntry', 'conversationEntry', 'actionItems'],
  keepOutOfReadingFlow: [
    'aiBriefing.provider',
    'aiBriefing.model',
    'recommendationReason',
    'processingNote',
    'qualityScore',
    'matchScore',
    'rankingScore',
    'processingStage',
  ],
} as const;

export function resolveLeadArticleContentType(contentRef?: string): LeadArticleContentType | null {
  const [refType, refId] = contentRef?.split(':') ?? [];
  if (refType === 'hot_topic' || refType === 'article' || refType === 'opportunity') {
    return refId ? refType : null;
  }
  return null;
}

export function useTodayPageLogic() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<TodayPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setError(null);
        const response = await apiService.getTodayPageData();
        if (response.error) {
          throw new Error(response.error);
        }
        setPageData(response.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '简报暂时加载失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    void fetchPageData();
  }, []);

  const shouldShowContentSections = Boolean(pageData);
  const extensionSlots = pageData?.extensionSlots ?? [];
  const leadItem = pageData?.leadItem?.itemType === 'opportunity' ? null : pageData?.leadItem ?? null;
  const leadKnowledge = pageData?.worthKnowing[0] ?? null;
  const leadTitle = leadItem?.title ?? leadKnowledge?.title ?? '今日简报正在整理头版摘要';
  const leadSummary = leadItem?.summary
    ?? leadKnowledge?.summary
    ?? buildReadableSummary(pageData);
  const readableSummary = buildReadableSummary(pageData);
  const groupedReports: TodayReadingGroup[] = (pageData?.recommendedForYou.slice(0, 2) ?? [])
    .map((group) => ({
      id: group.interestName,
      title: group.interestName,
      items: group.topItems
      .filter((topItem) => topItem.contentType !== 'opportunity')
      .slice(0, 2)
      .map((topItem) => ({
        ...topItem,
        display: {
          sourceLabel: topItem.sourceName || formatContentTypeLabel(topItem.contentType),
        },
      })),
    }))
    .filter((group) => group.items.length > 0);
  const visibleKnowledgeItems = (pageData?.worthKnowing.slice(0, 3) ?? []).map((item, index) => ({
    ...item,
    featured: index === 0,
  }));
  const visibleActionItems = (pageData?.worthActing.slice(0, 1) ?? []).map((item, index) => ({
    ...item,
    featured: index === 0,
  }));
  const informationFlow: TodayInformationFlow = {
    auxiliary: {
      actionItems: visibleActionItems,
      hasActionItems: (pageData?.worthActing.length ?? 0) > 0,
      hasKnowledgeItems: (pageData?.worthKnowing.length ?? 0) > 0,
      knowledgeItems: visibleKnowledgeItems,
    },
    groupedReports,
    headline: {
      primaryActionLabel: leadItem?.primaryActionLabel ?? (leadKnowledge ? '查看报道' : '查看详情'),
      relevanceLabel: leadItem?.relevanceLabel ?? leadKnowledge?.relevanceReason,
      secondaryActionLabel: leadItem?.secondaryActionLabel ?? '记下想法',
      sourceLabel: leadItem?.sourceLabel ?? leadKnowledge?.sourceName,
      summary: leadSummary,
      title: leadTitle,
    },
    overview: {
      statusLabel: pageData?.aiBriefing ? (pageData.aiBriefing.status === 'success' ? 'AI 简报已生成' : '规则简报') : undefined,
      text: readableSummary,
    },
    shouldShowContent: shouldShowContentSections,
    extensionSlots,
  };
  const handleWorthKnowingClick = useCallback((item: TodayPageData['worthKnowing'][number]) => {
    navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`, {
      state: {
        article: normalizeArticleState({
          contentRef: item.contentRef,
          id: String(item.id),
          title: item.title,
          source: item.sourceName,
          url: item.sourceUrl,
          summary: item.summary,
          category: item.categoryLabels?.[0],
          contentType: item.contentType,
        }),
      },
    });
  }, [navigate]);

  const handleRecommendedContentClick = useCallback((
    item: TodayPageData['recommendedForYou'][number]['topItems'][number],
  ) => {
    navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`, {
      state: {
        article: normalizeArticleState({
          contentRef: item.contentRef,
          id: String(item.id),
          title: item.title,
          source: item.sourceName,
          url: item.sourceUrl,
          summary: item.summary,
          contentType: item.contentType,
        }),
      },
    });
  }, [navigate]);

  const handleWorthActingClick = useCallback((item: TodayPageData['worthActing'][number]) => {
    navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`, {
      state: {
        article: normalizeArticleState({
          contentRef: item.contentRef,
          id: String(item.id),
          title: item.title,
          source: item.actionType,
          summary: item.summary,
          contentType: 'opportunity',
        }),
      },
    });
  }, [navigate]);

  const handleAskAboutLead = useCallback(() => {
    const sourceRef = leadItem?.contentRef ?? leadKnowledge?.contentRef;
    navigate('/chat', {
      state: {
        presetInput: `帮我继续分析：${leadTitle}`,
        sourceContentRef: sourceRef,
        sourceTitle: leadTitle,
      },
    });
  }, [leadItem, leadKnowledge, leadTitle, navigate]);

  const handleOpenLead = useCallback(() => {
    const leadContentType = resolveLeadArticleContentType(leadItem?.contentRef);
    if (leadItem?.contentRef && leadContentType) {
      navigate(`/article?ref=${encodeURIComponent(leadItem.contentRef)}`, {
        state: {
          article: normalizeArticleState({
            contentRef: leadItem.contentRef,
            id: leadItem.contentRef.split(':')[1] ?? leadItem.contentRef,
            title: leadItem.title,
            source: leadItem.sourceLabel ?? formatContentTypeLabel(leadContentType),
            summary: leadItem.summary,
            contentType: leadContentType,
          }),
        },
      });
      return;
    }
    if (leadItem?.itemType === 'briefing') {
      navigate('/history-brief', {
        state: {
          leadBriefing: {
            contentRef: leadItem.contentRef,
            title: leadItem.title,
            summary: leadItem.summary,
          },
        },
      });
      return;
    }
    if (leadKnowledge) {
      handleWorthKnowingClick(leadKnowledge);
      return;
    }
    navigate('/hot-topics');
  }, [handleWorthKnowingClick, leadItem, leadKnowledge, navigate]);

  const handleQuickNote = useCallback(() => {
    navigate('/chat', {
      state: {
        presetInput: pageData?.quickNoteEntry.suggestedPrompt ?? '记下今天最值得以后回看的那句话。',
      },
    });
  }, [navigate, pageData]);

  const handleAskAboutBriefing = useCallback(() => {
    const sourceRef = leadItem?.contentRef ?? leadKnowledge?.contentRef;
    navigate('/chat', {
      state: {
        presetInput: `围绕今天这份简报，帮我继续分析：${leadTitle}`,
        sourceContentRef: sourceRef,
        sourceTitle: leadTitle,
      },
    });
  }, [leadItem, leadKnowledge, leadTitle, navigate]);

  const handleCreateTodoFromAction = useCallback((item: TodayPageData['worthActing'][number]) => {
    navigate('/chat', {
      state: {
        presetInput: `帮我把这条机会转成待办：${item.title}`,
        sourceContentRef: item.contentRef,
        sourceTitle: item.title,
      },
    });
  }, [navigate]);

  const handleExtensionSlotClick = useCallback((slot: NonNullable<TodayPageData['extensionSlots']>[number]) => {
    if (slot.deepLink) {
      navigate(slot.deepLink);
      return;
    }
    switch (slot.slotType) {
      case 'ask':
        handleAskAboutBriefing();
        break;
      case 'save':
        handleQuickNote();
        break;
      case 'todo':
        navigate('/todo');
        break;
      case 'review':
        navigate('/history-brief');
        break;
    }
  }, [handleAskAboutBriefing, handleQuickNote, navigate]);

  return {
    error,
    handleAskAboutLead,
    handleAskAboutBriefing,
    handleCreateTodoFromAction,
    handleExtensionSlotClick,
    handleOpenHotTopics: () => navigate('/hot-topics'),
    handleOpenLead,
    handleOpenTodo: () => navigate('/todo'),
    handleQuickNote,
    handleRecommendedContentClick,
    handleWorthActingClick,
    handleWorthKnowingClick,
    informationFlow,
    loading,
    pageData,
    todayInformationBoundaries: TODAY_INFORMATION_BOUNDARIES,
  };
}

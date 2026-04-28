import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Masthead, PageContent, PageLayout } from '../components/layout';
import {
  TodayContentCard,
  TodayEmptyCard,
  TodayErrorState,
  TodayFocusBar,
  TodayGrid,
  TodayInfoBox,
  TodayLeadCard,
  TodayLoadingState,
  TodaySection,
  TodaySectionHeader,
} from '../components/business/today';
import { Button, Tag } from '../components/ui';
import type { TodayPageData } from '../types/page-data';
import { apiService } from '../services/api';

function buildReadableSummary(pageData: TodayPageData | null): string {
  if (!pageData) {
    return '正在为你整理今天最重要的内容。';
  }

  const summary = pageData.summary.summaryText
    .replace(/当前 Today 已进入真实聚合阶段[，,]但部分排序和内容补齐仍在继续收口。?/g, '')
    .replace(/当前.*?过渡态加工规则。?/g, '')
    .trim();

  if (summary.length > 0) return summary;

  return `今天先看 ${pageData.worthKnowing.length} 条内容，再处理 ${pageData.worthActing.length} 个可行动机会。`;
}

function getActionTypeLabel(type: TodayPageData['worthActing'][number]['actionType']): string {
  const labels: Record<TodayPageData['worthActing'][number]['actionType'], string> = {
    apply: '可申请',
    follow: '可跟进',
    submit: '可提交',
    read_later: '稍后读',
    create_todo: '可转待办',
  };
  return labels[type] ?? '可行动';
}

function formatDateLabel(value?: string): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

export default function TodayPage() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<TodayPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldShowContentSections = Boolean(pageData) || !loading;
  const knowledgeCount = pageData?.worthKnowing.length ?? 0;
  const actionCount = pageData?.worthActing.length ?? 0;
  const recommendationCount = pageData?.recommendedForYou.length ?? 0;
  const leadItem = pageData?.leadItem ?? null;
  const leadKnowledge = pageData?.worthKnowing[0] ?? null;
  const leadAction = pageData?.worthActing[0] ?? null;
  const leadTitle = leadItem?.title ?? leadKnowledge?.title ?? leadAction?.title ?? '今天先抓住一件重要的事';
  const leadSummary = leadItem?.summary
    ?? leadKnowledge?.summary
    ?? leadAction?.summary
    ?? buildReadableSummary(pageData);
  const visibleExtensionSlots = pageData?.extensionSlots?.slice(0, 2) ?? [];
  const visibleKnowledgeItems = pageData?.worthKnowing.slice(0, 3) ?? [];
  const visibleActionItems = pageData?.worthActing.slice(0, 2) ?? [];
  const visibleRecommendations = pageData?.recommendedForYou.slice(0, 2) ?? [];
  const todaySections = [
    { id: 'today-overview', label: '重点', meta: loading ? '同步中' : `${knowledgeCount + actionCount} 条` },
    { id: 'today-knowledge', label: '知道', meta: `${knowledgeCount} 条` },
    { id: 'today-action', label: '行动', meta: `${actionCount} 条` },
    { id: 'today-recommend', label: '关注', meta: `${recommendationCount} 组` },
    { id: 'today-note', label: '速记', meta: '入口' },
  ];

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    const container = document.querySelector<HTMLElement>('.today-page-content');
    if (!target || !container) return;

    const targetTop = target.getBoundingClientRect().top
      - container.getBoundingClientRect().top
      + container.scrollTop
      - 8;
    container.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

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
        setError(err instanceof Error ? err.message : '今日内容暂时加载失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    void fetchPageData();
  }, []);

  const handleWorthKnowingClick = (item: TodayPageData['worthKnowing'][number]) => {
    navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`, {
      state: {
        article: {
          contentRef: item.contentRef,
          id: String(item.id),
          title: item.title,
          source: item.sourceName,
          url: item.sourceUrl,
          summary: item.summary,
          category: item.categoryLabels?.[0] || item.contentType,
          contentType: item.contentType,
        },
      },
    });
  };

  const handleRecommendedContentClick = (
    item: TodayPageData['recommendedForYou'][number]['topItems'][number],
  ) => {
    navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`, {
      state: {
        article: {
          contentRef: item.contentRef,
          id: String(item.id),
          title: item.title,
          source: item.sourceName,
          url: item.sourceUrl,
          summary: item.summary,
          category: item.contentType,
          contentType: item.contentType,
        },
      },
    });
  };

  const handleWorthActingClick = (item: TodayPageData['worthActing'][number]) => {
    navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`, {
      state: {
        article: {
          contentRef: item.contentRef,
          id: String(item.id),
          title: item.title,
          source: item.actionType,
          summary: item.summary,
          category: 'opportunity',
          contentType: 'opportunity',
        },
      },
    });
  };

  const handleAskAboutLead = () => {
    const sourceRef = leadItem?.contentRef ?? leadKnowledge?.contentRef ?? leadAction?.contentRef;
    navigate('/chat', {
      state: {
        presetInput: `帮我继续分析：${leadTitle}`,
        sourceContentRef: sourceRef,
        sourceTitle: leadTitle,
      },
    });
  };

  const handleOpenLead = () => {
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
    if (leadItem?.contentRef) {
      navigate(`/article?ref=${encodeURIComponent(leadItem.contentRef)}`, {
        state: {
          article: {
            contentRef: leadItem.contentRef,
            id: leadItem.contentRef.split(':')[1] ?? leadItem.contentRef,
            title: leadItem.title,
            source: leadItem.sourceLabel ?? leadItem.itemType,
            summary: leadItem.summary,
            category: leadItem.itemType,
            contentType: leadItem.itemType,
          },
        },
      });
      return;
    }
    if (leadKnowledge) {
      handleWorthKnowingClick(leadKnowledge);
      return;
    }
    if (leadAction) {
      handleWorthActingClick(leadAction);
      return;
    }
    navigate('/hot-topics');
  };

  return (
    <PageLayout variant="main" className="today-mobile-shell">
      <Masthead
        title={pageData?.pageTitle ?? '今日'}
        subtitle={pageData?.pageSubtitle ?? '今日简报'}
        ornaments={['✦ TODAY ✦', '✦ DIGEST ✦']}
        meta="TODAY'S BRIEFING"
      />

      <nav className="today-section-nav" aria-label="今日章节导航">
        {todaySections.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="unstyled"
            className="today-section-nav-btn"
            onClick={() => scrollToSection(item.id)}
          >
            <span>{item.label}</span>
            <em>{item.meta}</em>
          </Button>
        ))}
      </nav>

      <PageContent className="today-page-content">
        {error ? (
          <TodayErrorState message={error} />
        ) : null}

        <TodaySection className="today-section-overview" id="today-overview">
          <TodayLeadCard
            loading={loading}
            kicker={leadItem?.itemType === 'opportunity' || (!leadItem && !leadKnowledge) ? '今天先做' : '今天先看'}
            title={leadTitle}
            summary={leadSummary}
            sourceLabel={leadItem?.sourceLabel ?? leadKnowledge?.sourceName ?? (leadAction ? getActionTypeLabel(leadAction.actionType) : undefined)}
            relevanceLabel={leadItem?.relevanceLabel ?? leadKnowledge?.relevanceReason ?? leadAction?.whyRelevant}
            primaryActionLabel={leadItem?.primaryActionLabel ?? (leadKnowledge ? '打开内容' : '查看机会')}
            secondaryActionLabel={leadItem?.secondaryActionLabel ?? '记下想法'}
            onPrimaryAction={handleOpenLead}
            onAsk={handleAskAboutLead}
            onSecondaryAction={() => navigate('/chat', {
              state: {
                presetInput: pageData?.quickNoteEntry.suggestedPrompt ?? '记下今天最值得以后回看的那句话。',
              },
            })}
          />
          <TodayFocusBar
            knowledgeCount={knowledgeCount}
            actionCount={actionCount}
            recommendationCount={recommendationCount}
          />
          <TodayInfoBox className="today-info-box-summary">
            <p className="today-summary-text">{buildReadableSummary(pageData)}</p>
            {visibleExtensionSlots.length > 0 ? (
              <div className="today-extension-row">
                {visibleExtensionSlots.map((slot) => (
                  <Button
                    key={`${slot.slotType}-${slot.title}`}
                    type="button"
                    variant="unstyled"
                    className="action-chip"
                    onClick={() => navigate(slot.deepLink ?? '/chat', {
                      state: {
                        presetInput: slot.description,
                        sourceContentRef: slot.sourceContentRef,
                        sourceTitle: slot.title,
                      },
                    })}
                  >
                    {slot.actionLabel}
                  </Button>
                ))}
              </div>
            ) : null}
          </TodayInfoBox>
        </TodaySection>

        {loading && !pageData ? (
          <TodayLoadingState />
        ) : null}

        {shouldShowContentSections ? (
          <>
            <TodaySection className="today-section-knowledge" id="today-knowledge">
              <TodaySectionHeader
                title="值得知道的"
                actionLabel="查看全部 →"
                onAction={() => navigate('/hot-topics')}
              />
              <TodayGrid>
                {visibleKnowledgeItems.map((item) => (
                  <TodayContentCard
                    key={item.id}
                    eyebrow={item.sourceName}
                    title={item.title}
                    summary={item.summary}
                    meta={item.hotScore ? <span className="micro-meta today-knowledge-hot">热度 {item.hotScore}</span> : null}
                    onClick={() => handleWorthKnowingClick(item)}
                    featured={pageData?.worthKnowing[0]?.id === item.id}
                  />
                ))}
                {!loading && (pageData?.worthKnowing.length ?? 0) === 0 ? (
                  <TodayEmptyCard text="当前没有可展示的热点内容。" />
                ) : null}
              </TodayGrid>
            </TodaySection>

              <TodaySection className="today-section-action" id="today-action">
              <TodaySectionHeader
                title="值得行动的"
                actionLabel="去行动 →"
                onAction={() => navigate('/todo')}
              />
              <TodayGrid>
                {visibleActionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`content-card today-action-card ${pageData?.worthActing[0]?.id === item.id ? 'featured' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleWorthActingClick(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleWorthActingClick(item);
                      }
                    }}
                  >
                    <div className="today-action-head">
                      <span className="today-action-type">{getActionTypeLabel(item.actionType)}</span>
                      {item.deadline ? <span className="today-action-deadline">截止 {formatDateLabel(item.deadline)}</span> : null}
                    </div>
                    <div className="content-title today-action-title">
                      {item.title}
                    </div>
                    <p className="content-summary today-action-summary">
                      {item.summary ?? '暂无摘要'}
                    </p>
                    <p className="micro-meta today-action-reason">
                      {item.whyRelevant}
                    </p>
                    <div className="today-action-foot">
                      <span className="micro-meta today-action-reward">{item.reward ?? '回报待定'}</span>
                      <Button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate('/chat', {
                            state: {
                              presetInput: `帮我把这条机会转成待办：${item.title}`,
                              sourceContentRef: item.contentRef,
                              sourceTitle: item.title,
                            },
                          });
                        }}
                        variant="unstyled"
                        className="action-chip primary"
                      >
                        {item.nextActionLabel}
                      </Button>
                    </div>
                  </div>
                ))}
                {!loading && (pageData?.worthActing.length ?? 0) === 0 ? (
                  <TodayEmptyCard text="当前没有可行动的机会内容。" />
                ) : null}
              </TodayGrid>
            </TodaySection>

              <TodaySection className="today-section-recommend" id="today-recommend">
              <TodaySectionHeader title="因你关注而推荐" />
              <TodayInfoBox className="today-info-box-recommend">
                {(pageData?.recommendedForYou.length ?? 0) > 0 ? (
                  <>
                    <p className="content-summary today-recommend-lead">
                      {pageData?.recommendedForYou[0]?.recommendationReason ?? '当前已为你保留与关注项最相关的内容。'}
                    </p>
                    <div className="action-row">
                      {visibleRecommendations.map((item) => (
                        <Tag key={item.interestName}>{item.interestName}</Tag>
                      ))}
                    </div>
                    <div className="today-recommend-grid">
                      {pageData?.recommendedForYou.flatMap((item) =>
                        item.topItems.slice(0, 1).map((topItem) => (
                          <TodayContentCard
                            key={`${item.interestName}-${topItem.contentRef}`}
                            eyebrow={topItem.sourceName || topItem.contentType}
                            title={topItem.title}
                            summary={topItem.summary}
                            meta={null}
                            onClick={() => handleRecommendedContentClick(topItem)}
                            footer={<p className="micro-meta today-recommend-interest">
                              关联兴趣：{item.interestName}
                            </p>}
                          />
                        )),
                      ).slice(0, 2)}
                    </div>
                  </>
                ) : (
                  <p className="content-summary">
                    你还没有稳定关注项。去对话页告诉我你最近想持续追踪什么，我会把今天的内容收束给你。
                  </p>
                )}
              </TodayInfoBox>
            </TodaySection>

              <TodaySection className="today-section-note" id="today-note">
              <TodaySectionHeader title="今日速记" />
              <TodayInfoBox className="today-info-box-note">
                <p className="today-note-text">
                  如果今天只能记下一句话，记最让你在意、最值得以后回看的那句话。
                </p>
                <Button
                  onClick={() => navigate('/chat')}
                  variant="unstyled"
                  className="action-chip accent"
                >
                  去记录
                </Button>
              </TodayInfoBox>
            </TodaySection>
            </>
          ) : null}
      </PageContent>
    </PageLayout>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Masthead, PageBody, PageContent, PageLayout } from '../components/layout';
import type { TodayPageData } from '../types/page-data';
import { apiService } from '../services/api';
import {
  TodayActionCard,
  TodayContentCard,
  TodayEmptyCard,
  TodayErrorState,
  TodayGrid,
  TodayPromptPanel,
  TodayRecommendationPanel,
  TodaySection,
  TodaySectionHeader,
  TodaySummaryCard,
} from '../components/business/today';

export default function TodayPage() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<TodayPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setError(null);
        const response = await apiService.getTodayPageData();
        setPageData(response.data ?? null);
      } catch {
        setError('今日内容暂时加载失败，请稍后重试。');
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

  return (
    <PageLayout variant="main">
      <Masthead
        title={pageData?.pageTitle ?? '今日'}
        subtitle={pageData?.pageSubtitle ?? '今日简报'}
        ornaments={['✦ TODAY ✦', '✦ DIGEST ✦']}
        meta="TODAY'S BRIEFING"
      />

      <PageContent>
        <PageBody>
          {error ? <TodayErrorState message={error} /> : null}

          <TodaySection>
            <TodaySummaryCard
              loading={loading}
              totalCount={(pageData?.worthKnowing.length ?? 0) + (pageData?.worthActing.length ?? 0)}
              summary={pageData?.summary.summaryText ?? '正在为你整理今天最重要的内容。'}
              onRecord={() => navigate('/chat')}
              onBrowseAll={() => navigate('/hot-topics')}
            />
          </TodaySection>

          <TodaySection>
            <TodaySectionHeader
              title="值得知道的"
              actionLabel="查看全部 →"
              onAction={() => navigate('/hot-topics')}
            />
            <TodayGrid>
              {pageData?.worthKnowing.map((item) => (
                <TodayContentCard
                  key={item.id}
                  eyebrow={item.sourceName}
                  title={item.title}
                  summary={item.summary}
                  meta={item.hotScore ? <span className="micro-meta" style={{ color: '#16a34a' }}>热度 {item.hotScore}</span> : null}
                  onClick={() => handleWorthKnowingClick(item)}
                  featured={pageData?.worthKnowing[0]?.id === item.id}
                />
              ))}
              {!loading && (pageData?.worthKnowing.length ?? 0) === 0 ? (
                <TodayEmptyCard text="当前没有可展示的热点内容。" />
              ) : null}
            </TodayGrid>
          </TodaySection>

          <TodaySection>
            <TodaySectionHeader
              title="值得行动的"
              actionLabel="去行动 →"
              onAction={() => navigate('/todo')}
            />
            <TodayGrid>
              {pageData?.worthActing.map((item) => (
                <TodayActionCard
                  key={item.id}
                  actionType={item.actionType}
                  deadline={item.deadline}
                  title={item.title}
                  summary={item.summary}
                  reward={item.reward}
                  featured={pageData?.worthActing[0]?.id === item.id}
                  onOpen={() => handleWorthActingClick(item)}
                  onConvert={() => navigate('/chat', {
                    state: {
                      presetInput: `帮我把这条机会转成待办：${item.title}`,
                      sourceContentRef: item.contentRef,
                      sourceTitle: item.title,
                    },
                  })}
                />
              ))}
              {!loading && (pageData?.worthActing.length ?? 0) === 0 ? (
                <TodayEmptyCard text="当前没有可行动的机会内容。" />
              ) : null}
            </TodayGrid>
          </TodaySection>

          <TodaySection>
            <TodaySectionHeader title="因你关注而推荐" />
            <TodayRecommendationPanel
              reason={pageData?.recommendedForYou[0]?.recommendationReason ?? '当前已为你保留与关注项最相关的内容。'}
              interests={pageData?.recommendedForYou.map((item) => item.interestName)}
              emptyText="你还没有稳定关注项。去对话页告诉我你最近想持续追踪什么，我会把今天的内容收束给你。"
            >
              {pageData?.recommendedForYou.flatMap((item) =>
                item.topItems.slice(0, 1).map((topItem) => (
                  <TodayContentCard
                    key={`${item.interestName}-${topItem.contentRef}`}
                    eyebrow={topItem.sourceName || topItem.contentType}
                    title={topItem.title}
                    summary={topItem.summary}
                    onClick={() => handleRecommendedContentClick(topItem)}
                    footer={(
                      <p className="micro-meta" style={{ margin: '0 0 6px' }}>
                        关联兴趣：{item.interestName}
                      </p>
                    )}
                  />
                )),
              )}
            </TodayRecommendationPanel>
          </TodaySection>

          <TodaySection>
            <TodaySectionHeader title="今日速记" />
            <TodayPromptPanel
              copy="如果今天只能记下一句话，记最让你在意、最值得以后回看的那句话。"
              actionLabel="去记录"
              onAction={() => navigate('/chat')}
            />
          </TodaySection>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}

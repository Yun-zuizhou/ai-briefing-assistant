import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Masthead, PageContent, PageLayout } from '../components/layout';
import type { TodayPageData } from '../types/page-data';
import { apiService } from '../services/api';

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
        {error ? (
          <div className="domain-card" style={{ marginTop: '16px', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '8px' }}>{error}</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>数据同步出现波动，请稍后重试。</p>
          </div>
        ) : null}

        <section className="section" style={{ paddingBottom: '12px' }}>
          <div
            style={{
              padding: '16px',
              background: 'var(--paper-warm)',
              border: '1px solid var(--border)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: '4px',
                border: '1px dashed var(--border)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>今日总述</span>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                  {loading ? '同步中' : `${(pageData?.worthKnowing.length ?? 0) + (pageData?.worthActing.length ?? 0)} 条核心内容`}
                </span>
              </div>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--ink)', marginBottom: '12px' }}>
                {pageData?.summary.summaryText ?? '正在为你整理今天最重要的内容。'}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/chat')}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--ink)',
                    color: 'var(--paper)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  记录一个想法
                </button>
                <button
                  onClick={() => navigate('/hot-topics')}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  查看全部内容
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingBottom: '12px' }}>
          <div className="section-header">
            <span className="section-title">因你关注而推荐</span>
          </div>
          <div
            style={{
              padding: '14px',
              background: 'var(--paper-warm)',
              border: '1px solid var(--border)',
            }}
          >
            {(pageData?.recommendedForYou.length ?? 0) > 0 ? (
              <>
                <p style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '8px', lineHeight: 1.6 }}>
                  {pageData?.recommendedForYou[0]?.recommendationReason ?? '当前已为你保留与关注项最相关的内容。'}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {pageData?.recommendedForYou.map((item) => (
                    <span key={item.interestName} className="tag">
                      {item.interestName}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                  {pageData?.recommendedForYou.flatMap((item) =>
                    item.topItems.map((topItem) => (
                      <div
                        key={`${item.interestName}-${topItem.contentRef}`}
                        style={{
                          padding: '12px',
                          background: 'var(--paper)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleRecommendedContentClick(topItem)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>
                            {topItem.sourceName || topItem.contentType}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '6px' }}>
                          {topItem.title}
                        </div>
                        {topItem.summary ? (
                          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: '0 0 6px' }}>
                            {topItem.summary}
                          </p>
                        ) : null}
                        <p style={{ fontSize: '11px', color: 'var(--ink-muted)', lineHeight: 1.5, margin: '0 0 6px' }}>
                          关联兴趣：{item.interestName}
                        </p>
                      </div>
                    )),
                  )}
                </div>
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                你还没有稳定关注项。去对话页告诉我你最近想持续追踪什么，我会把今天的内容收束给你。
              </p>
            )}
          </div>
        </section>

        <section className="section" style={{ paddingBottom: '12px' }}>
          <div className="section-header">
            <span className="section-title">值得知道的</span>
            <span className="section-more" style={{ cursor: 'pointer' }} onClick={() => navigate('/hot-topics')}>
              查看全部 →
            </span>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {pageData?.worthKnowing.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '14px',
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onClick={() => handleWorthKnowingClick(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>{item.sourceName}</span>
                  {item.hotScore ? <span style={{ fontSize: '11px', color: '#16a34a' }}>热度 {item.hotScore}</span> : null}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '6px' }}>
                  {item.title}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
                  {item.summary}
                </p>
              </div>
            ))}
            {!loading && (pageData?.worthKnowing.length ?? 0) === 0 ? (
              <div className="domain-card" style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>当前没有可展示的热点内容。</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section" style={{ paddingBottom: '12px' }}>
          <div className="section-header">
            <span className="section-title">值得行动的</span>
            <span className="section-more" style={{ cursor: 'pointer' }} onClick={() => navigate('/todo')}>
              去行动 →
            </span>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {pageData?.worthActing.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '14px',
                  background: 'var(--paper-warm)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onClick={() => handleWorthActingClick(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>{item.actionType}</span>
                  {item.deadline ? <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>截止 {item.deadline.slice(0, 10)}</span> : null}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '6px' }}>
                  {item.title}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: '10px' }}>
                  {item.summary ?? '暂无摘要'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--accent)' }}>{item.reward ?? '回报待定'}</span>
                  <button
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
                    style={{
                      padding: '7px 10px',
                      background: 'var(--ink)',
                      color: 'var(--paper)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    转成待办
                  </button>
                </div>
              </div>
            ))}
            {!loading && (pageData?.worthActing.length ?? 0) === 0 ? (
              <div className="domain-card" style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>当前没有可行动的机会内容。</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section" style={{ paddingBottom: '12px' }}>
          <div className="section-header">
            <span className="section-title">今日速记</span>
          </div>
          <div
            style={{
              padding: '14px',
              background: 'var(--paper-warm)',
              border: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '10px' }}>
              如果今天只能记下一句话，记最让你在意、最值得以后回看的那句话。
            </p>
            <button
              onClick={() => navigate('/chat')}
              style={{
                padding: '8px 12px',
                background: 'var(--accent)',
                color: 'var(--paper)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              去记录
            </button>
          </div>
        </section>
      </PageContent>
    </PageLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Masthead, PageBody, PageContent, PageLayout, PagePanel, PageSection, PageSectionHeader } from '../components/layout';
import { useAppContext } from '../context/useAppContext';
import { apiService } from '../services/api';
import type { GrowthOverviewData } from '../types/page-data';
import { formatSubtitleWithLunar } from '../utils/lunarCalendar';

const HISTORY_TYPE_LABELS: Record<string, string> = {
  briefing: '简报',
  journal: '记录',
  action: '行动',
};

export default function GrowthPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [growthData, setGrowthData] = useState<GrowthOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subtitle = formatSubtitleWithLunar();

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getGrowthOverview();
        if (response.error) {
          throw new Error(response.error);
        }
        setGrowthData(response.data ?? null);
      } catch {
        setError('成长内容暂时加载失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    void fetchGrowthData();
  }, []);

  const activeInterests = useMemo(
    () => (growthData?.keywords ?? []).map((item) => item.keyword).filter(Boolean).slice(0, 4),
    [growthData?.keywords],
  );
  const recentKeywords = useMemo(() => {
    return (growthData?.keywords ?? []).map((item) => item.keyword).filter(Boolean).slice(0, 6);
  }, [growthData?.keywords]);
  const recentHistory = growthData?.recentHistoryItems ?? [];
  const notesCount = growthData?.totalThoughts ?? 0;
  const historyCount = recentHistory.length;
  const weeklySummary =
    growthData?.weeklySummary.growthSummary
    ?? '这一阶段你已经把信息输入逐步转成了真实的记录与历史痕迹。当前最明显的成长方向，是从“看内容”进入“留下痕迹、形成回顾”。';
  const personaSummary =
    growthData?.persona.personaSummary
    ?? '你正在从“被动关注者”转向“会记录、会行动、会回看的持续探索者”。';
  const reportEntries = growthData?.reports ?? [
    { reportType: 'weekly', reportTitle: '周报', available: true },
    { reportType: 'monthly', reportTitle: '月报', available: true },
    { reportType: 'annual', reportTitle: '年度报告', available: true },
  ];
  const reportPathMap: Record<string, string> = {
    weekly: '/weekly-report',
    monthly: '/monthly-report',
    annual: '/annual-report',
  };
  const displayName = user.isLoggedIn ? user.username : (growthData?.userName || '用户');

  return (
    <PageLayout variant="secondary">
      <Masthead
        title="成长"
        subtitle={subtitle}
        ornaments={['✦ GROWTH ✦', '✦ REVIEW ✦']}
        metaLinks={[
          { label: '日志', onClick: () => navigate('/log') },
          { label: '画像', onClick: () => navigate('/profile') },
          { label: '历史', onClick: () => navigate('/history-logs') },
          { label: '简报', onClick: () => navigate('/history-brief') },
        ]}
      />

      <PageContent>
        <PageBody>
          {error ? (
            <PageSection compact>
              <PagePanel tone="accent" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '8px' }}>{error}</p>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>数据同步出现波动，稍后重试可恢复最新内容。</p>
              </PagePanel>
            </PageSection>
          ) : null}

          <PageSection compact>
            <PagePanel>
              <div className="page-feature-row">
                <div className="page-feature-badge">
                  {Math.max(activeInterests.length, 1)}
                </div>
                <div className="page-feature-copy">
                  <h3 className="page-feature-title">{displayName}</h3>
                  <p className="page-feature-meta">
                    已有 {notesCount} 条真实记录 · {historyCount} 条近期回看
                  </p>
                </div>
              </div>
            </PagePanel>
          </PageSection>

          <PageSection>
            <PageSectionHeader title="本周成长摘要" />
            <PagePanel>
              <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.7, marginBottom: '8px' }}>
                {weeklySummary}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeInterests.length > 0 ? activeInterests.slice(0, 4).map((interest: string) => (
                  <span key={interest} className="tag">{interest}</span>
                )) : (
                  <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>当前还没有稳定成长关键词</span>
                )}
              </div>
            </PagePanel>
          </PageSection>

          <PageSection>
            <PageSectionHeader title="最近记录关键词" />
            <PagePanel>
              {loading ? (
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>加载中...</p>
              ) : recentKeywords.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {recentKeywords.map((keyword: string) => (
                    <span key={keyword} className="tag">{keyword}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>当前还没有带标签的真实记录。</p>
              )}
            </PagePanel>
          </PageSection>

          <PageSection>
            <PageSectionHeader
              title="一句话画像"
              action={(
                <button type="button" className="section-more" style={{ background: 'none', border: 'none' }} onClick={() => navigate('/profile')}>
                  查看详情 <ChevronRight size={14} />
                </button>
              )}
            />
            <PagePanel>
              <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
                {personaSummary}
              </p>
            </PagePanel>
          </PageSection>

          <PageSection>
            <PageSectionHeader
              title="历史回顾"
              action={(
                <button type="button" className="section-more" style={{ background: 'none', border: 'none' }} onClick={() => navigate('/history-logs')}>
                  查看全部 <ChevronRight size={14} />
                </button>
              )}
            />
            <PagePanel style={{ padding: loading || recentHistory.length === 0 ? '14px' : undefined }}>
              {loading ? (
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>加载中...</p>
              ) : recentHistory.length > 0 ? (
                <div className="article-list">
                  {recentHistory.map((item) => (
                    <div key={`${item.historyType}-${item.historyDate}-${item.historyTitle}`} className="article-item" style={{ padding: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>
                          {HISTORY_TYPE_LABELS[item.historyType] ?? item.historyType}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{item.historyDate}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '4px' }}>
                        {item.historyTitle}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>当前还没有可展示的真实历史记录。</p>
              )}
            </PagePanel>
          </PageSection>

          <PageSection>
            <PageSectionHeader
              title="报告入口"
              action={(
                <button type="button" className="section-more" style={{ background: 'none', border: 'none' }} onClick={() => navigate('/history-brief')}>
                  查看历史 <ChevronRight size={14} />
                </button>
              )}
            />
            <div style={{ display: 'grid', gap: '8px' }}>
              {reportEntries.map((item) => (
                <button
                  key={item.reportType}
                  type="button"
                  onClick={() => navigate(reportPathMap[item.reportType] ?? '/growth')}
                  className="page-entry-button"
                  style={{ opacity: item.available ? 1 : 0.7 }}
                >
                  {item.reportTitle}
                </button>
              ))}
            </div>
          </PageSection>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}

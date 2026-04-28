import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PageContent, PageLayout, Masthead } from '../components/layout';
import { NavigationEntryCard, PageNoticeCard } from '../components/business/common';
import { Button, Tag } from '../components/ui';
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
    <PageLayout variant="main">
      <Masthead
        title="成长"
        subtitle={subtitle}
        ornaments={['✦ GROWTH ✦', '✦ REVIEW ✦']}
        metaLinks={[
          { label: '我的', onClick: () => navigate('/me') },
          { label: '画像', onClick: () => navigate('/profile') },
          { label: '历史', onClick: () => navigate('/history-logs') },
          { label: '简报', onClick: () => navigate('/history-brief') },
        ]}
      />

      <PageContent className="growth-page-content">
        {error ? (
          <PageNoticeCard
            title={error}
            detail="数据同步出现波动，稍后重试可恢复最新内容。"
          />
        ) : null}

        <div className="domain-card growth-profile-card">
          <div className="growth-profile-head">
            <div className="growth-profile-badge">
              {Math.max(activeInterests.length, 1)}
            </div>
            <div className="growth-profile-copy">
              <h3 className="growth-profile-name">
                {displayName}
              </h3>
              <p className="growth-profile-meta">
                已有 {notesCount} 条真实记录 · {historyCount} 条近期回看
              </p>
            </div>
          </div>
        </div>

        <div className="section growth-section">
          <div className="section-header">
            <span className="section-title">本周成长摘要</span>
          </div>
        </div>

        <div className="domain-card growth-weekly-card">
          <p className="growth-summary-text">
            {weeklySummary}
          </p>
          <div className="growth-tag-list">
            {activeInterests.length > 0 ? activeInterests.slice(0, 4).map((interest: string) => (
              <Tag key={interest}>{interest}</Tag>
            )) : (
              <span className="growth-muted-text">当前还没有稳定成长关键词</span>
            )}
          </div>
        </div>

        <div className="section growth-section">
          <div className="section-header">
            <span className="section-title">最近记录关键词</span>
          </div>
        </div>

        <div className="domain-card growth-keyword-card">
          {loading ? (
            <p className="growth-muted-text">加载中...</p>
          ) : recentKeywords.length > 0 ? (
            <div className="growth-tag-list">
              {recentKeywords.map((keyword: string) => (
                <Tag key={keyword}>{keyword}</Tag>
              ))}
            </div>
          ) : (
            <p className="growth-muted-text">当前还没有带标签的真实记录。</p>
          )}
        </div>

        <div className="section growth-section">
          <div className="section-header">
            <span className="section-title">一句话画像</span>
            <Button type="button" variant="text" size="sm" className="section-more" onClick={() => navigate('/profile')}>
              查看详情 <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="domain-card growth-persona-card">
          <p className="growth-summary-text no-bottom">
            {personaSummary}
          </p>
        </div>

        <div className="section growth-section">
          <div className="section-header">
            <span className="section-title">历史回顾</span>
            <Button type="button" variant="text" size="sm" className="section-more" onClick={() => navigate('/history-logs')}>
              查看全部 <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="domain-card growth-history-card">
          {loading ? (
            <div className="growth-history-state">
              <p className="growth-muted-text">加载中...</p>
            </div>
          ) : recentHistory.length > 0 ? (
            <div className="article-list">
              {recentHistory.map((item) => (
                <div key={`${item.historyType}-${item.historyDate}-${item.historyTitle}`} className="article-item growth-history-item">
                  <div className="growth-history-row">
                    <span className="growth-history-type">
                      {HISTORY_TYPE_LABELS[item.historyType] ?? item.historyType}
                    </span>
                    <span className="growth-history-date">{item.historyDate}</span>
                  </div>
                  <div className="growth-history-title">
                    {item.historyTitle}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="growth-history-state">
              <p className="growth-muted-text">当前还没有可展示的真实历史记录。</p>
            </div>
          )}
        </div>

        <div className="section growth-section">
          <div className="section-header">
            <span className="section-title">报告入口</span>
            <Button type="button" variant="text" size="sm" className="section-more" onClick={() => navigate('/history-brief')}>
              查看历史 <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="growth-report-list">
          {reportEntries.map((item) => (
            <NavigationEntryCard
              key={item.reportType}
              onClick={() => navigate(reportPathMap[item.reportType] ?? '/growth')}
              title={item.reportTitle}
              description={item.available ? '进入本周期正式回顾页面' : '当前周期暂未生成正式报告'}
            />
          ))}
        </div>
      </PageContent>
    </PageLayout>
  );
}

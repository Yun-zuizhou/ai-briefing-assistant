import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Masthead, PageBody, PageContent, PageLayout, PagePanel, PageSection, PageSectionHeader } from '../components/layout';
import { useAppContext } from '../context/useAppContext';
import { apiService } from '../services/api';
import type { GrowthOverviewData } from '../types/page-data';
import { formatSubtitleWithLunar } from '../utils/lunarCalendar';

const ENTRY_ITEMS = [
  { label: '我的收藏', description: '查看已经保留下来的热点、文章与机会', path: '/collections' },
  { label: '用户画像', description: '查看当前画像与成长关键词', path: '/profile' },
  { label: '历史日志', description: '回看过去留下的真实历史痕迹', path: '/history-logs' },
  { label: '历史简报', description: '进入周报、月报、年报的历史回看入口', path: '/history-brief' },
  { label: '设置', description: '查看通知设置、帮助反馈与关于信息', path: '/settings' },
  { label: '帮助反馈', description: '查看常见问题并提交意见反馈', path: '/help-feedback' },
] as const;

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAppContext();
  const [growthData, setGrowthData] = useState<GrowthOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subtitle = formatSubtitleWithLunar();

  useEffect(() => {
    const fetchMyPageData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getGrowthOverview();
        if (response.error) {
          throw new Error(response.error);
        }
        setGrowthData(response.data ?? null);
      } catch {
        setError('个人中心暂时加载失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    void fetchMyPageData();
  }, []);

  const displayName = user.isLoggedIn ? user.username : (growthData?.userName || '用户');
  const summaryKeywords = useMemo(
    () => (growthData?.keywords ?? []).map((item) => item.keyword).filter(Boolean).slice(0, 4),
    [growthData?.keywords],
  );
  const notesCount = growthData?.totalThoughts ?? 0;
  const historyCount = growthData?.recentHistoryItems.length ?? 0;
  const personaSummary = growthData?.persona.personaSummary ?? '当前个人沉淀仍在积累中，继续记录与回看会让画像更稳定。';

  return (
    <PageLayout variant="main">
      <Masthead
        title="我的"
        subtitle={subtitle}
        ornaments={['✦ MY ✦', '✦ CENTER ✦']}
        metaLinks={[
          { label: '成长', onClick: () => navigate('/growth') },
          { label: '设置', onClick: () => navigate('/settings') },
        ]}
      />

      <PageContent>
        <PageBody>
          {error ? (
            <PageSection compact>
              <PagePanel tone="accent" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '6px' }}>{error}</p>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>入口功能可正常使用，成长摘要稍后会自动刷新。</p>
              </PagePanel>
            </PageSection>
          ) : null}

          <PageSection compact>
            <PagePanel>
              <div className="page-profile-shell">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                    {displayName}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: '8px' }}>
                    {loading ? '正在同步成长摘要...' : personaSummary}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(summaryKeywords.length > 0 ? summaryKeywords : ['记录', '行动']).map((keyword) => (
                      <span key={keyword} className="tag">{keyword}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/growth')}
                    className="action-chip primary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    进入成长页
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout().then(() => navigate('/welcome'))}
                    className="action-chip"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    退出登录
                  </button>
                </div>
              </div>

              <div className="page-stat-grid">
                <div className="page-stat-card">
                  <p className="page-stat-value" style={{ color: 'var(--accent)' }}>{notesCount}</p>
                  <p className="page-stat-label">真实记录</p>
                </div>
                <div className="page-stat-card">
                  <p className="page-stat-value">{historyCount}</p>
                  <p className="page-stat-label">近期回看</p>
                </div>
              </div>
            </PagePanel>
          </PageSection>

          <PageSection>
            <PageSectionHeader title="个人沉淀入口" />
            <div style={{ display: 'grid', gap: '8px' }}>
              {ENTRY_ITEMS.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="page-entry-button"
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </PageSection>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}

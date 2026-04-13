import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PageContent, PageLayout, Masthead } from '../components/layout';
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
  const { user } = useAppContext();
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
        {error ? (
          <div className="domain-card" style={{ marginTop: '16px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '6px' }}>{error}</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>入口功能可正常使用，成长摘要稍后会自动刷新。</p>
          </div>
        ) : null}

        <div className="domain-card" style={{ marginTop: '16px', marginBottom: '16px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
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
            <button
              onClick={() => navigate('/growth')}
              style={{
                padding: '10px 12px',
                background: 'var(--ink)',
                color: 'var(--paper)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              进入成长页
            </button>
          </div>

          <div
            style={{
              marginTop: '14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            <div style={{ padding: '10px', background: 'var(--paper-warm)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)', margin: 0 }}>{notesCount}</p>
              <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: 0 }}>真实记录</p>
            </div>
            <div style={{ padding: '10px', background: 'var(--paper-warm)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{historyCount}</p>
              <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: 0 }}>近期回看</p>
            </div>
          </div>
        </div>

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">个人沉淀入口</span>
          </div>
        </div>

        <div style={{ margin: '0 16px 16px', display: 'grid', gap: '8px' }}>
          {ENTRY_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="domain-card"
              style={{
                margin: 0,
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
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
      </PageContent>
    </PageLayout>
  );
}

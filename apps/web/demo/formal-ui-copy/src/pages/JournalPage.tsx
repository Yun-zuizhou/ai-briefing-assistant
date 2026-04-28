import { useState, useCallback, useMemo, useEffect } from 'react';
import { Trash2, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, Masthead, PageContent } from '../components/layout';
import { apiService } from '../services/api';
import type { GrowthOverviewData, NoteApiItem } from '../types/page-data';

export default function JournalPage() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [thoughts, setThoughts] = useState<NoteApiItem[]>([]);
  const [growthData, setGrowthData] = useState<GrowthOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJournalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [notesResponse, growthResponse] = await Promise.all([
        apiService.getNotes(),
        apiService.getGrowthOverview(),
      ]);
      if (notesResponse.error) {
        throw new Error(notesResponse.error);
      }
      if (growthResponse.error) {
        throw new Error(growthResponse.error);
      }
      setThoughts(notesResponse.data?.items ?? []);
      setGrowthData(growthResponse.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载日志失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJournalData();
  }, [fetchJournalData]);

  const dailyStory = useMemo(() => {
    const noteCount = thoughts.length;
    const latestHistory = growthData?.recentHistoryItems?.[0];
    return {
      content: latestHistory?.historyTitle || (noteCount > 0 ? '今天已经留下了新的记录与痕迹。' : '今天你还没有活动记录，继续探索吧！'),
      literaryContent: noteCount > 0
        ? `今天留下了 ${noteCount} 条真实记录，正在从输入走向沉淀。`
        : (growthData?.weeklySummary.growthSummary ?? ''),
      stats: {
        viewed: growthData?.recentHistoryItems.length ?? 0,
        collected: 0,
        recorded: noteCount,
      },
    };
  }, [growthData, thoughts.length]);

  const levelText = useMemo(() => String(Math.max(growthData?.recentHistoryItems.length ?? 0, 1)), [growthData?.recentHistoryItems.length]);
  const growthTags = useMemo(() => {
    const growthKeywords = (growthData?.keywords ?? []).map((item) => item.keyword).filter(Boolean);
    const tags = growthKeywords.length > 0
      ? growthKeywords
      : Array.from(new Set(thoughts.flatMap((item) => item.tags ?? []).filter(Boolean)));
    return tags.slice(0, 3);
  }, [growthData?.keywords, thoughts]);

  const handleGenerateMark = useCallback(() => {
    if (thoughts.length === 0) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  }, [thoughts.length]);

  const handleDeleteThought = useCallback(async (id: number) => {
    try {
      await apiService.deleteNote(id);
      setThoughts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除记录失败');
    }
  }, []);

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = `星期${weekDays[today.getDay()]}`;

  return (
    <PageLayout variant="main">
      <Masthead
        title="日志"
        subtitle={`${dateStr} · ${weekDay}`}
        ornaments={['✦ MY ✦', '✦ LOG ✦']}
        meta="记录成长轨迹"
      />

      <PageContent>
        {error ? (
          <div className="domain-card" style={{ marginTop: '16px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '10px' }}>{error}</p>
            <button onClick={() => void fetchJournalData()} className="btn btn-primary">重试</button>
          </div>
        ) : null}

        <div className="domain-card" style={{ marginTop: '16px' }}>
          <div className="domain-header" style={{ background: 'var(--gold)', color: 'var(--paper)' }}>
            <div className="domain-name" style={{ color: 'var(--paper)' }}>✨ 今日叙事</div>
            <button
              onClick={handleGenerateMark}
              disabled={thoughts.length === 0 || isGenerating}
              style={{
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--paper)',
                cursor: thoughts.length === 0 ? 'not-allowed' : 'pointer',
                opacity: thoughts.length === 0 ? 0.5 : 1,
              }}
            >
              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {isGenerating ? '生成中...' : 'AI生成'}
            </button>
          </div>
          <div style={{ padding: '14px' }}>
            {loading ? (
              <p style={{ fontSize: '14px', color: 'var(--ink-muted)', margin: 0 }}>加载真实日志中...</p>
            ) : dailyStory.literaryContent ? (
              <div style={{
                padding: '12px',
                background: 'var(--paper-warm)',
                borderLeft: '3px solid var(--accent)',
                marginBottom: '12px',
              }}>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--ink-light)',
                  lineHeight: 1.8,
                  fontStyle: 'italic',
                  margin: 0,
                }}>
                  {dailyStory.literaryContent}
                </p>
              </div>
            ) : null}

            <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.7, marginBottom: '12px' }}>
              {dailyStory.content}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0,
              border: '2px solid var(--ink)',
              textAlign: 'center',
            }}>
              <div style={{ padding: '10px', borderRight: '1px solid var(--ink)' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)' }}>
                  {dailyStory.stats.viewed}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>痕迹</div>
              </div>
              <div style={{ padding: '10px', borderRight: '1px solid var(--ink)' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--gold)' }}>
                  {dailyStory.stats.collected}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>收藏</div>
              </div>
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ink)' }}>
                  {dailyStory.stats.recorded}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>记录</div>
              </div>
            </div>
          </div>
        </div>

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">成长轨迹</span>
            <span className="section-more" onClick={() => navigate('/history-logs')}>
              查看全部 <ChevronRight size={14} />
            </span>
          </div>
        </div>

        <div style={{
          margin: '0 16px 16px',
          padding: '16px',
          background: 'var(--paper-warm)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--accent)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--paper)',
              fontSize: '20px',
              fontWeight: 900,
            }}>
              {levelText}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                记录进行中
              </p>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>
                已收出 {growthData?.recentHistoryItems.length ?? 0} 条近期回看
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(growthTags.length > 0 ? growthTags : ['待形成标签']).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">想法记录</span>
            <span className="section-more" onClick={() => navigate('/chat')}>
              对话入口 <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {loading ? (
          <div className="domain-card" style={{ margin: '0 16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginBottom: '8px' }}>加载记录中...</p>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="domain-card" style={{ margin: '0 16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginBottom: '8px' }}>暂无想法记录</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>点击底部"对话"记录你的想法</p>
          </div>
        ) : (
          <div style={{ margin: '0 16px' }}>
            {thoughts.slice(0, 5).map((thought) => (
              <div key={thought.id} className="domain-card" style={{ marginBottom: '8px', padding: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>{thought.created_at.replace('T', ' ').slice(0, 16)}</span>
                  <button
                    onClick={() => void handleDeleteThought(thought.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <Trash2 size={12} style={{ color: 'var(--ink-muted)' }} />
                  </button>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                  {thought.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

import { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../../components/layout';
import { weeklyReport, monthlyReport } from '../data/reportSeeds';
import { useDemoAppContext } from '../context/useDemoAppContext';

type ReportType = 'daily' | 'weekly' | 'monthly';

export default function StoryPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const { stories, setStories } = useDemoAppContext();

  const currentReport = reportType === 'daily' 
    ? null 
    : reportType === 'weekly' 
    ? weeklyReport 
    : monthlyReport;

  const handleDeleteStory = useCallback((id: number) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
  }, [setStories]);

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="我的故事" label="MY STORY" />

      <PageContent style={{ padding: '16px' }}>
        <div className="story-tabs">
          {[
            { key: 'daily', label: '每日故事' },
            { key: 'weekly', label: '周报' },
            { key: 'monthly', label: '月报' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key as ReportType)}
              className={`story-tab ${reportType === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {reportType === 'daily' ? (
          <div>
            {stories.map((story) => (
              <div key={story.id} className="story-card">
                <div className="story-card-content">
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}>
                    <div>
                      <p className="story-card-date">{story.date}</p>
                      <h3 className="story-card-title">{story.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteStory(story.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={14} style={{ color: 'var(--ink-muted)' }} />
                    </button>
                  </div>

                  <p className="story-card-text">{story.content}</p>

                  <div className="story-stats">
                    <div className="story-stat-item">
                      <div className="story-stat-value">{story.stats.viewed}</div>
                      <div className="story-stat-label">关注</div>
                    </div>
                    <div className="story-stat-item">
                      <div className="story-stat-value" style={{ color: 'var(--gold)' }}>{story.stats.collected}</div>
                      <div className="story-stat-label">收藏</div>
                    </div>
                    <div className="story-stat-item">
                      <div className="story-stat-value" style={{ color: 'var(--accent)' }}>{story.stats.recorded}</div>
                      <div className="story-stat-label">记录</div>
                    </div>
                  </div>

                  {story.highlights.length > 0 && (
                    <div className="story-highlights">
                      <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '8px', fontWeight: 600 }}>
                        今日亮点
                      </p>
                      {story.highlights.map((highlight, i) => (
                        <div key={i} className="story-highlight-item">
                          {highlight}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="story-card">
            <div className="story-card-content">
              <div style={{ marginBottom: '14px' }}>
                <p className="story-card-date">
                  {reportType === 'weekly' ? weeklyReport.week : monthlyReport.month}
                </p>
                <h3 className="story-card-title" style={{ fontSize: '18px' }}>
                  {currentReport?.title}
                </h3>
              </div>

              <p className="story-card-text">{currentReport?.summary}</p>

              <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '10px', fontWeight: 600 }}>
                  关注领域
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {currentReport?.topCategories.map((cat) => (
                    <span key={cat.name} style={{
                      padding: '4px 10px',
                      background: 'var(--paper-warm)',
                      border: '1px solid var(--ink)',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-serif-cn)',
                    }}>
                      {cat.name} · {cat.count}
                    </span>
                  ))}
                </div>
              </div>

              <div className="story-stats">
                {currentReport?.growth.map((g) => (
                  <div key={g.metric} className="story-stat-item">
                    <div className="story-stat-value">{g.value}</div>
                    <div className="story-stat-label">{g.metric}</div>
                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>
                      {g.change}
                    </div>
                  </div>
                ))}
              </div>

              <div className="ai-insight">
                <p className="ai-insight-label">✨ AI洞察</p>
                <p className="ai-insight-text">{currentReport?.insights}</p>
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { useAppContext } from '../context/useAppContext';

export default function MarksPage() {
  const { stories } = useAppContext();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="日志存档" label="MY LOGS" />

      <PageContent style={{ padding: '16px' }}>
        {stories.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--ink-muted)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '2px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                right: '4px',
                bottom: '4px',
                border: '1px solid var(--ink)',
                pointerEvents: 'none',
              }} />
              <span style={{ fontSize: '32px' }}>📖</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
              暂无日志记录
            </p>
            <p style={{ fontSize: '13px' }}>
              在日志页面点击"保存日志"开始记录
            </p>
          </div>
        ) : (
          stories.map((story) => (
            <div key={story.id} className="story-card" style={{ marginBottom: '16px' }}>
              <div className="story-card-content">
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{story.date}</p>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                    {story.title}
                  </h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 0,
                  marginBottom: '14px',
                  background: 'var(--paper-warm)',
                  border: '1px solid var(--ink)',
                  textAlign: 'center',
                }}>
                  <div style={{ padding: '10px', borderRight: '1px solid var(--ink)' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{story.stats.viewed}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>关注</div>
                  </div>
                  <div style={{ padding: '10px', borderRight: '1px solid var(--ink)' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>{story.stats.collected}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>收藏</div>
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>{story.stats.recorded}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>记录</div>
                  </div>
                </div>

                {story.literaryContent && (
                  <div style={{
                    padding: '14px',
                    background: 'var(--paper-warm)',
                    borderLeft: '4px solid var(--accent)',
                    marginBottom: '14px',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '8px' }}>
                      ✍️ 文学日志
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>
                      {story.literaryContent}
                    </p>
                  </div>
                )}

                <p style={{ fontSize: '14px', color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: '14px' }}>{story.content}</p>

                {story.journalSummary && (
                  <div style={{
                    padding: '12px',
                    background: 'var(--paper)',
                    border: '1px solid var(--ink)',
                    marginBottom: '14px',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
                      📝 日志梳理
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.7, margin: 0 }}>
                      {story.journalSummary}
                    </p>
                  </div>
                )}

                {story.highlights.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '8px', fontWeight: 600 }}>
                      ✨ 今日亮点
                    </p>
                    {story.highlights.map((highlight, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 0',
                        fontSize: '12px',
                        color: 'var(--ink-muted)',
                      }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                        {highlight}
                      </div>
                    ))}
                  </div>
                )}

                {story.feedback && (
                  <div style={{
                    padding: '12px',
                    background: 'var(--accent)',
                    color: 'var(--paper)',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px', opacity: 0.9 }}>
                      💬 AI 反馈
                    </p>
                    <p style={{ fontSize: '12px', lineHeight: 1.7, margin: 0 }}>
                      {story.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </PageContent>
    </PageLayout>
  );
}

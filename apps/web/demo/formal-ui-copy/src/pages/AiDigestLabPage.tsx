import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCw, Send } from 'lucide-react';

import { Masthead, PageContent, PageLayout } from '../components/layout';
import { apiService, type DailyDigestItem, type DigestConsultResponse } from '../services/api';

function formatDateTime(value?: string | null) {
  if (!value) return '未知时间';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AiDigestLabPage() {
  const [items, setItems] = useState<DailyDigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeResultRef, setActiveResultRef] = useState<string | null>(null);
  const [question, setQuestion] = useState('这条消息对我做 AI 项目开发最值得关注的点是什么？');
  const [consulting, setConsulting] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [consultResult, setConsultResult] = useState<DigestConsultResponse | null>(null);

  const activeItem = useMemo(
    () => items.find((item) => item.resultRef === activeResultRef) || null,
    [activeResultRef, items],
  );

  const loadDigest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDailyDigest(null, 8);
      if (response.error) {
        throw new Error(response.error);
      }

      const nextItems = response.data?.items ?? [];
      setItems(nextItems);
      setActiveResultRef((current) => current ?? nextItems[0]?.resultRef ?? null);
      if (nextItems.length === 0) {
        setConsultResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '摘要结果加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDigest();
  }, []);

  const handleConsult = async () => {
    if (!activeItem || !question.trim()) return;
    try {
      setConsulting(true);
      setConsultError(null);
      const response = await apiService.consultDigest({
        result_ref: activeItem.resultRef,
        question: question.trim(),
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setConsultResult(response.data ?? null);
    } catch (err) {
      setConsultError(err instanceof Error ? err.message : '咨询失败');
    } finally {
      setConsulting(false);
    }
  };

  return (
    <PageLayout variant="secondary">
      <Masthead
        title="AI Digest Lab"
        subtitle="阶段十六调试页"
        ornaments={['✦ AI DIGEST ✦', '✦ LAB ✦']}
        meta="DAILY DIGEST / CONSULT"
      />

      <PageContent style={{ padding: '16px', display: 'grid', gap: '14px' }}>
        <div className="domain-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>
                调试目标
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-light)', lineHeight: 1.7 }}>
                用正式接口验证 `daily-digest` 与 `consult`，当前页面只承担联调和人工验收，不代表正式产品页。
              </p>
            </div>
            <button
              onClick={() => void loadDigest()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <RefreshCw size={14} />
              刷新
            </button>
          </div>
        </div>

        {error ? (
          <div className="domain-card" style={{ padding: '16px', borderColor: 'var(--accent)' }}>
            <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, marginBottom: '6px' }}>
              摘要列表加载失败
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-light)', lineHeight: 1.7 }}>{error}</p>
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div className="domain-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginBottom: '10px' }}>
              摘要结果列表
            </div>
            {loading ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-muted)' }}>正在加载摘要结果…</p>
            ) : items.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-muted)' }}>
                当前还没有可读的摘要结果。先运行 `pipeline:collect:ai` 和 `pipeline:summarize:ai`。
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {items.map((item) => {
                  const active = item.resultRef === activeResultRef;
                  return (
                    <button
                      key={item.resultRef}
                      onClick={() => {
                        setActiveResultRef(item.resultRef);
                        setConsultResult(null);
                        setConsultError(null);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px',
                        border: active ? '1px solid var(--ink)' : '1px solid var(--border)',
                        background: active ? 'var(--paper-warm)' : 'var(--paper)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
                            {item.sourceName || '未知来源'}
                          </span>
                          {item.profileId ? (
                            <span className="tag" style={{ fontSize: '10px' }}>
                              {item.profileId}
                            </span>
                          ) : null}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '6px' }}>
                        {item.summaryTitle || item.title || '未命名摘要'}
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-light)', lineHeight: 1.7 }}>
                        {item.summaryText || '当前结果还没有可读摘要正文。'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {activeItem ? (
            <div className="domain-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>
                    当前摘要详情
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                    {activeItem.summaryTitle || activeItem.title || '未命名摘要'}
                  </div>
                </div>
                {activeItem.sourceUrl ? (
                  <a
                    href={activeItem.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      border: '1px solid var(--border)',
                      padding: '8px 10px',
                      background: 'var(--paper)',
                    }}
                  >
                    原文
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '6px' }}>摘要正文</div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', lineHeight: 1.8 }}>
                    {activeItem.summaryText || '暂无摘要正文'}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '6px' }}>关键点</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(activeItem.keyPoints || []).map((point) => (
                      <span key={point} className="tag">{point}</span>
                    ))}
                    {activeItem.keyPoints.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>暂无关键点</span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '6px' }}>风险标记</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(activeItem.riskFlags || []).map((flag) => (
                      <span key={flag} className="tag" style={{ color: 'var(--accent)' }}>{flag}</span>
                    ))}
                    {activeItem.riskFlags.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>当前无风险标记</span>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>咨询问题</label>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      border: '1px solid var(--border)',
                      background: 'var(--paper)',
                      padding: '12px',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={() => void handleConsult()}
                    disabled={consulting || !question.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 14px',
                      border: 'none',
                      background: consulting ? 'var(--ink-muted)' : 'var(--ink)',
                      color: 'var(--paper)',
                      cursor: consulting ? 'default' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    <Send size={14} />
                    {consulting ? '咨询中…' : '发送咨询'}
                  </button>
                </div>

                {consultError ? (
                  <div style={{ padding: '12px', border: '1px solid var(--accent)', background: 'var(--paper-warm)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>
                      咨询失败
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-light)', lineHeight: 1.7 }}>{consultError}</p>
                  </div>
                ) : null}

                {consultResult ? (
                  <div style={{ padding: '14px', border: '1px solid var(--border)', background: 'var(--paper-warm)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginBottom: '8px' }}>
                      咨询回答
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.8 }}>
                      {consultResult.answer}
                    </p>
                    {consultResult.evidence.length > 0 ? (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '4px' }}>依据</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ink-light)', lineHeight: 1.7 }}>
                          {consultResult.evidence.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {consultResult.suggestedNextActions.length > 0 ? (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '4px' }}>建议下一步</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {consultResult.suggestedNextActions.map((item) => (
                            <span key={item} className="tag">{item}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </PageContent>
    </PageLayout>
  );
}

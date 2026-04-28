import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCw, Send } from 'lucide-react';

import { Masthead, PageContent, PageLayout } from '../components/layout';
import { Button, Tag } from '../components/ui';
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

      <PageContent className="ai-digest-page-content">
        <div className="domain-card ai-digest-card">
          <div className="ai-digest-head-row">
            <div>
              <div className="ai-digest-kicker">
                调试目标
              </div>
              <p className="ai-digest-desc">
                用正式接口验证 `daily-digest` 与 `consult`，当前页面只承担联调和人工验收，不代表正式产品页。
              </p>
            </div>
            <Button
              onClick={() => void loadDigest()}
              variant="secondary"
              className="ai-digest-refresh-btn"
            >
              <RefreshCw size={14} />
              刷新
            </Button>
          </div>
        </div>

        {error ? (
          <div className="domain-card ai-digest-error-card">
            <div className="ai-digest-error-title">
              摘要列表加载失败
            </div>
            <p className="ai-digest-error-text">{error}</p>
          </div>
        ) : null}

        <div className="ai-digest-main-grid">
          <div className="domain-card ai-digest-card">
            <div className="ai-digest-kicker ai-digest-kicker-with-gap">
              摘要结果列表
            </div>
            {loading ? (
              <p className="ai-digest-muted-text">正在加载摘要结果…</p>
            ) : items.length === 0 ? (
              <p className="ai-digest-muted-text">
                当前还没有可读的摘要结果。先运行 `pipeline:collect:ai` 和 `pipeline:summarize:ai`。
              </p>
            ) : (
              <div className="ai-digest-list">
                {items.map((item) => {
                  const active = item.resultRef === activeResultRef;
                  return (
                    <Button
                      key={item.resultRef}
                      type="button"
                      variant="unstyled"
                      onClick={() => {
                        setActiveResultRef(item.resultRef);
                        setConsultResult(null);
                        setConsultError(null);
                      }}
                      className={`ai-digest-list-item ${active ? 'is-active' : ''}`}
                    >
                      <div className="ai-digest-list-item-meta">
                        <div className="ai-digest-list-item-source-wrap">
                          <span className="ai-digest-list-item-source">
                            {item.sourceName || '未知来源'}
                          </span>
                          {item.profileId ? (
                            <Tag className="ai-digest-mini-tag">{item.profileId}</Tag>
                          ) : null}
                        </div>
                        <span className="ai-digest-list-item-time">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                      <div className="ai-digest-list-item-title">
                        {item.summaryTitle || item.title || '未命名摘要'}
                      </div>
                      <p className="ai-digest-list-item-summary">
                        {item.summaryText || '当前结果还没有可读摘要正文。'}
                      </p>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {activeItem ? (
            <div className="domain-card ai-digest-card">
              <div className="ai-digest-detail-head">
                <div>
                  <div className="ai-digest-kicker">
                    当前摘要详情
                  </div>
                  <div className="ai-digest-detail-title">
                    {activeItem.summaryTitle || activeItem.title || '未命名摘要'}
                  </div>
                </div>
                {activeItem.sourceUrl ? (
                  <a
                    href={activeItem.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ai-digest-source-link"
                  >
                    原文
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>

              <div className="ai-digest-detail-grid">
                <div className="ai-digest-block">
                  <div className="ai-digest-block-label">摘要正文</div>
                  <p className="ai-digest-block-text">
                    {activeItem.summaryText || '暂无摘要正文'}
                  </p>
                </div>

                <div className="ai-digest-block">
                  <div className="ai-digest-block-label">关键点</div>
                  <div className="ai-digest-chip-row">
                    {(activeItem.keyPoints || []).map((point) => (
                      <Tag key={point}>{point}</Tag>
                    ))}
                    {(activeItem.keyPoints || []).length === 0 ? (
                      <span className="ai-digest-muted-chip">暂无关键点</span>
                    ) : null}
                  </div>
                </div>

                <div className="ai-digest-block">
                  <div className="ai-digest-block-label">风险标记</div>
                  <div className="ai-digest-chip-row">
                    {(activeItem.riskFlags || []).map((flag) => (
                      <Tag key={flag} className="ai-digest-risk-tag">{flag}</Tag>
                    ))}
                    {(activeItem.riskFlags || []).length === 0 ? (
                      <span className="ai-digest-muted-chip">当前无风险标记</span>
                    ) : null}
                  </div>
                </div>

                <div className="ai-digest-consult-box">
                  <label className="ai-digest-consult-label">咨询问题</label>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={4}
                    className="ai-digest-consult-input"
                  />
                  <Button
                    onClick={() => void handleConsult()}
                    disabled={consulting || !question.trim()}
                    variant="primary"
                    className={`ai-digest-consult-btn${consulting ? ' is-loading' : ''}`}
                  >
                    <Send size={14} />
                    {consulting ? '咨询中…' : '发送咨询'}
                  </Button>
                </div>

                {consultError ? (
                  <div className="ai-digest-consult-error">
                    <div className="ai-digest-consult-error-title">
                      咨询失败
                    </div>
                    <p className="ai-digest-consult-error-text">{consultError}</p>
                  </div>
                ) : null}

                {consultResult ? (
                  <div className="ai-digest-consult-result">
                    <div className="ai-digest-consult-result-title">
                      咨询回答
                    </div>
                    <p className="ai-digest-consult-answer">
                      {consultResult.answer}
                    </p>
                    {consultResult.evidence.length > 0 ? (
                      <div className="ai-digest-consult-subblock">
                        <div className="ai-digest-consult-subtitle">依据</div>
                        <ul className="ai-digest-evidence-list">
                          {consultResult.evidence.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {consultResult.suggestedNextActions.length > 0 ? (
                      <div className="ai-digest-consult-subblock">
                        <div className="ai-digest-consult-subtitle">建议下一步</div>
                        <div className="ai-digest-chip-row">
                          {consultResult.suggestedNextActions.map((item) => (
                            <Tag key={item}>{item}</Tag>
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

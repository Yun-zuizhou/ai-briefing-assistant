import { ExternalLink, RefreshCw, Send } from 'lucide-react';

import { Button, Tag } from '../ui';
import type { DailyDigestItem, DigestConsultResponse } from '../../services/api';

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

export function AiDigestLabIntroCard({
  onRefresh,
}: {
  onRefresh: () => void;
}) {
  return (
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
          onClick={onRefresh}
          variant="secondary"
          className="ai-digest-refresh-btn"
        >
          <RefreshCw size={14} />
          刷新
        </Button>
      </div>
    </div>
  );
}

export function AiDigestLabErrorCard({
  error,
}: {
  error: string | null;
}) {
  if (!error) return null;

  return (
    <div className="domain-card ai-digest-error-card">
      <div className="ai-digest-error-title">
        摘要列表加载失败
      </div>
      <p className="ai-digest-error-text">{error}</p>
    </div>
  );
}

export function AiDigestLabWorkspace({
  activeItem,
  activeResultRef,
  consultError,
  consultResult,
  consulting,
  items,
  loading,
  onConsult,
  onQuestionChange,
  onSelectItem,
  question,
}: {
  activeItem: DailyDigestItem | null;
  activeResultRef: string | null;
  consultError: string | null;
  consultResult: DigestConsultResponse | null;
  consulting: boolean;
  items: DailyDigestItem[];
  loading: boolean;
  onConsult: () => void;
  onQuestionChange: (value: string) => void;
  onSelectItem: (resultRef: string) => void;
  question: string;
}) {
  return (
    <div className="ai-digest-main-grid">
      <AiDigestLabListCard
        activeResultRef={activeResultRef}
        items={items}
        loading={loading}
        onSelectItem={onSelectItem}
      />
      <AiDigestLabDetailCard
        activeItem={activeItem}
        consultError={consultError}
        consultResult={consultResult}
        consulting={consulting}
        onConsult={onConsult}
        onQuestionChange={onQuestionChange}
        question={question}
      />
    </div>
  );
}

function AiDigestLabListCard({
  activeResultRef,
  items,
  loading,
  onSelectItem,
}: {
  activeResultRef: string | null;
  items: DailyDigestItem[];
  loading: boolean;
  onSelectItem: (resultRef: string) => void;
}) {
  return (
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
                onClick={() => onSelectItem(item.resultRef)}
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
  );
}

function AiDigestLabDetailCard({
  activeItem,
  consultError,
  consultResult,
  consulting,
  onConsult,
  onQuestionChange,
  question,
}: {
  activeItem: DailyDigestItem | null;
  consultError: string | null;
  consultResult: DigestConsultResponse | null;
  consulting: boolean;
  onConsult: () => void;
  onQuestionChange: (value: string) => void;
  question: string;
}) {
  if (!activeItem) return null;

  return (
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

        <AiDigestChipBlock label="关键点" items={activeItem.keyPoints || []} emptyText="暂无关键点" />
        <AiDigestChipBlock label="风险标记" items={activeItem.riskFlags || []} emptyText="当前无风险标记" risk />

        <div className="ai-digest-consult-box">
          <label className="ai-digest-consult-label">咨询问题</label>
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            rows={4}
            className="ai-digest-consult-input"
          />
          <Button
            onClick={onConsult}
            disabled={consulting || !question.trim()}
            variant="primary"
            className={`ai-digest-consult-btn${consulting ? ' is-loading' : ''}`}
          >
            <Send size={14} />
            {consulting ? '咨询中…' : '发送咨询'}
          </Button>
        </div>

        <AiDigestConsultError error={consultError} />
        <AiDigestConsultResult result={consultResult} />
      </div>
    </div>
  );
}

function AiDigestChipBlock({
  emptyText,
  items,
  label,
  risk = false,
}: {
  emptyText: string;
  items: string[];
  label: string;
  risk?: boolean;
}) {
  return (
    <div className="ai-digest-block">
      <div className="ai-digest-block-label">{label}</div>
      <div className="ai-digest-chip-row">
        {items.map((item) => (
          <Tag key={item} className={risk ? 'ai-digest-risk-tag' : undefined}>{item}</Tag>
        ))}
        {items.length === 0 ? (
          <span className="ai-digest-muted-chip">{emptyText}</span>
        ) : null}
      </div>
    </div>
  );
}

function AiDigestConsultError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <div className="ai-digest-consult-error">
      <div className="ai-digest-consult-error-title">
        咨询失败
      </div>
      <p className="ai-digest-consult-error-text">{error}</p>
    </div>
  );
}

function AiDigestConsultResult({ result }: { result: DigestConsultResponse | null }) {
  if (!result) return null;

  return (
    <div className="ai-digest-consult-result">
      <div className="ai-digest-consult-result-title">
        咨询回答
      </div>
      <p className="ai-digest-consult-answer">
        {result.answer}
      </p>
      {result.evidence.length > 0 ? (
        <div className="ai-digest-consult-subblock">
          <div className="ai-digest-consult-subtitle">依据</div>
          <ul className="ai-digest-evidence-list">
            {result.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.suggestedNextActions.length > 0 ? (
        <div className="ai-digest-consult-subblock">
          <div className="ai-digest-consult-subtitle">建议下一步</div>
          <div className="ai-digest-chip-row">
            {result.suggestedNextActions.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

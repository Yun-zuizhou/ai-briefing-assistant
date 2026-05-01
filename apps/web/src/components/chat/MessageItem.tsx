import type { ChatMessageState } from '../../types/page-data';
import { EditorialIcon, PaperButton, StatusBadge, type EditorialIconName } from '../decor';
import { MessageBody } from './MessageBody';
import { MessageMeta } from './MessageMeta';

function formatMessageTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function getBriefHead(messageState?: ChatMessageState): {
  icon: EditorialIconName;
  label: string;
  badgeLabel?: string;
  badgeTone?: 'success' | 'neutral' | 'pending';
} {
  switch (messageState) {
    case 'executed':
      return { icon: 'briefing', label: '本轮简报', badgeLabel: '已生成', badgeTone: 'success' };
    case 'error':
      return { icon: 'bell', label: '系统', badgeLabel: '失败', badgeTone: 'neutral' };
    case 'pending_confirmation':
      return { icon: 'bell', label: '处理中', badgeLabel: '处理中', badgeTone: 'pending' };
    default:
      return { icon: 'bell', label: '系统' };
  }
}

export function MessageItem({
  content,
  isUser,
  index = 0,
  messageState,
  candidateIntents,
  sourceContext,
  matchedBy,
  deepLink,
  nextPageLabel,
  quickActions,
  changeLog,
  onMessageAction,
  messageId,
  onCopy,
  onDelete,
  onRegenerate,
  originalUserMessage,
  createdAt,
}: {
  content: string;
  isUser: boolean;
  index?: number;
  messageState?: ChatMessageState;
  confirmedType?: string;
  candidateIntents?: string[];
  confidence?: number;
  sourceContext?: string;
  matchedBy?: string;
  deepLink?: string;
  nextPageLabel?: string;
  quickActions?: Array<{
    label: string;
    action: string;
    deepLink?: string;
    targetIntent?: string;
    correctionFrom?: string;
  }>;
  changeLog?: Array<{
    entityType: 'todo' | 'note' | 'history' | 'favorite' | 'unknown';
    entityId?: number | string;
    change: 'created' | 'kept' | 'cancelled' | 'retagged' | 'repointed';
    summary: string;
  }>;
  onMessageAction: (action: { action: string; deepLink?: string; targetIntent?: string; correctionFrom?: string; sourceContext?: string }) => void;
  messageId?: number;
  onCopy?: (content: string) => void;
  onDelete?: (messageId: number) => void;
  onRegenerate?: () => void;
  originalUserMessage?: string;
  createdAt?: string | null;
}) {
  const timeText = formatMessageTime(createdAt);
  const brief = !isUser ? getBriefHead(messageState) : null;
  const rowStyle = index > 0 ? { animationDelay: `${index * 40}ms` } : undefined;
  const bubbleClass = isUser
    ? 'editorial-chat-bubble editorial-chat-bubble--user'
    : `editorial-chat-bubble editorial-chat-bubble--assistant${messageState === 'pending_confirmation' ? ' editorial-chat-bubble--pending' : ''}`;

  return (
    <div
      className={`editorial-chat-row ${isUser ? 'editorial-chat-row--user' : 'editorial-chat-row--assistant'}`}
      style={rowStyle}
    >
      <div className={bubbleClass}>
        {brief ? (
          <div className="editorial-chat-brief-head">
            <span>
              <EditorialIcon name={brief.icon} size={18} />
              {brief.label}
            </span>
            {brief.badgeLabel && brief.badgeTone ? (
              <StatusBadge label={brief.badgeLabel} tone={brief.badgeTone} />
            ) : null}
            {timeText ? (
              <span className="editorial-chat-brief-time">{timeText}</span>
            ) : null}
          </div>
        ) : null}

        <MessageBody content={content} isUser={isUser} />

        {!isUser && originalUserMessage ? (
          <div className="chat-quote-footnote">{originalUserMessage}</div>
        ) : null}

        {!isUser ? (
          <MessageMeta
            candidateIntents={candidateIntents}
            sourceContext={sourceContext}
            matchedBy={matchedBy}
          />
        ) : null}

        {!isUser && messageState === 'executed' && (deepLink || (quickActions && quickActions.length > 0)) ? (
          <div className="editorial-chat-action-row">
            {deepLink && nextPageLabel ? (
              <PaperButton active onClick={() => onMessageAction({ action: nextPageLabel, deepLink })}>
                {nextPageLabel}
              </PaperButton>
            ) : null}
            {quickActions?.map((item) => (
              <PaperButton
                key={`${item.label}-${item.action}`}
                onClick={() => onMessageAction(item)}
              >
                {item.label}
              </PaperButton>
            ))}
          </div>
        ) : null}

        {!isUser && changeLog && changeLog.length > 0 ? (
          <div className="chat-message-change-log">
            {changeLog.map((item) => (
              <div
                key={`${item.entityType}-${item.entityId ?? 'none'}-${item.change}`}
                className="chat-message-change-item"
              >
                {item.summary}{item.entityId !== undefined ? ` #${item.entityId}` : ''}
              </div>
            ))}
          </div>
        ) : null}

        {!isUser ? (
          <div className="editorial-chat-ops-row">
            {onCopy ? (
              <button type="button" className="editorial-chat-op-btn" onClick={() => onCopy(content)}>复制</button>
            ) : null}
            {onRegenerate ? (
              <button type="button" className="editorial-chat-op-btn" onClick={onRegenerate}>重新生成</button>
            ) : null}
            {messageId != null && onDelete ? (
              <button type="button" className="editorial-chat-op-btn editorial-chat-op-btn-danger" onClick={() => onDelete(messageId)}>删除</button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

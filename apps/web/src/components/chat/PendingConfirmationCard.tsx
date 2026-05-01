import { ChatFeedbackCard as FeedbackCard, ChatStatusPill as StatusPill, ChatQuickActionButton as QuickActionButton } from '../business';
import { formatIntentLabel } from '../../utils/intentLabels';
import type { useChatLogic } from '../../hooks';

export function PendingConfirmationCard({
  pendingConfirmation,
  latestActionSummary,
  onConfirmIntent,
}: {
  pendingConfirmation: NonNullable<ReturnType<typeof useChatLogic>['pendingConfirmation']>;
  latestActionSummary: ReturnType<typeof useChatLogic>['latestActionSummary'];
  onConfirmIntent: (confirmedType: string) => void;
}) {
  const touchesSystemConfig = pendingConfirmation.candidateIntents.some((item) =>
    item === 'add_interest' || item === 'remove_interest' || item === 'set_push_time'
  );

  return (
    <FeedbackCard label="请你确认" className="chat-block chat-block-pending">
      <div className="chat-summary-card-grid">
        <div className="chat-status-row">
          <StatusPill text="待确认" tone="pending" />
          <StatusPill text={`候选 ${pendingConfirmation.candidateIntents.length} 个`} />
        </div>
        <div className="chat-quote-block">
          {pendingConfirmation.userMessage}
        </div>
        {touchesSystemConfig ? (
          <p className="chat-meta-note">
            这会修改你的系统配置。确认后才会写入，并在成功后给出可查看的入口。
          </p>
        ) : null}
        <div className="action-row">
          {pendingConfirmation.candidateIntents.map((item) => (
            <QuickActionButton
              key={item}
              text={formatIntentLabel(item)}
              onClick={() => onConfirmIntent(item)}
              highlight={item === latestActionSummary?.actionType}
            />
          ))}
          <QuickActionButton
            text="仅聊天，不保存"
            onClick={() => onConfirmIntent('chat_only')}
          />
        </div>
      </div>
    </FeedbackCard>
  );
}

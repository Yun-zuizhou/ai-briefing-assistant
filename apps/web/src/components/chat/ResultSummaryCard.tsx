import { EditorialIcon, PaperButton, StatusBadge } from '../decor';
import { formatIntentLabel } from '../../utils/intentLabels';
import type { useChatLogic } from '../../hooks';

export function ResultSummaryCard({
  latestActionSummary,
  onOpenDeepLink,
}: {
  latestActionSummary: NonNullable<ReturnType<typeof useChatLogic>['latestActionSummary']>;
  onOpenDeepLink: (deepLink: string) => void;
}) {
  const isSystemConfig = latestActionSummary.actionType === 'add_interest'
    || latestActionSummary.actionType === 'remove_interest'
    || latestActionSummary.actionType === 'set_push_time';
  const cardLabel = isSystemConfig ? '配置结果' : '本轮摘要';

  return (
    <div className="editorial-chat-row editorial-chat-row--assistant chat-result-summary-row">
      <section className="editorial-chat-bubble editorial-chat-bubble--assistant chat-result-summary-card" aria-label={cardLabel}>
        <div className="editorial-chat-brief-head">
          <span>
            <EditorialIcon name="briefing" size={18} />
            {cardLabel}
          </span>
          <StatusBadge label="已执行" tone="success" />
        </div>

        <div className="chat-summary-card-grid">
          {latestActionSummary.confirmedType ? (
            <div className="chat-result-summary-meta">
              {formatIntentLabel(latestActionSummary.confirmedType)}
            </div>
          ) : null}

          <p className="chat-result-summary-lead">
            我刚刚已经帮你：{latestActionSummary.successMessage}
          </p>

          {latestActionSummary.resultSummary ? (
            <p className="chat-summary-text">
              {latestActionSummary.resultSummary}
            </p>
          ) : null}

          <p className="chat-meta-note">
            {isSystemConfig
              ? '配置已写入系统。你可以通过下方入口查看配置生效后的页面。'
              : '具体结果和可继续动作都在下面的消息里，这里只保留本轮摘要。'}
          </p>

          <div className="editorial-chat-action-row">
            {latestActionSummary.deepLink && latestActionSummary.nextPageLabel ? (
              <PaperButton active onClick={() => onOpenDeepLink(latestActionSummary.deepLink!)}>
                {latestActionSummary.nextPageLabel}
              </PaperButton>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

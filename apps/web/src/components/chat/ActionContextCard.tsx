import { ChatFeedbackCard as FeedbackCard, ChatQuickActionButton as QuickActionButton } from '../business';

export function ActionContextCard({
  sourceTitle,
  sourceContentRef,
  presetInput,
  onQuickAction,
  onBack,
}: {
  sourceTitle?: string;
  sourceContentRef?: string;
  presetInput?: string;
  onQuickAction: (text: string, autoSend?: boolean) => void;
  onBack: () => void;
}) {
  return (
    <FeedbackCard label="当前动作上下文" className="chat-block chat-block-context">
      <div className="chat-summary-card-grid">
        <div className="chat-confirm-origin">
          <div><strong>来源内容：</strong>{sourceTitle}</div>
          {sourceContentRef ? <div className="chat-context-ref-note">已带入当前内容上下文。</div> : null}
        </div>
        {presetInput ? (
          <div className="action-row">
            <QuickActionButton
              text="直接发送这条动作"
              onClick={() => onQuickAction(presetInput, true)}
              highlight
            />
            <QuickActionButton text="返回上一页" onClick={onBack} />
          </div>
        ) : null}
      </div>
    </FeedbackCard>
  );
}

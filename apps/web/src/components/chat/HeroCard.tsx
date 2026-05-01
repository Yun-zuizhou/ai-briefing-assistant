import { EditorialIcon, PaperButton } from '../decor';
import { ModeChips } from './ModeChips';
import type { ComposeMode } from '../../hooks';

export function HeroCard({
  composeMode,
  setComposeMode,
  onQuickAction,
  hasMessages,
}: {
  composeMode: ComposeMode;
  setComposeMode: (mode: ComposeMode) => void;
  onQuickAction: (text: string, autoSend?: boolean) => void;
  hasMessages: boolean;
}) {
  const promptOptions = [
    '我想关注 AI 和远程工作',
    '以后每天早上 8 点发简报',
    '明天提醒我投简历',
  ];

  if (hasMessages) {
    return null;
  }

  return (
    <div className="editorial-chat-hero">
      <div className="editorial-chat-row editorial-chat-row--assistant">
        <div className="editorial-chat-bubble editorial-chat-bubble--assistant">
          <div className="editorial-chat-brief-head">
            <span>
              <EditorialIcon name="inbox" size={18} />
              编辑部通讯栏
            </span>
          </div>
          <p>
            直接说关注、系统配置、待办、想法，或者一句调整。我会先确认关键写入，再给出清楚的结果。
          </p>
          <div className="editorial-chat-mode-row" style={{ paddingTop: 4, paddingBottom: 0 }}>
            <ModeChips mode={composeMode} onChange={setComposeMode} />
          </div>
          <div className="editorial-chat-action-row">
            {promptOptions.map((item) => (
              <PaperButton
                key={item}
                onClick={() => onQuickAction(item)}
              >
                {item}
              </PaperButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

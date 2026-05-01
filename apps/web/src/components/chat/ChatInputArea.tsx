import { useRef, useEffect } from 'react';
import { EditorialIcon } from '../decor';
import { ModeChips } from './ModeChips';
import type { ComposeMode } from '../../hooks';

export function ChatInputArea({
  composeMode,
  onModeChange,
  inputValue,
  onInputChange,
  onSend,
  onKeyDown,
  isTyping,
  showModeBar,
}: {
  composeMode: ComposeMode;
  onModeChange: (mode: ComposeMode) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isTyping: boolean;
  showModeBar: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const placeholder = composeMode === 'chat_only'
    ? '这次只聊天，不保存内容...'
    : '直接说出关注、任务、想法或调整...';

  return (
    <div>
      {showModeBar ? (
        <div className="editorial-chat-mode-row">
          <ModeChips mode={composeMode} onChange={onModeChange} />
          <div className="editorial-chat-mode-row-extras">
            <ModeChips
              mode={composeMode}
              onChange={onModeChange}
              variants={['fragmented_thought', 'chat_only']}
            />
          </div>
        </div>
      ) : null}
      <div className="editorial-chat-inputbar">
        <EditorialIcon name="search" size={18} tone="secondary" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          disabled={isTyping}
          aria-label="输入消息"
          className="editorial-chat-inputbar-field"
        />
        <button
          type="button"
          aria-label="发送"
          onClick={onSend}
          disabled={!inputValue.trim() || isTyping}
        >
          <EditorialIcon name="send" size={18} />
        </button>
      </div>
    </div>
  );
}

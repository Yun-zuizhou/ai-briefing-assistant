import type { ChatMessageState } from '../../types/page-data';
import { MessageItem } from './MessageItem';

export function MessageList({
  messages,
  isTyping,
  onMessageAction,
  onCopyMessage,
  onDeleteMessage,
  onRegenerateMessage,
}: {
  messages: Array<{
    id?: number;
    content: string;
    role: 'user' | 'assistant';
    messageState?: ChatMessageState | null;
    confirmedType?: string | null;
    candidateIntents?: string[];
    sourceContext?: string | null;
    matchedBy?: string | null;
    deepLink?: string | null;
    nextPageLabel?: string | null;
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
    originalUserMessage?: string;
    createdAt?: string | null;
  }>;
  isTyping: boolean;
  onMessageAction: (action: { action: string; deepLink?: string; targetIntent?: string; correctionFrom?: string; sourceContext?: string }) => void;
  onCopyMessage?: (content: string) => void;
  onDeleteMessage?: (messageId: number) => void;
  onRegenerateMessage?: () => void;
}) {
  return (
    <div aria-live="polite" aria-label="消息列表">
      {messages.map((msg, index) => {
        const isLastAssistant = msg.role === 'assistant'
          && !messages.slice(index + 1).some((m) => m.role === 'assistant');
        return (
        <MessageItem
          key={msg.id ?? `${msg.role}-${index}`}
          index={index}
          content={msg.content}
          isUser={msg.role === 'user'}
          messageState={msg.messageState ?? undefined}
          confirmedType={msg.confirmedType ?? undefined}
          candidateIntents={msg.candidateIntents}
          sourceContext={msg.sourceContext ?? undefined}
          matchedBy={msg.matchedBy ?? undefined}
          deepLink={msg.deepLink ?? undefined}
          nextPageLabel={msg.nextPageLabel ?? undefined}
          quickActions={msg.quickActions}
          changeLog={msg.changeLog}
          onMessageAction={onMessageAction}
          messageId={msg.id}
          originalUserMessage={msg.originalUserMessage}
          onCopy={onCopyMessage}
          onDelete={onDeleteMessage}
          onRegenerate={isLastAssistant && onRegenerateMessage ? onRegenerateMessage : undefined}
          createdAt={msg.createdAt}
        />
        );
      })}
      {isTyping ? (
        <div className="editorial-chat-row editorial-chat-row--assistant">
          <div className="editorial-chat-bubble editorial-chat-bubble--assistant">
            <div className="editorial-chat-typing">
              <span className="editorial-chat-typing-dot" />
              <span className="editorial-chat-typing-dot" />
              <span className="editorial-chat-typing-dot" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

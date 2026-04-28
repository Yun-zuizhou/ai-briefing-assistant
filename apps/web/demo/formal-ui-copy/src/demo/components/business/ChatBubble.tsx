import type { ReactNode } from 'react';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  cardContent?: ReactNode;
}

export default function ChatBubble({ role, content, cardContent }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-[var(--topic-ai)] text-white rounded-2xl rounded-br-sm'
            : 'bg-[var(--card)] text-[var(--fg)] rounded-2xl rounded-bl-sm shadow-sm'
        } px-4 py-2.5`}
      >
        {content && <p className="text-sm">{content}</p>}
        {cardContent && <div className="mt-2">{cardContent}</div>}
      </div>
    </div>
  );
}

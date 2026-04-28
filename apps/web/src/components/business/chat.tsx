import type { ReactNode } from 'react';
import Button from '../ui/Button';

export function ChatQuickActionButton({
  text,
  onClick,
  highlight,
}: {
  text: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="unstyled"
      onClick={onClick}
      className={`action-chip ${highlight ? 'primary' : ''}`}
    >
      {text}
    </Button>
  );
}

export function ChatFeedbackCard({
  label,
  children,
  tone = 'default',
  className = '',
}: {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'accent' | 'plain';
  className?: string;
}) {
  return (
    <div
      className={`feedback-card chat-feedback-card ${tone === 'accent' ? 'accent' : tone === 'plain' ? 'plain' : 'default'} ${className}`.trim()}
    >
      <div className="chat-feedback-label">
        {label}
      </div>
      {children}
    </div>
  );
}

export function ChatStatusPill({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'neutral' | 'pending' | 'success';
}) {
  return (
    <span
      className={`chat-status-pill tone-${tone}`}
    >
      {text}
    </span>
  );
}

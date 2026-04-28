import type { LucideIcon } from 'lucide-react';
import { Inbox, Search, FileX, UserX } from 'lucide-react';
import type { ReactNode } from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'default' | 'loading' | 'error' | 'profile';
}

const defaultIcons: Record<string, LucideIcon> = {
  default: Inbox,
  loading: Search,
  error: FileX,
  profile: UserX,
};

export default function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  type = 'default',
}: EmptyStateProps) {
  const Icon = icon || defaultIcons[type];

  return (
    <div className={`empty-state empty-state--${type}`}>
      <div className="empty-state-icon-shell">
        {emoji ? (
          <span className="empty-state-emoji">{emoji}</span>
        ) : (
          <Icon size={36} className="empty-state-icon-glyph" />
        )}
      </div>
      
      <h3 className="empty-state-title">
        {title}
      </h3>
      
      {description && (
        <p className={`empty-state-desc${actionLabel ? ' has-action' : ''}`}>
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <Button
          type="button"
          variant="unstyled"
          onClick={onAction}
          className="empty-state-action"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

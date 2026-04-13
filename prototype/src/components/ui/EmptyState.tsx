import type { LucideIcon } from 'lucide-react';
import { Inbox, Search, FileX, UserX } from 'lucide-react';
import type { ReactNode } from 'react';

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      animation: 'fadeInUp 0.4s ease-out',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '24px',
        background: type === 'loading' 
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
          : type === 'error'
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        {emoji ? (
          <span style={{ fontSize: '36px' }}>{emoji}</span>
        ) : (
          <Icon size={36} style={{ color: type === 'error' ? '#EF4444' : '#6366F1' }} />
        )}
      </div>
      
      <h3 style={{
        fontSize: '17px',
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: '8px',
      }}>
        {title}
      </h3>
      
      {description && (
        <p style={{
          fontSize: '14px',
          color: '#64748B',
          lineHeight: '1.6',
          marginBottom: actionLabel ? '20px' : '0',
          maxWidth: '260px',
        }}>
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

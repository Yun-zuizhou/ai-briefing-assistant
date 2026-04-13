import { useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmStyle?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

const styleConfig = {
  primary: {
    icon: Info,
    iconColor: 'var(--topic-ai)',
    iconBg: 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(30, 58, 95, 0.1) 100%)',
    confirmBg: 'linear-gradient(135deg, var(--topic-ai) 0%, #2a4a70 100%)',
    confirmShadow: '0 4px 12px rgba(30, 58, 95, 0.3)',
  },
  danger: {
    icon: AlertTriangle,
    iconColor: 'var(--accent)',
    iconBg: 'linear-gradient(135deg, rgba(139, 37, 0, 0.1) 0%, rgba(139, 37, 0, 0.1) 100%)',
    confirmBg: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
    confirmShadow: '0 4px 12px rgba(139, 37, 0, 0.3)',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'var(--gold)',
    iconBg: 'linear-gradient(135deg, rgba(184, 134, 11, 0.1) 0%, rgba(184, 134, 11, 0.1) 100%)',
    confirmBg: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
    confirmShadow: '0 4px 12px rgba(184, 134, 11, 0.3)',
  },
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = '确定',
  cancelLabel = '取消',
  confirmStyle = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = styleConfig[confirmStyle];
  const Icon = config.icon;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '320px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        animation: 'scaleIn 0.2s ease-out',
      }}>
        <div style={{
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: config.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Icon size={28} style={{ color: config.iconColor }} />
          </div>
          
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--fg)',
            marginBottom: message ? '8px' : '0',
          }}>
            {title}
          </h3>
          
          {message && (
            <p style={{
              fontSize: '14px',
              color: 'var(--muted)',
              lineHeight: '1.6',
            }}>
              {message}
            </p>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '16px',
              background: 'transparent',
              border: 'none',
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--muted)',
              cursor: 'pointer',
              borderRight: '1px solid var(--border)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '16px',
              background: config.confirmBg,
              border: 'none',
              fontSize: '15px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              boxShadow: config.confirmShadow,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = keyframes;
  document.head.appendChild(style);
}

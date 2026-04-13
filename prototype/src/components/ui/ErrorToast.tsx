import { useState, useEffect } from 'react';
import { X, Wifi, AlertTriangle, Server, AlertCircle } from 'lucide-react';

export type ToastType = 'network' | 'content' | 'server' | 'default';

interface ErrorToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  onRetry?: () => void;
}

const toastConfig: Record<ToastType, { icon: typeof Wifi; color: string; bg: string }> = {
  network: { icon: Wifi, color: '#EF4444', bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)' },
  content: { icon: AlertTriangle, color: '#F59E0B', bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)' },
  server: { icon: Server, color: '#8B5CF6', bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)' },
  default: { icon: AlertCircle, color: '#EF4444', bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)' },
};

export default function ErrorToast({
  message,
  type = 'default',
  duration = 4000,
  onClose,
  onRetry,
}: ErrorToastProps) {
  const [visible, setVisible] = useState(true);
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        background: 'white',
        borderRadius: '14px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: `1px solid ${config.color}20`,
        maxWidth: 'calc(100vw - 32px)',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: config.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} style={{ color: config.color }} />
        </div>
        
        <p style={{
          fontSize: '14px',
          color: '#334155',
          lineHeight: '1.4',
          flex: 1,
        }}>
          {message}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            重试
          </button>
        )}
        
        <button
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} style={{ color: '#94A3B8' }} />
        </button>
      </div>
    </div>
  );
}

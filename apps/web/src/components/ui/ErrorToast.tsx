import { useState, useEffect } from 'react';
import { X, Wifi, AlertTriangle, Server, AlertCircle } from 'lucide-react';
import Button from './Button';

export type ToastType = 'network' | 'content' | 'server' | 'default';

interface ErrorToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  onRetry?: () => void;
}

const toastConfig: Record<ToastType, { icon: typeof Wifi; tone: string }> = {
  network: { icon: Wifi, tone: 'network' },
  content: { icon: AlertTriangle, tone: 'content' },
  server: { icon: Server, tone: 'server' },
  default: { icon: AlertCircle, tone: 'default' },
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
    <div className="error-toast-wrap">
      <div className={`error-toast error-toast--${config.tone}`}>
        <div className="error-toast-icon-shell">
          <Icon size={18} className="error-toast-icon" />
        </div>
        
        <p className="error-toast-text">
          {message}
        </p>
        
        {onRetry && (
          <Button
            type="button"
            variant="unstyled"
            onClick={onRetry}
            className="error-toast-retry"
          >
            重试
          </Button>
        )}
        
        <Button
          type="button"
          variant="unstyled"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="error-toast-close"
        >
          <X size={16} className="error-toast-close-icon" />
        </Button>
      </div>
    </div>
  );
}

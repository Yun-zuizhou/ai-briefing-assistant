import { useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import Button from './Button';

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

const toneIconMap = {
  primary: Info,
  danger: AlertTriangle,
  warning: AlertTriangle,
} as const;

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

  const Icon = toneIconMap[confirmStyle];

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="confirm-modal-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
        className={`confirm-modal confirm-modal--${confirmStyle}`}
      >
        <span className="confirm-modal-frame" />

        <div className="confirm-modal-body">
          <div className="confirm-modal-icon-shell">
            <Icon size={20} className="confirm-modal-icon" />
          </div>

          <h3
            id="confirm-modal-title"
            className="confirm-modal-title"
          >
            {title}
          </h3>

          {message ? (
            <p className="confirm-modal-message">
              {message}
            </p>
          ) : null}
        </div>

        <div className="confirm-modal-actions">
          <Button
            type="button"
            variant="unstyled"
            onClick={onCancel}
            className="confirm-modal-cancel"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="unstyled"
            onClick={onConfirm}
            className={`confirm-modal-confirm confirm-modal-confirm--${confirmStyle}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

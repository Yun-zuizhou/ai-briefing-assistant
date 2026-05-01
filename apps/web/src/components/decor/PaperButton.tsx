import type { ReactNode } from 'react';

export function PaperButton({
  children,
  onClick,
  active = false,
  muted = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={muted}
      aria-disabled={muted}
      className={[
        'paper-btn',
        active ? 'paper-btn--active' : '',
        muted ? 'paper-btn--muted' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

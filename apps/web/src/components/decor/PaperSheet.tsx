import type { ReactNode } from 'react';

export function PaperSheet({
  children,
  bordered = false,
  className = '',
}: {
  children: ReactNode;
  bordered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        'paper-sheet',
        bordered ? 'paper-sheet--bordered' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

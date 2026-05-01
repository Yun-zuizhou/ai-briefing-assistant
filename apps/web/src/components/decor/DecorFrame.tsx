import type { ReactNode } from 'react';

export function DecorFrame({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`decor-frame ${className}`.trim()}>
      {children}
    </div>
  );
}

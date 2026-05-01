import type { ReactNode } from 'react';

export function QuoteBlock({
  children,
  cite,
  tone = 'default',
  className = '',
}: {
  children: ReactNode;
  cite?: string;
  tone?: 'default' | 'accent' | 'muted';
  className?: string;
}) {
  return (
    <blockquote
      className={`quote-block quote-block--${tone} ${className}`.trim()}
    >
      <div className="quote-block-content">{children}</div>
      {cite ? <cite className="quote-block-cite">{cite}</cite> : null}
    </blockquote>
  );
}

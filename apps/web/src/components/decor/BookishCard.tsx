import type { ReactNode } from 'react';
import { BookishSymbol } from './BookishSymbol';

export function BookishCard({
  title,
  children,
  ornament = 'diamond',
  variant = 'default',
  className = '',
}: {
  title?: string;
  children: ReactNode;
  ornament?: 'diamond' | 'star' | 'none';
  variant?: 'default' | 'raised' | 'plain';
  className?: string;
}) {
  return (
    <div className={`bookish-card bookish-card--${variant} ${className}`.trim()}>
      {title ? (
        <div className="bookish-card-header">
          <div className="bookish-card-title">
            {ornament !== 'none' ? (
              <BookishSymbol shape={ornament} size={10} />
            ) : null}
            <span>{title}</span>
          </div>
        </div>
      ) : null}
      <div className="bookish-card-body">{children}</div>
    </div>
  );
}

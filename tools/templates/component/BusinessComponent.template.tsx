import type { ReactNode } from 'react';

interface __Feature__CardProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function __Feature__Card({
  title,
  description,
  action,
  className = '',
}: __Feature__CardProps) {
  return (
    <article className={`domain-card __feature__-card ${className}`.trim()}>
      <div className="__feature__-card-main">
        <h3 className="__feature__-card-title">{title}</h3>
        <p className="__feature__-card-description">{description}</p>
      </div>
      {action ? (
        <div className="__feature__-card-action">
          {action}
        </div>
      ) : null}
    </article>
  );
}

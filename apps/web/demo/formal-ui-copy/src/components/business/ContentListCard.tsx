import type { ReactNode } from 'react';

export default function ContentListCard({
  eyebrow,
  title,
  summary,
  meta,
  footer,
  onClick,
  warm = false,
  featured = false,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  summary?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  warm?: boolean;
  featured?: boolean;
}) {
  return (
    <div
      className={`content-card ${featured ? 'featured' : ''}`}
      style={{
        background: warm ? 'var(--paper-warm)' : 'var(--paper)',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', alignItems: 'flex-start' }}>
        <span className="hero-kicker" style={{ margin: 0 }}>{eyebrow}</span>
        {meta}
      </div>
      <div className="content-title" style={{ marginBottom: summary || footer ? '6px' : 0 }}>
        {title}
      </div>
      {summary ? (
        <p className="content-summary" style={{ margin: footer ? '0 0 10px' : 0 }}>
          {summary}
        </p>
      ) : null}
      {footer}
    </div>
  );
}

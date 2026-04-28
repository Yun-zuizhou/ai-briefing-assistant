import type { ReactNode } from 'react';
import Button from '../ui/Button';

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
  const isInteractive = Boolean(onClick);

  const cardBody = (
    <>
      <div className="content-card-head">
        <span className="hero-kicker content-card-eyebrow">{eyebrow}</span>
        {meta ? <div className="content-card-meta">{meta}</div> : null}
      </div>
      <div className={`content-title content-card-title ${summary || footer ? 'with-divider' : ''}`}>
        {title}
      </div>
      {summary ? (
        <p className={`content-summary content-card-summary ${footer ? 'with-footer' : ''}`}>
          {summary}
        </p>
      ) : null}
      {footer}
    </>
  );

  const sharedProps = {
    className: `content-card ${featured ? 'featured' : ''} ${warm ? 'content-card--warm' : ''}`,
    'data-interactive': isInteractive ? 'true' : undefined,
  } as const;

  return isInteractive ? (
    <Button type="button" variant="unstyled" onClick={onClick} {...sharedProps}>
      {cardBody}
    </Button>
  ) : (
    <div {...sharedProps}>
      {cardBody}
    </div>
  );
}

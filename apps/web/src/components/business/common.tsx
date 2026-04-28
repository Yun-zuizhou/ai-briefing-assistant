import { ChevronRight } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import Button from '../ui/Button';

type NoticeTone = 'danger' | 'muted';

export function PageNoticeCard({
  title,
  detail,
  tone = 'danger',
  style,
}: {
  title: string;
  detail: string;
  tone?: NoticeTone;
  style?: CSSProperties;
}) {
  return (
    <div className={`domain-card page-notice-card tone-${tone}`} style={style}>
      <p className="page-notice-title">{title}</p>
      <p className="page-notice-detail">{detail}</p>
    </div>
  );
}

export function MetricMiniCard({
  value,
  label,
  accent = false,
}: {
  value: ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric-mini-card ${accent ? 'metric-mini-card-accent' : ''}`}>
      <p className="metric-mini-value">{value}</p>
      <p className="metric-mini-label">{label}</p>
    </div>
  );
}

export function NavigationEntryCard({
  title,
  description,
  onClick,
  trailing,
}: {
  title: string;
  description: string;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="unstyled"
      onClick={onClick}
      className="domain-card navigation-entry-card"
    >
      <div className="navigation-entry-main">
        <p className="navigation-entry-title">
          {title}
        </p>
        <p className="navigation-entry-desc">
          {description}
        </p>
      </div>
      {trailing ?? <ChevronRight size={18} className="navigation-entry-trailing" />}
    </Button>
  );
}

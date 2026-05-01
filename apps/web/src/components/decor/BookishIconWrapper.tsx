import type { LucideIcon } from 'lucide-react';

const toneColors = {
  gold: 'var(--bookish-gold)',
  primary: 'var(--bookish-ink-primary)',
  secondary: 'var(--bookish-ink-secondary)',
  faint: 'var(--bookish-ink-faint)',
};

export function BookishIconWrapper({
  icon: Icon,
  size = 20,
  tone = 'primary',
  className = '',
  ...rest
}: {
  icon: LucideIcon;
  size?: number;
  tone?: 'gold' | 'primary' | 'secondary' | 'faint';
  className?: string;
}) {
  return (
    <span
      className={`bookish-icon-wrapper ${className}`.trim()}
      style={{ color: toneColors[tone], display: 'inline-flex', flexShrink: 0 }}
      aria-hidden="true"
      {...rest}
    >
      <Icon size={size} />
    </span>
  );
}

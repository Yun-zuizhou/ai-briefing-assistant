import { BookishSymbol } from './BookishSymbol';

const toneConfig = {
  pending: { symbol: 'diamond' as const, className: 'status-badge--pending' },
  success: { symbol: 'star' as const, className: 'status-badge--success' },
  neutral: { symbol: 'square' as const, className: 'status-badge--neutral' },
};

export function StatusBadge({
  label,
  tone = 'neutral',
  className = '',
}: {
  label: string;
  tone?: 'pending' | 'success' | 'neutral';
  className?: string;
}) {
  const config = toneConfig[tone];
  return (
    <span className={`status-badge ${config.className} ${className}`.trim()}>
      <BookishSymbol shape={config.symbol} size={8} />
      <span>{label}</span>
    </span>
  );
}

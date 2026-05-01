import { BookishSymbol } from './BookishSymbol';

export function SectionHeader({
  title,
  subtitle,
  ornament = 'none',
  className = '',
}: {
  title: string;
  subtitle?: string;
  ornament?: 'star' | 'diamond' | 'none';
  className?: string;
}) {
  return (
    <div className={`section-header ${className}`.trim()}>
      {subtitle ? (
        <div className="section-header-subtitle">
          {ornament !== 'none' ? (
            <BookishSymbol shape={ornament} size={10} />
          ) : null}
          <span>{subtitle}</span>
          {ornament !== 'none' ? (
            <BookishSymbol shape={ornament} size={10} />
          ) : null}
        </div>
      ) : null}
      <h2 className="section-header-title">{title}</h2>
    </div>
  );
}

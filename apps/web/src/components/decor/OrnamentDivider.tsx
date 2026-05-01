import { BookishSymbol } from './BookishSymbol';

export function OrnamentDivider({
  ornament = 'none',
  dashed = false,
  className = '',
}: {
  ornament?: 'diamond' | 'star' | 'none';
  dashed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`ornament-divider ${dashed ? 'ornament-divider-dashed' : ''} ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="ornament-divider-line" />
      {ornament !== 'none' ? (
        <div className="ornament-divider-symbol">
          <BookishSymbol shape={ornament} size={10} />
        </div>
      ) : null}
      <div className="ornament-divider-line" />
    </div>
  );
}

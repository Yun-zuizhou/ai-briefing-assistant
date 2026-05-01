import { BookishSymbol } from './BookishSymbol';

export function BookishLabel({
  text,
  ornament = 'none',
  className = '',
}: {
  text: string;
  ornament?: 'diamond' | 'star' | 'none';
  className?: string;
}) {
  return (
    <div className={`bookish-label ${className}`.trim()}>
      {ornament !== 'none' ? (
        <BookishSymbol shape={ornament} size={8} />
      ) : null}
      <span>{text}</span>
      {ornament !== 'none' ? (
        <BookishSymbol shape={ornament} size={8} />
      ) : null}
    </div>
  );
}

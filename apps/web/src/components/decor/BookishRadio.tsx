import { BookishSymbol } from './BookishSymbol';

export function BookishRadio({
  checked = false,
  onChange,
  label,
  className = '',
}: {
  checked?: boolean;
  onChange?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <label className={`bookish-radio ${className}`.trim()}>
      <span
        className={`bookish-radio-dot ${checked ? 'bookish-radio-dot--checked' : ''}`}
        role="radio"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange?.(); }
        }}
      >
        <BookishSymbol
          shape="star"
          size={checked ? 14 : 16}
          variant={checked ? 'fill' : 'outline'}
        />
      </span>
      <input
        type="radio"
        checked={checked}
        onChange={() => onChange?.()}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        tabIndex={-1}
      />
      {label ? <span className="bookish-radio-label">{label}</span> : null}
    </label>
  );
}

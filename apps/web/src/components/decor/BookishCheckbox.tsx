import { BookishSymbol } from './BookishSymbol';

export function BookishCheckbox({
  checked = false,
  onChange,
  label,
  className = '',
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <label className={`bookish-checkbox ${className}`.trim()}>
      <span
        className={`bookish-checkbox-box ${checked ? 'bookish-checkbox-box--checked' : ''}`}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange?.(!checked); }
        }}
      >
        {checked ? (
          <BookishSymbol shape="check" size={14} variant="outline" />
        ) : (
          <BookishSymbol shape="diamond" size={16} variant="outline" />
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        tabIndex={-1}
      />
      {label ? <span className="bookish-checkbox-label">{label}</span> : null}
    </label>
  );
}

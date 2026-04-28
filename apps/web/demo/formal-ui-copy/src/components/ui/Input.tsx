import type { ChangeEvent, TextareaHTMLAttributes } from 'react';

interface InputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  variant?: 'single' | 'multi' | 'search';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Input({
  variant = 'single',
  value,
  onChange,
  placeholder = '',
  className = '',
  ...props
}: InputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const variants = {
    single: 'rounded-lg p-3 min-h-[44px] resize-none',
    multi: 'rounded-xl p-3 min-h-[80px] resize-y',
    search: 'rounded-full py-3 px-4 pl-10 min-h-[44px] resize-none',
  };

  return (
    <div className="relative w-full">
      {variant === 'search' && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]">🔍</span>
      )}
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--border)] focus:border-[var(--accent)] focus:bg-[var(--paper-warm)] focus:outline-none text-sm leading-6 [font-family:var(--font-sans-cn)] placeholder:text-[var(--ink-muted)] ${variants[variant]} ${className}`}
        rows={variant === 'single' || variant === 'search' ? 1 : 3}
        {...props}
      />
    </div>
  );
}

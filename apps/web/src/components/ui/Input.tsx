import type {
  ChangeEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

type SharedProps = {
  variant?: 'single' | 'multi' | 'search';
  as?: 'input' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'>;
type InputElementProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>;

type InputProps = SharedProps & (TextareaProps | InputElementProps);

export default function Input({
  variant = 'single',
  as = variant === 'multi' ? 'textarea' : 'input',
  value,
  onChange,
  placeholder = '',
  className = '',
  ...props
}: InputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const variants = {
    single: 'chat-input',
    multi: 'chat-input min-h-[80px] resize-y',
    search: 'chat-input min-h-[44px] pl-10',
  };

  const sharedClassName = `${variants[variant]} ${className}`.trim();

  return (
    <div className="relative w-full">
      {variant === 'search' && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]">🔍</span>
      )}
      {as === 'textarea' ? (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={sharedClassName}
          rows={variant === 'multi' ? 3 : 1}
          {...(props as TextareaProps)}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={sharedClassName}
          {...(props as InputElementProps)}
        />
      )}
    </div>
  );
}

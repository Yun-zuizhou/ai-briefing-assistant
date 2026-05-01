import type { ButtonHTMLAttributes, ReactNode } from 'react';

type __Feature__Tone = 'default' | 'accent' | 'muted';

interface __Feature__ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: __Feature__Tone;
  className?: string;
}

export function __Feature__Button({
  children,
  tone = 'default',
  className = '',
  ...props
}: __Feature__ButtonProps) {
  return (
    <button
      type="button"
      className={`__feature__-button tone-${tone} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

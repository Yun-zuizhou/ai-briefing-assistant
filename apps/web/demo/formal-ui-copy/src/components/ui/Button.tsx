import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'capsule';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 border-2 transition-all duration-200 font-semibold leading-none [font-family:var(--font-sans-cn)] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary:
      "bg-[var(--accent)] text-[var(--paper)] border-[var(--accent)] hover:opacity-92 active:translate-y-px",
    secondary:
      "bg-[var(--paper)] text-[var(--ink)] border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] active:translate-y-px",
    text:
      "bg-transparent text-[var(--accent)] border-transparent hover:bg-[var(--accent-light)] active:translate-y-px",
    capsule:
      "bg-[var(--accent)] text-[var(--paper)] border-[var(--accent)] rounded-full px-4 py-2 text-xs hover:opacity-92 active:translate-y-px",
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  const isCapsule = variant === 'capsule';

  return (
    <button
      className={`${baseStyles} ${isCapsule ? variants.capsule : variants[variant]} ${
        !isCapsule ? sizes[size] : ''
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin mr-2">⏳</span>}
      {children}
    </button>
  );
}

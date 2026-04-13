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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all';
  
  const variants = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] active:bg-[var(--accent-dark)]',
    secondary: 'bg-[var(--card)] text-[var(--fg)] border border-[var(--fg)] hover:bg-[var(--bg-paper)]',
    text: 'text-[var(--accent)] hover:bg-[var(--bg-paper)]',
    capsule: 'bg-[var(--accent)] text-white rounded-full px-4 py-2 text-xs',
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
      } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin mr-2">⏳</span>}
      {children}
    </button>
  );
}

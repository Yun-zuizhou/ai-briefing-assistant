import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'soft' | 'text' | 'capsule' | 'unstyled';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  loadingLabel = '处理中',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'btn btn-primary',
    secondary: 'btn',
    soft: 'btn btn-soft',
    text: 'btn btn-text',
    capsule: 'btn btn-primary btn-capsule',
    unstyled: '',
  };

  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const resolvedClassName = `${variants[variant]} ${sizes[size]} ${className}`.trim();

  return (
    <button
      className={resolvedClassName}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin" aria-hidden="true">⏳</span>
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

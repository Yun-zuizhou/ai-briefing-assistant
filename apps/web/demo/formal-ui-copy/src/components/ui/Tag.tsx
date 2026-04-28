import type { ReactNode } from 'react';

interface TagProps {
  variant?: 'default' | 'primary' | 'outline';
  children: ReactNode;
  className?: string;
}

export default function Tag({ variant = 'default', children, className = '' }: TagProps) {
  const variants = {
    default: 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]',
    primary: 'bg-[var(--accent)] text-white border-[var(--accent)]',
    outline: 'bg-transparent text-[var(--ink)] border-[var(--ink)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold tracking-[0.05em] border-2 shadow-[2px_2px_0_var(--paper-dark)] transition-all duration-200 [font-family:var(--font-sans-cn)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--paper-dark)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

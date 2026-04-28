import type { ReactNode } from 'react';

interface CardProps {
  size?: 'large' | 'medium' | 'small';
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'bordered' | 'elevated';
}

export default function Card({
  size = 'medium',
  children,
  className = '',
  onClick,
  variant = 'default',
}: CardProps) {
  const sizes = {
    large: 'p-5',
    medium: 'p-4',
    small: 'p-3',
  };

  const variants = {
    default: 'bg-paper-warm border border-border rounded-lg shadow-offset',
    bordered: 'bg-gradient-to-b from-paper-warm to-paper border border-border rounded-xl shadow-offset-lg overflow-hidden',
    elevated: 'bg-paper border-2 border-ink rounded-lg shadow-offset',
  };

  return (
    <div
      className={`${variants[variant]} ${sizes[size]} ${onClick ? 'cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-200' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

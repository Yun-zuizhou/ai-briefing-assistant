import type { ReactNode } from 'react';

interface CardProps {
  size?: 'large' | 'medium' | 'small';
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'bordered' | 'elevated' | 'notice';
}

export default function Card({
  size = 'medium',
  children,
  className = '',
  onClick,
  variant = 'default',
}: CardProps) {
  const sizes = {
    large: 'card-lg',
    medium: '',
    small: 'card-sm',
  };

  const variants = {
    default: 'card',
    bordered: 'card-bordered',
    elevated: 'card card-elevated',
    notice: 'card page-notice-card',
  };

  return (
    <div
      className={`${variants[variant]} ${sizes[size]} ${onClick ? 'cursor-pointer' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';

interface TagProps {
  variant?: 'default' | 'primary' | 'accent' | 'gold' | 'soft' | 'outline';
  children: ReactNode;
  className?: string;
}

export default function Tag({ variant = 'default', children, className = '' }: TagProps) {
  const variants = {
    default: 'tag',
    primary: 'tag tag-accent',
    accent: 'tag tag-accent',
    gold: 'tag tag-gold',
    soft: 'tag tag-soft',
    outline: 'tag tag-outline',
  };

  return (
    <span
      className={`${variants[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

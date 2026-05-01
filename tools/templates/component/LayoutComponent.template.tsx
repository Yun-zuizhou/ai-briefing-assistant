import type { ReactNode } from 'react';

interface __Feature__LayoutProps {
  children: ReactNode;
  className?: string;
}

export function __Feature__Layout({
  children,
  className = '',
}: __Feature__LayoutProps) {
  return (
    <section className={`__feature__-layout ${className}`.trim()}>
      {children}
    </section>
  );
}

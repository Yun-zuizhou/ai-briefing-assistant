import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function PageContainer({
  children,
  className = '',
  style,
}: PageContainerProps) {
  return (
    <div
      className={`page-container ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

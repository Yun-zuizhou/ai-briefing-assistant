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
      className={className}
      style={{
        flex: 1,
        overflow: 'auto',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

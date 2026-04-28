import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizes = {
  sm: { spinner: 20, container: 40 },
  md: { spinner: 32, container: 60 },
  lg: { spinner: 48, container: 80 },
};

export default function LoadingSpinner({ 
  size = 'md', 
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeConfig = sizes[size];
  const sizeClass = `is-${size}`;

  const content = (
    <div className={`loading-spinner-stack ${sizeClass}`}>
      <div className="loading-spinner-shell">
        <Loader2 
          size={sizeConfig.spinner} 
          className="loading-spinner-icon"
        />
      </div>
      
      {text && (
        <p className="loading-spinner-text">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner-overlay">
        {content}
      </div>
    );
  }

  return (
    <div className="loading-spinner-inline">
      {content}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="page-loading">
      <div className="page-loading-spinner-shell">
        <Loader2 
          size={32} 
          className="loading-spinner-icon"
        />
      </div>
      <p className="page-loading-text">
        加载中...
      </p>
    </div>
  );
}

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

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: sizeConfig.container,
        height: sizeConfig.container,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Loader2 
          size={sizeConfig.spinner} 
          style={{ 
            color: '#6366F1',
            animation: 'spin 1s linear infinite',
          }} 
        />
      </div>
      
      {text && (
        <p style={{
          fontSize: '14px',
          color: '#64748B',
          fontWeight: '500',
        }}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {content}
    </div>
  );
}

export function PageLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      gap: '16px',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Loader2 
          size={32} 
          style={{ 
            color: '#6366F1',
            animation: 'spin 1s linear infinite',
          }} 
        />
      </div>
      <p style={{
        fontSize: '15px',
        color: '#64748B',
        fontWeight: '500',
      }}>
        加载中...
      </p>
    </div>
  );
}

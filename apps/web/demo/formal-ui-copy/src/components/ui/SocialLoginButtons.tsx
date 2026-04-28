interface SocialLoginButtonsProps {
  mode: 'login' | 'register';
}

export default function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  return (
    <div style={{
      textAlign: 'center',
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '1px dashed var(--border)',
    }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '12px' }}>
        或使用以下方式{mode === 'login' ? '登录' : '注册'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <SocialButton emoji="💬" onClick={() => alert('微信登录功能开发中...')} />
        <SocialButton text="Q" onClick={() => alert('QQ登录功能开发中...')} />
      </div>
      {mode === 'register' && (
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--ink-muted)',
          marginTop: '16px',
        }}>
          注册即表示同意{' '}
          <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>
            服务条款
          </span>
          {' '}和{' '}
          <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>
            隐私政策
          </span>
        </p>
      )}
      {mode === 'login' && (
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--ink-muted)',
          marginTop: '16px',
        }}>
          登录即表示同意{' '}
          <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>
            服务条款
          </span>
          {' '}和{' '}
          <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>
            隐私政策
          </span>
        </p>
      )}
    </div>
  );
}

interface SocialButtonProps {
  emoji?: string;
  text?: string;
  onClick: () => void;
}

function SocialButton({ emoji, text, onClick }: SocialButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '48px',
        height: '48px',
        border: '2px solid var(--ink)',
        background: 'var(--paper-warm)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '2px 2px 0 var(--paper-dark)',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        left: '2px',
        right: '2px',
        bottom: '2px',
        border: '1px solid var(--ink)',
        pointerEvents: 'none',
      }} />
      {emoji && <span style={{ fontSize: '20px' }}>{emoji}</span>}
      {text && <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{text}</span>}
    </button>
  );
}

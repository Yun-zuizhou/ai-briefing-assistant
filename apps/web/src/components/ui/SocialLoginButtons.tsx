import { MessageCircle, QrCode } from 'lucide-react';
import type { ReactNode } from 'react';
import Button from './Button';

interface SocialLoginButtonsProps {
  mode: 'login' | 'register';
}

export default function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const channels = [
    {
      key: 'wechat',
      label: '微信',
      icon: <MessageCircle size={18} />,
      available: false,
    },
    {
      key: 'qq',
      label: 'QQ',
      icon: <QrCode size={18} />,
      available: false,
    },
  ] as const;

  return (
    <div className="social-login-panel">
      <p className="social-login-title">
        或使用以下方式{mode === 'login' ? '登录' : '注册'}
      </p>
      <div className="social-login-buttons">
        {channels.map((channel) => (
          <SocialButton
            key={channel.key}
            label={channel.label}
            icon={channel.icon}
            available={channel.available}
          />
        ))}
      </div>
      <p className="social-login-agreement">
        {mode === 'register' ? '注册即表示同意' : '登录即表示同意'} 服务条款 与 隐私政策
      </p>
    </div>
  );
}

interface SocialButtonProps {
  label: string;
  icon: ReactNode;
  available: boolean;
}

function SocialButton({ label, icon, available }: SocialButtonProps) {
  return (
    <Button
      type="button"
      variant="unstyled"
      disabled={!available}
      aria-label={available ? `${label}登录` : `${label}登录即将上线`}
      className={`social-login-btn ${available ? 'is-available' : 'is-disabled'}`}
    >
      <span className={`social-login-btn-icon ${available ? 'is-available' : 'is-disabled'}`}>{icon}</span>
      <span>{available ? label : `${label} 即将上线`}</span>
    </Button>
  );
}

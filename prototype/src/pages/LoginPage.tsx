import { useState, useCallback } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { PageLayout, Masthead, PageContent, PageFooterDecorative } from '../components/layout';
import { SocialLoginButtons } from '../components/ui';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: 'demo_user',
    email: 'demo@example.com',
    password: 'demo123456',
    confirmPassword: 'demo123456',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAppContext();

  const validateEmail = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const validatePassword = useCallback((password: string) => {
    return password.length >= 6;
  }, []);

  const handleSubmit = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (mode === 'register') {
      if (!formData.username.trim()) {
        newErrors.username = '请输入用户名';
      }
      if (formData.username.length < 2) {
        newErrors.username = '用户名至少2个字符';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码至少6个字符';
    }

    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      login(formData.username || '用户', formData.email);
      navigate('/interest-config');
    }
  }, [mode, formData, validateEmail, validatePassword, login, navigate]);

  return (
    <PageLayout variant="auth">
      <Masthead
        title="简 报"
        subtitle={mode === 'login' ? '登录你的账户' : '创建新账户'}
        ornaments={['✦ AI ✦', '✦ BRIEFING ✦']}
        leftButton={
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <ArrowLeft size={22} style={{ color: 'var(--ink)' }} />
          </button>
        }
      />

      <PageContent style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => setMode('login')}
            className="btn"
            style={{ 
              flex: 1, 
              padding: '12px',
              background: mode === 'login' ? 'var(--ink)' : 'var(--paper-warm)',
              color: mode === 'login' ? 'var(--paper)' : 'var(--ink)',
              fontSize: '15px',
            }}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className="btn"
            style={{ 
              flex: 1, 
              padding: '12px',
              background: mode === 'register' ? 'var(--ink)' : 'var(--paper-warm)',
              color: mode === 'register' ? 'var(--paper)' : 'var(--ink)',
              fontSize: '15px',
            }}
          >
            注册
          </button>
        </div>

        <div className="domain-card" style={{ padding: '20px' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px dashed var(--border)',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              border: '2px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: '3px',
                left: '3px',
                right: '3px',
                bottom: '3px',
                border: '1px solid var(--ink)',
                pointerEvents: 'none',
              }} />
              <span style={{ fontSize: '24px' }}>📰</span>
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: '6px',
            }}>
              {mode === 'login' ? '欢迎回来' : '开始订阅'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-muted)' }}>
              {mode === 'login' ? '登录以查看你的专属简报' : '创建账户，开启信息之旅'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '8px',
                  letterSpacing: '0.05em',
                }}>
                  用户名
                </label>
                <input
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="chat-input"
                  style={{ width: '100%', padding: '12px 14px', fontSize: '15px', background: errors.username ? 'var(--accent-light)' : 'var(--paper-warm)' }}
                />
                {errors.username && (
                  <p style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '4px' }}>
                    {errors.username}
                  </p>
                )}
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '8px',
                letterSpacing: '0.05em',
              }}>
                邮箱
              </label>
              <input
                type="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="chat-input"
                style={{ width: '100%', padding: '12px 14px', fontSize: '15px', background: errors.email ? 'var(--accent-light)' : 'var(--paper-warm)' }}
              />
              {errors.email && (
                <p style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '8px',
                letterSpacing: '0.05em',
              }}>
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="chat-input"
                  style={{ 
                    width: '100%', 
                    padding: '12px 40px 12px 14px',
                    fontSize: '15px',
                    background: errors.password ? 'var(--accent-light)' : 'var(--paper-warm)'
                  }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} style={{ color: 'var(--ink-muted)' }} />
                  ) : (
                    <Eye size={18} style={{ color: 'var(--ink-muted)' }} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '8px',
                  letterSpacing: '0.05em',
                }}>
                  确认密码
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="chat-input"
                  style={{ width: '100%', padding: '12px 14px', fontSize: '15px', background: errors.confirmPassword ? 'var(--accent-light)' : 'var(--paper-warm)' }}
                />
                {errors.confirmPassword && (
                  <p style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '4px' }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}
          </div>

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <button style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}>
                忘记密码？
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '20px', fontSize: '16px' }}
          >
            {mode === 'login' ? '登 录' : '注 册'}
          </button>

          <SocialLoginButtons mode={mode} />
        </div>
      </PageContent>

      <PageFooterDecorative />
    </PageLayout>
  );
}

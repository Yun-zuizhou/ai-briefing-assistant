import { useState, useCallback } from 'react';
import { Eye, EyeOff, ArrowLeft, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { PageLayout, Masthead, PageContent, PageFooterDecorative } from '../components/layout';
import { Button, SocialLoginButtons } from '../components/ui';

type AuthMode = 'login' | 'register';

type TestAccountPreset = {
  key: 'fresh' | 'test' | 'show';
  title: string;
  username: string;
  email: string;
  description: string;
};

function buildFreshEmail() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `newuser+${stamp}@example.com`;
}

function buildTestAccountPresets(): TestAccountPreset[] {
  return [
    {
      key: 'fresh',
      title: '新用户新邮箱',
      username: 'new_user',
      email: buildFreshEmail(),
      description: '自动创建空白用户，验证首次进入时的空状态与引导。',
    },
    {
      key: 'test',
      title: 'test@example.com',
      username: 'testuser',
      email: 'test@example.com',
      description: '主测试用户，包含完整行为数据、记录、待办和回顾内容。',
    },
    {
      key: 'show',
      title: 'show@example.com',
      username: 'showcase_user',
      email: 'show@example.com',
      description: '展示用户，内容更偏前端、设计、远程机会等演示场景。',
    },
  ];
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, register, authLoading } = useAppContext();

  const validateEmail = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const validatePassword = useCallback((password: string) => {
    return password.length >= 6;
  }, []);

  const handleApplyPreset = useCallback((preset: TestAccountPreset) => {
    setMode(preset.key === 'fresh' ? 'register' : 'login');
    setErrors({});
    setFormData({
      username: preset.username,
      email: preset.email,
      password: 'test123456',
      confirmPassword: 'test123456',
    });
  }, []);

  const handleSubmit = useCallback(async () => {
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
      try {
        setSubmitting(true);
        if (mode === 'login') {
          await login(formData.email.trim() || formData.username.trim(), formData.password);
          navigate('/today');
          return;
        }

        await register({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          nickname: formData.username.trim(),
        });
        navigate('/interest-config');
      } catch (error) {
        setErrors({
          submit: error instanceof Error ? error.message : `${mode === 'login' ? '登录' : '注册'}失败`,
        });
      } finally {
        setSubmitting(false);
      }
    }
  }, [mode, formData, validateEmail, validatePassword, login, navigate, register]);

  const testAccountPresets = buildTestAccountPresets();

  return (
    <PageLayout variant="auth">
      <Masthead
        title="简 报"
        subtitle={mode === 'login' ? '登录你的账户' : '创建新账户'}
        ornaments={['✦ AI ✦', '✦ BRIEFING ✦']}
        leftButton={
          <Button
            type="button"
            variant="unstyled"
            onClick={() => navigate(-1)}
            className="login-back-btn"
          >
            <ArrowLeft size={22} className="login-back-icon" />
          </Button>
        }
      />

      <PageContent className="login-page-content">
        <div className="login-mode-switch">
          <Button
            type="button"
            variant="unstyled"
            onClick={() => setMode('login')}
            className={`btn login-mode-btn${mode === 'login' ? ' is-active' : ''}`}
          >
            登录
          </Button>
          <Button
            type="button"
            variant="unstyled"
            onClick={() => setMode('register')}
            className={`btn login-mode-btn${mode === 'register' ? ' is-active' : ''}`}
          >
            注册
          </Button>
        </div>

        <div className="domain-card login-auth-card">
          <div className="login-auth-head">
            <div className="auth-icon-shell login-auth-icon-shell">
              <Newspaper size={30} strokeWidth={1.9} className="auth-icon-glyph" />
            </div>
            <h2 className="login-auth-title">
              {mode === 'login' ? '欢迎回来' : '开始订阅'}
            </h2>
            <p className="login-auth-subtitle">
              {mode === 'login' ? '登录以查看你的专属简报' : '创建账户，开启信息之旅'}
            </p>
          </div>

          {mode === 'login' ? (
            <details className="login-debug-panel">
              <summary className="login-debug-summary">
                开发调试：测试邮箱快速切换
              </summary>
              <div className="login-debug-list">
                {testAccountPresets.map((preset) => (
                  <Button
                    key={preset.key}
                    type="button"
                    variant="unstyled"
                    onClick={() => handleApplyPreset(preset)}
                    className={`login-debug-item${formData.email === preset.email ? ' is-active' : ''}`}
                  >
                    <div className="login-debug-item-head">
                      <span className="login-debug-item-title">{preset.title}</span>
                      <span className="login-debug-item-email">{preset.email}</span>
                    </div>
                    <p className="login-debug-item-desc">
                      {preset.description}
                    </p>
                  </Button>
                ))}
              </div>
            </details>
          ) : null}

          <div className="login-form-grid">
            {mode === 'register' && (
              <div className="login-field">
                <label htmlFor="register-username" className="login-field-label">
                  用户名
                </label>
                <input
                  id="register-username"
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`chat-input login-input${errors.username ? ' is-error' : ''}`}
                />
                {errors.username && (
                  <p className="login-field-error">
                    {errors.username}
                  </p>
                )}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="auth-email" className="login-field-label">
                邮箱
              </label>
              <input
                id="auth-email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`chat-input login-input${errors.email ? ' is-error' : ''}`}
              />
              {errors.email && (
                <p className="login-field-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="auth-password" className="login-field-label">
                密码
              </label>
              <div className="login-password-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`chat-input login-input login-password-input${errors.password ? ' is-error' : ''}`}
                />
                <Button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  variant="unstyled"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  className="login-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="login-password-icon" />
                  ) : (
                    <Eye size={18} className="login-password-icon" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="login-field-error">
                  {errors.password}
                </p>
              )}
            </div>

            {mode === 'register' && (
              <div className="login-field">
                <label htmlFor="register-confirm-password" className="login-field-label">
                  确认密码
                </label>
                <input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`chat-input login-input${errors.confirmPassword ? ' is-error' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="login-field-error">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}
          </div>

          {errors.submit ? (
            <div className="login-submit-error">
              <p className="login-submit-error-text">{errors.submit}</p>
            </div>
          ) : null}

          {mode === 'login' && (
            <div className="login-forgot-wrap">
              <Button type="button" variant="unstyled" className="login-forgot-btn">
                忘记密码？
              </Button>
            </div>
          )}

          <Button
            onClick={() => void handleSubmit()}
            variant="primary"
            className="login-submit-btn"
            disabled={submitting || authLoading}
          >
            {submitting || authLoading ? '处理中...' : mode === 'login' ? '登 录' : '注 册'}
          </Button>

          <SocialLoginButtons mode={mode} />
        </div>
      </PageContent>

      <PageFooterDecorative />
    </PageLayout>
  );
}

import { ArrowLeft, BookOpen, ChevronRight, Eye, EyeOff, Newspaper, Radar } from 'lucide-react';

import { Button, SocialLoginButtons } from '../ui';

type AuthMode = 'login' | 'register';

const WELCOME_SLIDES = [
  {
    icon: <Newspaper size={38} strokeWidth={1.9} className="auth-icon-glyph" />,
    title: '每天一份简报',
    description: '帮你收集世界，记录自己，看见成长',
  },
  {
    icon: <Radar size={38} strokeWidth={1.9} className="auth-icon-glyph" />,
    title: '智能信息追踪',
    description: '从热点中提炼机会，从趋势中发现方向',
  },
  {
    icon: <BookOpen size={38} strokeWidth={1.9} className="auth-icon-glyph" />,
    title: '你的个人叙事',
    description: 'AI帮你绘制专属画像，见证成长轨迹',
  },
];

interface LoginFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface TestAccountPreset {
  key: 'fresh' | 'test' | 'show';
  title: string;
  username: string;
  email: string;
  description: string;
}

export function WelcomeSlideDeck({
  currentSlide,
  touchOffset,
  onGoToSlide,
  onNext,
  onStart,
  onTouchEnd,
  onTouchMove,
  onTouchStart,
}: {
  currentSlide: number;
  touchOffset: number;
  onGoToSlide: (index: number) => void;
  onNext: () => void;
  onStart: () => void;
  onTouchEnd: React.TouchEventHandler<HTMLDivElement>;
  onTouchMove: React.TouchEventHandler<HTMLDivElement>;
  onTouchStart: React.TouchEventHandler<HTMLDivElement>;
}) {
  const slide = WELCOME_SLIDES[currentSlide] ?? WELCOME_SLIDES[0];
  const isLastSlide = currentSlide === WELCOME_SLIDES.length - 1;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`welcome-slider-shell${touchOffset === 0 ? ' is-resting' : ' is-dragging'}`}
      style={touchOffset === 0 ? undefined : { transform: `translateX(${Math.max(Math.min(touchOffset * 0.08, 12), -12)}px)` }}
    >
      <div className="domain-card welcome-slide-card">
        <div className="auth-icon-shell">
          {slide.icon}
        </div>

        <div className="welcome-slide-ornament">
          <span className="welcome-ornament-line" />
          <span className="welcome-ornament-diamond" />
          <span className="welcome-ornament-line" />
        </div>

        <h2 className="welcome-slide-title">
          {slide.title}
        </h2>

        <p className="welcome-slide-desc">
          {slide.description}
        </p>

        <div className="welcome-dots">
          {WELCOME_SLIDES.map((_, i) => (
            <Button
              type="button"
              key={i}
              variant="unstyled"
              onClick={() => onGoToSlide(i)}
              aria-label={`切换到第 ${i + 1} 页`}
              aria-pressed={i === currentSlide}
              className={`welcome-dot${i === currentSlide ? ' is-active' : ''}`}
            >
              <span aria-hidden="true" />
            </Button>
          ))}
        </div>

        <p className="micro-meta welcome-slide-meta">
          左右滑动翻页，也可以点下方进度切换内容
        </p>

        <div className="welcome-action-row">
          {isLastSlide ? (
            <Button
              onClick={onStart}
              variant="primary"
              className="welcome-action-btn"
            >
              开始使用 <ChevronRight size={20} />
            </Button>
          ) : (
            <Button
              onClick={onNext}
              variant="secondary"
              className="welcome-action-btn"
            >
              下一步 <ChevronRight size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginBackButton({ onBack }: { onBack: () => void }) {
  return (
    <Button
      type="button"
      variant="unstyled"
      onClick={onBack}
      className="login-back-btn"
    >
      <ArrowLeft size={22} className="login-back-icon" />
    </Button>
  );
}

export function LoginModeSwitch({
  mode,
  onModeChange,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}) {
  return (
    <div className="login-mode-switch">
      <Button
        type="button"
        variant="unstyled"
        onClick={() => onModeChange('login')}
        className={`btn login-mode-btn${mode === 'login' ? ' is-active' : ''}`}
      >
        登录
      </Button>
      <Button
        type="button"
        variant="unstyled"
        onClick={() => onModeChange('register')}
        className={`btn login-mode-btn${mode === 'register' ? ' is-active' : ''}`}
      >
        注册
      </Button>
    </div>
  );
}

export function LoginAuthCard({
  authLoading,
  errors,
  formData,
  mode,
  onApplyPreset,
  onFieldChange,
  onSubmit,
  presets,
  setShowPassword,
  showPassword,
  submitting,
}: {
  authLoading: boolean;
  errors: Record<string, string>;
  formData: LoginFormData;
  mode: AuthMode;
  onApplyPreset: (preset: TestAccountPreset) => void;
  onFieldChange: (field: keyof LoginFormData, value: string) => void;
  onSubmit: () => void;
  presets: TestAccountPreset[];
  setShowPassword: (value: boolean) => void;
  showPassword: boolean;
  submitting: boolean;
}) {
  return (
    <div className="domain-card login-auth-card">
      <LoginAuthHead mode={mode} />
      {mode === 'login' && import.meta.env.DEV ? (
        <LoginDebugPanel formEmail={formData.email} onApplyPreset={onApplyPreset} presets={presets} />
      ) : null}
      <LoginFormFields
        errors={errors}
        formData={formData}
        mode={mode}
        onFieldChange={onFieldChange}
        setShowPassword={setShowPassword}
        showPassword={showPassword}
      />
      {errors.submit ? (
        <div className="login-submit-error">
          <p className="login-submit-error-text">{errors.submit}</p>
        </div>
      ) : null}
      {mode === 'login' ? (
        <div className="login-forgot-wrap">
          <Button type="button" variant="unstyled" className="login-forgot-btn">
            忘记密码？
          </Button>
        </div>
      ) : null}
      <Button
        onClick={onSubmit}
        variant="primary"
        className="login-submit-btn"
        disabled={submitting || authLoading}
      >
        {submitting || authLoading ? '处理中...' : mode === 'login' ? '登 录' : '注 册'}
      </Button>
      <SocialLoginButtons mode={mode} />
    </div>
  );
}

function LoginAuthHead({ mode }: { mode: AuthMode }) {
  return (
    <div className="login-auth-head">
      <div className="auth-icon-shell login-auth-icon-shell">
        <Newspaper size={30} strokeWidth={1.9} className="auth-icon-glyph" />
      </div>
      <h2 className="login-auth-title">
        {mode === 'login' ? '欢迎回来' : '开始订阅'}
      </h2>
      <p className="login-auth-subtitle">
        {mode === 'login' ? '登录后回到你的简报、待办和个人沉淀' : '创建账户后先配置关注领域'}
      </p>
    </div>
  );
}

function LoginDebugPanel({
  formEmail,
  onApplyPreset,
  presets,
}: {
  formEmail: string;
  onApplyPreset: (preset: TestAccountPreset) => void;
  presets: TestAccountPreset[];
}) {
  return (
    <details className="login-debug-panel">
      <summary className="login-debug-summary">
        开发调试：测试邮箱快速切换
      </summary>
      <div className="login-debug-list">
        {presets.map((preset) => (
          <Button
            key={preset.key}
            type="button"
            variant="unstyled"
            onClick={() => onApplyPreset(preset)}
            className={`login-debug-item${formEmail === preset.email ? ' is-active' : ''}`}
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
  );
}

function LoginFormFields({
  errors,
  formData,
  mode,
  onFieldChange,
  setShowPassword,
  showPassword,
}: {
  errors: Record<string, string>;
  formData: LoginFormData;
  mode: AuthMode;
  onFieldChange: (field: keyof LoginFormData, value: string) => void;
  setShowPassword: (value: boolean) => void;
  showPassword: boolean;
}) {
  return (
    <div className="login-form-grid">
      {mode === 'register' ? (
        <LoginTextField
          error={errors.username}
          id="register-username"
          label="用户名"
          onChange={(value) => onFieldChange('username', value)}
          placeholder="请输入用户名"
          type="text"
          value={formData.username}
        />
      ) : null}

      <LoginTextField
        error={errors.email}
        id="auth-email"
        label="邮箱"
        onChange={(value) => onFieldChange('email', value)}
        placeholder="请输入邮箱地址"
        type="email"
        value={formData.email}
      />

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
            onChange={(event) => onFieldChange('password', event.target.value)}
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
        {errors.password ? (
          <p className="login-field-error">
            {errors.password}
          </p>
        ) : null}
      </div>

      {mode === 'register' ? (
        <LoginTextField
          error={errors.confirmPassword}
          id="register-confirm-password"
          label="确认密码"
          onChange={(value) => onFieldChange('confirmPassword', value)}
          placeholder="请再次输入密码"
          type={showPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
        />
      ) : null}
    </div>
  );
}

function LoginTextField({
  error,
  id,
  label,
  onChange,
  placeholder,
  type,
  value,
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  return (
    <div className="login-field">
      <label htmlFor={id} className="login-field-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`chat-input login-input${error ? ' is-error' : ''}`}
      />
      {error ? (
        <p className="login-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

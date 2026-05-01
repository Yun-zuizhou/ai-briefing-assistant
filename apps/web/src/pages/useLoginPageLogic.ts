import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppContext } from '../context/useAppContext';

export type AuthMode = 'login' | 'register';

export interface LoginFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TestAccountPreset {
  key: 'fresh' | 'test' | 'show';
  title: string;
  username: string;
  email: string;
  description: string;
}

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

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  return password.length >= 6;
}

export function useLoginPageLogic() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authResolved, login, register, authLoading } = useAppContext();

  const fromState = (location.state as { from?: { pathname: string; search: string } } | null)?.from;

  useEffect(() => {
    if (authResolved && user.isLoggedIn) {
      const target = fromState
        ? fromState.pathname + (fromState.search || '')
        : '/today';
      navigate(target, { replace: true });
    }
  }, [authResolved, user.isLoggedIn, fromState, navigate]);

  const testAccountPresets = useMemo(buildTestAccountPresets, []);

  const updateFormField = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
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
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSubmitting(true);
      if (mode === 'login') {
        await login(formData.email.trim() || formData.username.trim(), formData.password);
        const target = fromState
          ? fromState.pathname + (fromState.search || '')
          : '/today';
        navigate(target, { replace: true });
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
  }, [mode, formData, fromState, login, navigate, register]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return {
    authLoading,
    errors,
    formData,
    handleApplyPreset,
    handleBack,
    handleSubmit,
    mode,
    setMode,
    setShowPassword,
    showPassword,
    submitting,
    testAccountPresets,
    updateFormField,
  };
}

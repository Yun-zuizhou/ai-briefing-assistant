import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { AppContext, type AppContextType, type AppUser } from './context';

const EMPTY_USER: AppUser = {
  isLoggedIn: false,
  username: '',
  email: '',
  nickname: null,
};

const DEV_AUTO_LOGIN_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTO_LOGIN !== 'false';
const DEV_AUTO_LOGIN_IDENTIFIER = import.meta.env.VITE_DEV_AUTO_LOGIN_IDENTIFIER || 'test@example.com';
const DEV_AUTO_LOGIN_PASSWORD = import.meta.env.VITE_DEV_AUTO_LOGIN_PASSWORD || 'test123456';

function toAppUser(payload?: {
  id: number;
  username: string;
  email: string;
  nickname?: string | null;
} | null): AppUser {
  if (!payload) {
    return EMPTY_USER;
  }

  return {
    id: payload.id,
    isLoggedIn: true,
    username: payload.username,
    email: payload.email,
    nickname: payload.nickname ?? null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(EMPTY_USER);
  const [authResolved, setAuthResolved] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [openChatPanel, setOpenChatPanel] = useState<boolean>(false);
  const autoLoginAttemptedRef = useRef(false);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);

  const refreshCurrentUser = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const refreshTask = (async () => {
      try {
        const response = await apiService.getCurrentUser();
        if (response.data?.user) {
          setUser(toAppUser(response.data.user));
          return;
        }

        if (
          DEV_AUTO_LOGIN_ENABLED
          && !autoLoginAttemptedRef.current
          && response.error
        ) {
          autoLoginAttemptedRef.current = true;
          const loginResponse = await apiService.login({
            identifier: DEV_AUTO_LOGIN_IDENTIFIER,
            password: DEV_AUTO_LOGIN_PASSWORD,
          });
          if (loginResponse.data?.user) {
            const hydratedResponse = await apiService.getCurrentUser();
            if (hydratedResponse.data?.user) {
              setUser(toAppUser(hydratedResponse.data.user));
              return;
            }

            setUser(toAppUser(loginResponse.data.user));
            return;
          }
        }

        if (response.error) {
          setUser(EMPTY_USER);
          return;
        }

        setUser(EMPTY_USER);
      } catch (error) {
        console.error('Failed to hydrate current user:', error);
        setUser(EMPTY_USER);
      } finally {
        setAuthResolved(true);
        setAuthLoading(false);
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = refreshTask;
    return refreshTask;
  }, []);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  const login = useCallback(async (identifier: string, password: string) => {
    setAuthLoading(true);
    const response = await apiService.login({ identifier, password });
    if (response.error || !response.data?.user) {
      setAuthLoading(false);
      throw new Error(response.error || '登录失败');
    }

    setUser(toAppUser(response.data.user));
    setAuthResolved(true);
    setAuthLoading(false);
  }, []);

  const register = useCallback(async (payload: {
    username: string;
    email: string;
    password: string;
    nickname?: string | null;
  }) => {
    setAuthLoading(true);
    const response = await apiService.register(payload);
    if (response.error || !response.data?.user) {
      setAuthLoading(false);
      throw new Error(response.error || '注册失败');
    }

    setUser(toAppUser(response.data.user));
    setAuthResolved(true);
    setAuthLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await apiService.logout();
    } finally {
      setUser(EMPTY_USER);
      setAuthResolved(true);
      setAuthLoading(false);
    }
  }, []);

  const value: AppContextType = useMemo(
    () => ({
      user,
      authResolved,
      authLoading,
      login,
      register,
      logout,
      openChatPanel,
      setOpenChatPanel,
    }),
    [authLoading, authResolved, login, logout, openChatPanel, register, user],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  issueAccessToken,
  setAccessToken,
  setUnauthorizedHandler,
} from '../api/client';
import { fetchMe } from '../api/queries';
import type { User } from '../api/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /** /auth/callback 에서 호출: cookie의 refresh token으로 access token 발급 */
  completeLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 백엔드에 로그아웃 API가 없어 refresh token cookie가 남으므로,
 * 로그아웃 후에는 이 플래그가 있는 동안 자동 로그인을 하지 않음
 */
const LOGGED_OUT_KEY = 'income.loggedOut';
export const CALLBACK_PATH = '/auth/callback';

const storage = {
  isLoggedOut: () => {
    try {
      return localStorage.getItem(LOGGED_OUT_KEY) === '1';
    } catch {
      return false;
    }
  },
  setLoggedOut: (value: boolean) => {
    try {
      if (value) localStorage.setItem(LOGGED_OUT_KEY, '1');
      else localStorage.removeItem(LOGGED_OUT_KEY);
    } catch {
      /* storage 사용 불가 환경은 무시 */
    }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const signOutLocally = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOutLocally);
    return () => setUnauthorizedHandler(null);
  }, [signOutLocally]);

  // 앱 진입 시 refresh token cookie가 살아 있으면 자동 로그인 (callback 화면은 직접 처리)
  useEffect(() => {
    if (window.location.pathname === CALLBACK_PATH) return;
    if (storage.isLoggedOut()) {
      setStatus('anonymous');
      return;
    }
    let cancelled = false;
    issueAccessToken()
      .then(fetchMe)
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) signOutLocally();
      });
    return () => {
      cancelled = true;
    };
  }, [signOutLocally]);

  const completeLogin = useCallback(async () => {
    storage.setLoggedOut(false);
    await issueAccessToken();
    const me = await fetchMe();
    setUser(me);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    storage.setLoggedOut(true);
    queryClient.clear();
    signOutLocally();
  }, [queryClient, signOutLocally]);

  const value = useMemo(
    () => ({ status, user, completeLogin, logout }),
    [status, user, completeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서 사용하세요.');
  return ctx;
};

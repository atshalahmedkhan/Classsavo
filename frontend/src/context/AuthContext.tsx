import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth';
import type { RegisterPayload, User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  isInstructor: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistAuth = (user: User, access: string, refresh: string) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('access_token');

      if (!storedUser || !accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.me();
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    persistAuth(data.user, data.access, data.refresh);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await authApi.register(payload);
    persistAuth(data.user, data.tokens.access, data.tokens.refresh);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      isInstructor: user?.role === ('instructor' as UserRole),
      isStudent: user?.role === ('student' as UserRole),
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

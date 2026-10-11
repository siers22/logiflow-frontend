'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, type BackendUser, type AuthData } from '@/lib/api';
import { Session, SessionChangedError } from '@/lib/session';
import type { User, UserRole } from '@/types';
function mapBackendUser(bu: BackendUser): User {
  if (!['client', 'manager', 'driver', 'admin'].includes(bu.Role))
    throw new Error('Роль пользователя не поддерживается сервером.');
  return {
    id: bu.ID,
    name: bu.FullName || bu.Email,
    email: bu.Email,
    role: bu.Role as UserRole,
    slug: bu.Slug,
    avatarUrl: bu.AvatarURL || undefined,
    createdAt: bu.CreatedAt,
  };
}
interface UserContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<void>;
  logout: () => void;
  withAuth: <T>(fn: (token: string) => Promise<T>) => Promise<T>;
}
const UserContext = createContext<UserContextType | undefined>(undefined);
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [accessToken, setAccessToken] = useState<string | null>(null),
    [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [session] = useState(
    () =>
      new Session((auth: AuthData | null) => {
        const mapped = auth ? mapBackendUser(auth.user) : null;
        setUser(mapped);
        setAccessToken(auth?.access_token ?? null);
      }),
  );
  useEffect(() => {
    let live = true;
    // Migrate old installations: credentials are now held only in memory.
    localStorage.removeItem('logiflow-token');
    localStorage.removeItem('logiflow-user');
    session
      .refresh()
      .catch(() => {})
      .finally(() => {
        if (live) setIsLoading(false);
      });
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'logiflow-logout') {
        session.clear();
        router.replace('/login');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      live = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [session, router]);
  const login = async (email: string, password: string) => {
    const auth = await session.signIn(() => api.auth.login(email, password));
    router.push(`/dashboard/${mapBackendUser(auth.user).role}`);
  };
  const register = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    const auth = await session.signIn(() =>
      api.auth.register(email, password, fullName),
    );
    router.push(`/dashboard/${mapBackendUser(auth.user).role}`);
  };
  const logout = useCallback(() => {
    const token = session.token;
    session.clear();
    localStorage.setItem('logiflow-logout', String(Date.now()));
    router.push('/login');
    if (token) api.auth.logout(token).catch(() => {});
  }, [session, router]);
  const withAuth = useCallback(
    async <T,>(execute: (token: string) => Promise<T>): Promise<T> => {
      try {
        return await session.run(execute);
      } catch (err) {
        if (err instanceof SessionChangedError) throw err;
        if (err instanceof ApiError && err.status === 401) {
          logout();
          throw new ApiError(401, 'Сессия истекла. Войдите снова.');
        }
        throw err;
      }
    },
    [session, logout],
  );
  return (
    <UserContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        withAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}

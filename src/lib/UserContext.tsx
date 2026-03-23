"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { BackendUser, AuthData } from "@/lib/api";
import type { User, UserRole } from "@/types";

const TOKEN_KEY = "logiflow-token";
const USER_KEY = "logiflow-user";

function mapBackendUser(bu: BackendUser): User {
  const role = (bu.Role as UserRole) || "client";
  return {
    id: bu.ID,
    name: bu.FullName || bu.Email,
    email: bu.Email,
    role,
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
    role: string,
  ) => Promise<void>;
  logout: () => void;
  /** Выполняет fn с текущим токеном. При 401 обновляет токен и повторяет один раз. */
  withAuth: <T>(fn: (token: string) => Promise<T>) => Promise<T>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Ref для синхронного доступа к токену внутри withAuth
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = accessToken;

  // Промис переопределения токена, чтобы параллельные 401 не запускали несколько refresh
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  const applyAuth = (authData: AuthData) => {
    const mappedUser = mapBackendUser(authData.user);
    setUser(mappedUser);
    setAccessToken(authData.access_token);
    tokenRef.current = authData.access_token;
    localStorage.setItem(TOKEN_KEY, authData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    return authData.access_token;
  };

  const doRefresh = (): Promise<string> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const token = tokenRef.current;
    if (!token) return Promise.reject(new Error("No token"));

    refreshPromiseRef.current = api.auth
      .refresh(token)
      .then((authData) => {
        const newToken = applyAuth(authData);
        return newToken;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  };

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const backendUser = await api.me.get(storedToken);
        const mappedUser = mapBackendUser(backendUser);
        setUser(mappedUser);
        setAccessToken(storedToken);
        tokenRef.current = storedToken;
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
      } catch (err) {
        // При 401 пробуем обновить токен через refresh_token cookie
        if (err instanceof ApiError && err.status === 401) {
          try {
            const refreshed = await api.auth.refresh(storedToken);
            const mappedUser = mapBackendUser(refreshed.user);
            setUser(mappedUser);
            setAccessToken(refreshed.access_token);
            tokenRef.current = refreshed.access_token;
            localStorage.setItem(TOKEN_KEY, refreshed.access_token);
            localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
          } catch {
            console.warn("Session refresh failed, clearing session");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        } else {
          console.warn("Session restore failed:", err);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const applyAuthAndNavigate = (authData: AuthData) => {
    const mappedUser = mapBackendUser(authData.user);
    setUser(mappedUser);
    setAccessToken(authData.access_token);
    tokenRef.current = authData.access_token;
    localStorage.setItem(TOKEN_KEY, authData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    router.push(`/dashboard/${mappedUser.role}`);
  };

  const login = async (email: string, password: string) => {
    applyAuthAndNavigate(await api.auth.login(email, password));
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    role: string,
  ) => {
    applyAuthAndNavigate(await api.auth.register(email, password, fullName, role));
  };

  const logout = () => {
    const token = accessToken;
    setUser(null);
    setAccessToken(null);
    tokenRef.current = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    router.push("/login");

    if (token) {
      api.auth
        .logout(token)
        .catch((err) => console.warn("Server logout failed:", err));
    }
  };

  const withAuth = async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    const token = tokenRef.current;
    if (!token) {
      router.replace("/login");
      throw new Error("Not authenticated");
    }

    try {
      return await fn(token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        try {
          const newToken = await doRefresh();
          return await fn(newToken);
        } catch {
          logout();
          throw new ApiError(401, "Сессия истекла. Войдите снова.");
        }
      }
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{ user, accessToken, isLoading, login, register, logout, withAuth }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

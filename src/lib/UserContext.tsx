"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
      } catch (err) {
        console.warn("Session restore failed:", err);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const applyAuth = (authData: AuthData) => {
    const mappedUser = mapBackendUser(authData.user);
    setUser(mappedUser);
    setAccessToken(authData.access_token);
    localStorage.setItem(TOKEN_KEY, authData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    router.push(`/dashboard/${mappedUser.role}`);
  };

  const login = async (email: string, password: string) => {
    applyAuth(await api.auth.login(email, password));
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    role: string,
  ) => {
    applyAuth(await api.auth.register(email, password, fullName, role));
  };

  const logout = () => {
    const token = accessToken;
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    router.push("/login");

    if (token) {
      api.auth
        .logout(token)
        .catch((err) => console.warn("Server logout failed:", err));
    }
  };

  return (
    <UserContext.Provider
      value={{ user, accessToken, isLoading, login, register, logout }}
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

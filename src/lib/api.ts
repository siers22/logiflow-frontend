const API_BASE = "/api";

export interface ApiResponse<T = unknown> {
  status: number;
  success: boolean;
  requestID: string;
  data: Record<string, T> | null;
}

export interface BackendUser {
  ID: string;
  Email: string;
  Slug: string;
  PasswordHash: string;
  FullName: string;
  AvatarURL: string;
  Role: string;
  CreatedAt: string;
  UpdatedAt: string;
  LastLoginAt: string | null;
}

export interface AuthData {
  access_token: string;
  expires_in: number;
  user: BackendUser;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = accessToken;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // для refresh_token cookie
    headers,
  });

  // logout возвращает 200 с пустым телом
  if (res.status === 200 && res.headers.get("content-length") === "0") {
    return { status: 200, success: true, requestID: "", data: null };
  }

  let data: ApiResponse<T>;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(res.status, "Ошибка при разборе ответа сервера");
  }

  if (!data.success) {
    const errData = data.data as Record<string, unknown> | null;
    const message = (errData?.["error"] as string) ?? "Неизвестная ошибка";
    throw new ApiError(data.status, message);
  }

  return data;
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthData> => {
      const res = await request<AuthData>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return (res.data as Record<string, AuthData>)["auth"];
    },

    register: async (
      email: string,
      password: string,
      fullName: string,
      role: string,
    ): Promise<AuthData> => {
      const res = await request<AuthData>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName, role }),
      });
      return (res.data as Record<string, AuthData>)["auth"];
    },

    logout: async (accessToken: string): Promise<void> => {
      await request("/auth/logout", { method: "POST" }, accessToken);
    },

    refresh: async (accessToken: string): Promise<AuthData> => {
      const res = await request<AuthData>(
        "/auth/refresh",
        { method: "POST" },
        accessToken,
      );
      return (res.data as Record<string, AuthData>)["auth"];
    },
  },

  me: {
    get: async (accessToken: string): Promise<BackendUser> => {
      const res = await request<BackendUser>(
        "/me",
        { method: "GET" },
        accessToken,
      );
      return (res.data as Record<string, BackendUser>)["ok"];
    },
  },
};

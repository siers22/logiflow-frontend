"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/lib/ThemeContext";
import { useUser } from "@/lib/UserContext";
import { ApiError } from "@/lib/api";

type Mode = "login" | "register";

const loginSchema = z.object({
  email: z.string().min(1, "Введите email"),
  password: z.string().min(1, "Введите пароль"),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Имя должно содержать минимум 2 символа").max(100),
    email: z.string().email("Введите корректный email"),
    password: z
      .string()
      .min(8, "Пароль должен содержать минимум 8 символов")
      .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
      .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Пароли не совпадают",
    path: ["confirm"],
  });

type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;

export function LoginForm() {
  const { theme, toggleTheme } = useTheme();
  const { login, register } = useUser();
  const [mode, setMode] = useState<Mode>("login");
  const [serverError, setServerError] = useState<string | null>(null);

  const loginForm = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirm: "" },
  });

  const activeForm = mode === "login" ? loginForm : registerForm;
  const isLoading = activeForm.formState.isSubmitting;

  const switchMode = (next: Mode) => {
    setMode(next);
    setServerError(null);
    loginForm.reset();
    registerForm.reset();
  };

  const onLoginSubmit = async (data: LoginFields) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : "Не удалось подключиться к серверу. Проверьте соединение.",
      );
    }
  };

  const onRegisterSubmit = async (data: RegisterFields) => {
    setServerError(null);
    try {
      await register(data.email, data.password, data.fullName.trim(), "client");
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : "Не удалось подключиться к серверу. Проверьте соединение.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Button
        variant="glass_outline"
        size="default"
        onClick={(e) => toggleTheme(e)}
        title={theme === "dark" ? "Светлая тема" : "Темная тема"}
        className="absolute top-4 right-4"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </Button>

      <div className="w-full max-w-md z-1">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-900 dark:text-gray-100 text-3xl font-medium">
              LogiFlow
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Система управления логистикой
          </p>
        </div>

        <Card variant="glass">
          {/* Вкладки */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-3 text-sm font-medium transition-colors
                  ${
                    mode === m
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
              >
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <CardHeader>
            <CardTitle>
              {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Введите ваш email и пароль"
                : "Регистрация доступна для клиентов. Водителей и менеджеров добавляет администратор."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {mode === "login" ? (
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="user@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    {...loginForm.register("email")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete="current-password"
                    {...loginForm.register("password")}
                  />
                </div>

                {serverError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {serverError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="reg-fullName">Полное имя</Label>
                  <Input
                    id="reg-fullName"
                    type="text"
                    placeholder="Иван Иванов"
                    disabled={isLoading}
                    autoComplete="name"
                    {...registerForm.register("fullName")}
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-xs text-red-500">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="user@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-red-500">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Пароль</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete="new-password"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-red-500">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Подтвердите пароль</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete="new-password"
                    {...registerForm.register("confirm")}
                  />
                  {registerForm.formState.errors.confirm && (
                    <p className="text-xs text-red-500">
                      {registerForm.formState.errors.confirm.message}
                    </p>
                  )}
                </div>

                {serverError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {serverError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

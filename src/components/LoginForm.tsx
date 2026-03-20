"use client";

import { useState } from "react";
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

export function LoginForm() {
  const { theme, toggleTheme } = useTheme();
  const { login, register } = useUser();

  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        // Публичная регистрация — только клиент.
        // Водителей и менеджеров создаёт администратор.
        await register(email, password, fullName.trim(), "client");
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Не удалось подключиться к серверу. Проверьте соединение.",
      );
    } finally {
      setIsLoading(false);
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Полное имя</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Иван Иванов"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="name"
                    minLength={2}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={8}
                />
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirm">Подтвердите пароль</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? mode === "login"
                    ? "Вход..."
                    : "Регистрация..."
                  : mode === "login"
                    ? "Войти"
                    : "Зарегистрироваться"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

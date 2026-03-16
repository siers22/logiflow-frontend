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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/lib/ThemeContext";
import { useUser } from "@/lib/UserContext";
import type { User } from "@/types";
import type { UserRole } from "@/types";

const mockUsers: Record<UserRole, User> = {
  client: {
    id: "1",
    name: "Иван Петров",
    email: "client@demo.com",
    role: "client",
  },
  manager: {
    id: "2",
    name: "Анна Смирнова",
    email: "manager@demo.com",
    role: "manager",
  },
  driver: {
    id: "3",
    name: "Сергей Водитель",
    email: "driver@demo.com",
    role: "driver",
  },
  management: {
    id: "4",
    name: "Михаил Директор",
    email: "management@demo.com",
    role: "management",
  },
  admin: {
    id: "5",
    name: "Админ Системы",
    email: "admin@demo.com",
    role: "admin",
  },
};

export function LoginForm() {
  const { theme, toggleTheme } = useTheme();
  const { login } = useUser();
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(mockUsers[selectedRole]);
  };

  const quickLogin = (role: UserRole) => login(mockUsers[role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Button
        variant="ghost"
        size="sm"
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

      <div className="w-full max-w-md">
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
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>Выберите роль для демонстрации</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as UserRole)}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Клиент</SelectItem>
                    <SelectItem value="manager">Менеджер</SelectItem>
                    <SelectItem value="driver">Водитель</SelectItem>
                    <SelectItem value="management">Руководство</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="user@demo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full">
                Войти
              </Button>
            </form>

            <div className="mt-6">
              <p className="text-sm text-gray-500 text-center mb-3">
                Быстрый вход
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(mockUsers) as UserRole[]).map((role) => (
                  <Button
                    key={role}
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin(role)}
                    className="text-xs"
                  >
                    {mockUsers[role].name.split(" ")[0]}
                    <span className="ml-1 text-gray-400">({role})</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

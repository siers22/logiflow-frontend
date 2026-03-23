"use client";

import { Package, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/ThemeContext";
import { useUser } from "@/lib/UserContext";
import { NotificationPanel } from "@/components/NotificationPanel";

const roleNames: Record<string, string> = {
  client: "Клиент",
  manager: "Менеджер",
  driver: "Водитель",
  management: "Руководство",
  admin: "Администратор",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  LogiFlow
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {roleNames[user.role]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="glass_outline"
                size="default"
                onClick={(e) => toggleTheme(e)}
                title={theme === "dark" ? "Светлая тема" : "Темная тема"}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              <NotificationPanel />
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.name}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button variant="glass_outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

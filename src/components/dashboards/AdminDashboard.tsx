"use client";

import { useState } from "react";
import {
  Users,
  Settings,
  Shield,
  Database,
  Truck,
  ClipboardCheck,
  User,
  Inbox,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, RoleBadge, StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/lib/UserContext";

const roleNames: Record<string, string> = {
  client: "Клиент",
  manager: "Менеджер",
  driver: "Водитель",
  management: "Руководство",
  admin: "Администратор",
};

/** Заглушка для разделов, где API ещё не реализован */
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        {description}
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useUser();

  // Настройки (локальное состояние формы)
  const [company, setCompany] = useState("LogiFlow");
  const [supportEmail, setSupportEmail] = useState("support@logiflow.com");
  const [currency, setCurrency] = useState("rub");

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-gray-900 dark:text-gray-100">
            Панель администратора
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Добро пожаловать, {user.name}
          </p>
        </div>

        {/* Профиль администратора */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <User className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {user.email}
                </div>
                {user.slug && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    @{user.slug}
                  </div>
                )}
              </div>
              <RoleBadge role={user.role} className="shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Статусные карточки */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Пользователи</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                —
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Users API в разработке
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Заказы</CardTitle>
              <Database className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                —
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Orders API в разработке
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Безопасность</CardTitle>
              <Shield className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-green-600">
                Все системы в норме
              </div>
              <p className="text-xs text-gray-500 mt-1">Сервер доступен</p>
            </CardContent>
          </Card>
        </div>

        {/* Вкладки */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger variant="glass" value="users">
              <Users className="w-4 h-4 mr-2" /> Пользователи
            </TabsTrigger>
            <TabsTrigger variant="glass" value="orders">
              <ClipboardCheck className="w-4 h-4 mr-2" /> Заказы
            </TabsTrigger>
            <TabsTrigger variant="glass" value="drivers">
              <Truck className="w-4 h-4 mr-2" /> Водители
            </TabsTrigger>
            <TabsTrigger variant="glass" value="settings">
              <Settings className="w-4 h-4 mr-2" /> Настройки
            </TabsTrigger>
          </TabsList>

          {/* ── Пользователи ── */}
          <TabsContent value="users">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Управление пользователями</CardTitle>
                <CardDescription>
                  Просмотр и управление аккаунтами
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Текущий авторизованный пользователь (единственные реальные данные) */}
                <div className="border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={user.role} />
                      <Badge variant="default">Активен</Badge>
                    </div>
                  </div>
                </div>

                <EmptyState
                  icon={<Users className="w-7 h-7" />}
                  title="Users API ещё не подключён"
                  description="."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Заказы ── */}
          <TabsContent value="orders">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Все заказы</CardTitle>
                <CardDescription>
                  Полный список заказов в системе
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={<ClipboardCheck className="w-7 h-7" />}
                  title="Orders API ещё не подключён"
                  description="."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Водители ── */}
          <TabsContent value="drivers">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Управление водителями</CardTitle>
                <CardDescription>Список водителей и их статусы</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={<Truck className="w-7 h-7" />}
                  title="Drivers API ещё не подключён"
                  description="."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Настройки ── */}
          <TabsContent value="settings">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Настройки системы
                </CardTitle>
                <CardDescription>Конфигурация приложения</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Название компании</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email поддержки</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rub">Российский рубль (₽)</SelectItem>
                      <SelectItem value="usd">Доллар США ($)</SelectItem>
                      <SelectItem value="eur">Евро (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Сохранить настройки</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

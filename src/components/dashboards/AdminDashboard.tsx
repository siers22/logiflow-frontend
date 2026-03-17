"use client";

import { useState } from "react";
import {
  Users,
  Settings,
  Shield,
  Database,
  UserPlus,
  Edit,
  Trash2,
  Activity,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { MicroservicesMonitor } from "@/components/MicroservicesMonitor";
import { mockOrders, mockDrivers } from "@/lib/mockData";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "blocked";
  createdAt: string;
}

const allUsers: AppUser[] = [
  {
    id: "1",
    name: "Иван Петров",
    email: "client@demo.com",
    role: "client",
    status: "active",
    createdAt: "2025-01-15",
  },
  {
    id: "2",
    name: "Анна Смирнова",
    email: "manager@demo.com",
    role: "manager",
    status: "active",
    createdAt: "2025-01-10",
  },
  {
    id: "3",
    name: "Сергей Водитель",
    email: "driver@demo.com",
    role: "driver",
    status: "active",
    createdAt: "2025-02-01",
  },
  {
    id: "4",
    name: "Михаил Директор",
    email: "management@demo.com",
    role: "management",
    status: "active",
    createdAt: "2025-01-05",
  },
  {
    id: "5",
    name: "Админ Системы",
    email: "admin@demo.com",
    role: "admin",
    status: "active",
    createdAt: "2025-01-01",
  },
  {
    id: "6",
    name: 'ООО "Торговый дом"',
    email: "trade@demo.com",
    role: "client",
    status: "active",
    createdAt: "2025-03-10",
  },
  {
    id: "7",
    name: "ИП Сидоров",
    email: "sidorov@demo.com",
    role: "client",
    status: "active",
    createdAt: "2025-04-15",
  },
];

const roleNames: Record<string, string> = {
  client: "Клиент",
  manager: "Менеджер",
  driver: "Водитель",
  management: "Руководство",
  admin: "Администратор",
};

export function AdminDashboard() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-gray-900 dark:text-gray-100">
            Панель администратора
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление системой и пользователями
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Пользователей</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {allUsers.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {allUsers.filter((u) => u.status === "active").length} активных
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Заказов</CardTitle>
              <Database className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {mockOrders.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">В системе</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Водителей</CardTitle>
              <Users className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {mockDrivers.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {mockDrivers.filter((d) => d.status !== "offline").length}{" "}
                онлайн
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
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger variant="glass" value="users">
              Пользователи
            </TabsTrigger>
            <TabsTrigger variant="glass" value="orders">
              Заказы
            </TabsTrigger>
            <TabsTrigger variant="glass" value="drivers">
              Водители
            </TabsTrigger>
            <TabsTrigger variant="glass" value="microservices">
              <Activity className="w-4 h-4 mr-2" />
              Микросервисы
            </TabsTrigger>
            <TabsTrigger variant="glass" value="settings">
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* ── Users ── */}
          <TabsContent value="users" className="space-y-4">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Управление пользователями</CardTitle>
                    <CardDescription>
                      Список всех пользователей системы
                    </CardDescription>
                  </div>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Добавить пользователя
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Новый пользователь</DialogTitle>
                        <DialogDescription>
                          Создайте нового пользователя системы
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Имя</Label>
                          <Input id="name" placeholder="Иван Иванов" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Роль</Label>
                          <Select>
                            <SelectTrigger id="role">
                              <SelectValue placeholder="Выберите роль" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client">Клиент</SelectItem>
                              <SelectItem value="manager">Менеджер</SelectItem>
                              <SelectItem value="driver">Водитель</SelectItem>
                              <SelectItem value="management">
                                Руководство
                              </SelectItem>
                              <SelectItem value="admin">
                                Администратор
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setIsAddUserOpen(false)}
                          >
                            Отмена
                          </Button>
                          <Button onClick={() => setIsAddUserOpen(false)}>
                            Создать
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">
                          Пользователь
                        </th>
                        <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">
                          Роль
                        </th>
                        <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">
                          Статус
                        </th>
                        <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">
                          Создан
                        </th>
                        <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                            {u.name}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {u.email}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{roleNames[u.role]}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                u.status === "active"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {u.status === "active"
                                ? "Активен"
                                : "Заблокирован"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Orders ── */}
          <TabsContent value="orders">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Все заказы</CardTitle>
                <CardDescription>
                  Полный список заказов в системе
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {order.id}
                            </span>
                            <Badge>{order.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.clientName}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {order.price.toLocaleString("ru-RU")} ₽
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString(
                              "ru-RU",
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {order.cargoType} • {order.weight} кг
                      </p>
                      {order.driverName && (
                        <p className="text-xs text-gray-500">
                          Водитель: {order.driverName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Drivers ── */}
          <TabsContent value="drivers">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Управление водителями</CardTitle>
                <CardDescription>
                  Список всех водителей и их статусы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDrivers.map((driver) => (
                    <div key={driver.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {driver.name}
                            </span>
                            <Badge
                              variant={
                                driver.status === "available"
                                  ? "default"
                                  : driver.status === "busy"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {driver.status === "available"
                                ? "Доступен"
                                : driver.status === "busy"
                                  ? "Занят"
                                  : "Не в сети"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {driver.vehicleType} • {driver.vehicleNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            📍 {driver.currentLocation}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            ⭐ {driver.rating}
                          </div>
                          <p className="text-xs text-gray-500">
                            {driver.completedOrders} заказов
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {driver.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Microservices ── */}
          <TabsContent value="microservices">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Мониторинг микросервисов
                </CardTitle>
                <CardDescription>
                  Состояние всех микросервисов системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MicroservicesMonitor />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Settings ── */}
          <TabsContent value="settings">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Настройки системы
                </CardTitle>
                <CardDescription>Конфигурация приложения</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company">Название компании</Label>
                  <Input id="company" defaultValue="LogiFlow" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email поддержки</Label>
                  <Input
                    id="support-email"
                    type="email"
                    defaultValue="support@logiflow.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <Select defaultValue="rub">
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

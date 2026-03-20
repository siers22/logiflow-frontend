"use client";

import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Download,
  Calendar,
  User,
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
import { RoleBadge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/lib/UserContext";
import { mockOrders, mockDrivers } from "@/lib/mockData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const monthlyData = [
  { month: "Июл", revenue: 450000, orders: 18 },
  { month: "Авг", revenue: 520000, orders: 22 },
  { month: "Сен", revenue: 480000, orders: 20 },
  { month: "Окт", revenue: 620000, orders: 25 },
  { month: "Ноя", revenue: 580000, orders: 23 },
];

export function ManagementDashboard() {
  const { user } = useUser();
  const [period, setPeriod] = useState("month");

  if (!user) return null;

  const totalRevenue = mockOrders.reduce((s, o) => s + o.price, 0);
  const completedOrders = mockOrders.filter(
    (o) => o.status === "delivered",
  ).length;
  const activeOrders = mockOrders.filter(
    (o) => o.status === "in_progress" || o.status === "assigned",
  ).length;

  const statusData = [
    { name: "Доставлено", value: completedOrders, color: "#10b981" },
    { name: "В пути", value: activeOrders, color: "#3b82f6" },
    {
      name: "Ожидает",
      value: mockOrders.filter((o) => o.status === "pending").length,
      color: "#f59e0b",
    },
  ];

  const topDrivers = [...mockDrivers]
    .sort((a, b) => b.completedOrders - a.completedOrders)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">
              Панель руководства
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Добро пожаловать, {user.name}
            </p>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" /> Экспорт отчёта
          </Button>
        </div>

        {/* Профиль */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <User className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <RoleBadge role={user.role} className="ml-auto" />
            </div>
          </CardContent>
        </Card>

        {/* KPI */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Выручка</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalRevenue.toLocaleString("ru-RU")} ₽
              </div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +12% за месяц
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Всего заказов</CardTitle>
              <Package className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {mockOrders.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">За текущий период</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Выполнено</CardTitle>
              <Package className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {completedOrders}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((completedOrders / mockOrders.length) * 100).toFixed(0)}% от
                всех
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Водителей</CardTitle>
              <Users className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {mockDrivers.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {mockDrivers.filter((d) => d.status === "available").length}{" "}
                доступно
              </p>
            </CardContent>
          </Card>
        </div>

        {/* График */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Выручка и заказы</CardTitle>
                <CardDescription>Динамика за последние месяцы</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Неделя</SelectItem>
                    <SelectItem value="month">Месяц</SelectItem>
                    <SelectItem value="quarter">Квартал</SelectItem>
                    <SelectItem value="year">Год</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Выручка (₽)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Заказы"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Диаграмма статусов */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Статус заказов</CardTitle>
              <CardDescription>Распределение по статусам</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Топ водителей */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Топ водителей</CardTitle>
              <CardDescription>
                По количеству выполненных заказов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDrivers.map((driver, i) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-800 dark:text-blue-200">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {driver.name}
                        </div>
                        <p className="text-xs text-gray-500">
                          {driver.vehicleType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {driver.completedOrders} заказов
                      </div>
                      <p className="text-xs text-gray-500">
                        ⭐ {driver.rating}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

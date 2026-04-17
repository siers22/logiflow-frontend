"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
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
import { api, type Order, type Driver } from "@/lib/api";
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

type Period = "week" | "month" | "quarter" | "year";

function getPeriodRange(period: Period): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (period === "week") from.setDate(to.getDate() - 7);
  else if (period === "month") from.setMonth(to.getMonth() - 1);
  else if (period === "quarter") from.setMonth(to.getMonth() - 3);
  else from.setFullYear(to.getFullYear() - 1);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function buildChartData(orders: Order[]) {
  const byDate: Record<string, { revenue: number; orders: number }> = {};
  orders.forEach((o) => {
    const day = o.createdAt.split("T")[0];
    if (!byDate[day]) byDate[day] = { revenue: 0, orders: 0 };
    byDate[day].orders += 1;
    byDate[day].revenue += o.totalPrice ?? 0;
  });
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([date, v]) => ({
      month: new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      ...v,
    }));
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function ManagementDashboard() {
  const { user, withAuth } = useUser();
  const [period, setPeriod] = useState<Period>("month");
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);
    const range = getPeriodRange(period);
    Promise.all([
      withAuth((token) => api.orders.list(token)),
      withAuth((token) => api.drivers.list(token)),
    ])
      .then(([ordersRes, driversRes]) => {
        // фильтруем заявки по выбранному периоду на клиенте
        const filtered = ordersRes.filter(
          (o) => o.createdAt >= range.from && o.createdAt <= range.to + "T23:59:59",
        );
        setOrders(filtered);
        setDrivers(driversRes);
      })
      .catch((err: Error) => toast.error(err.message ?? "Не удалось загрузить данные"))
      .finally(() => setIsLoading(false));
  }, [withAuth, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice ?? 0), 0);
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const activeOrders = orders.filter(
    (o) => o.status === "in_transit" || o.status === "assigned",
  ).length;
  const availableDrivers = drivers.filter((d) => d.status === "available").length;

  const statusData = [
    { name: "Доставлено", value: completedOrders, color: "#10b981" },
    { name: "В пути", value: activeOrders, color: "#3b82f6" },
    {
      name: "Ожидает",
      value: orders.filter((o) => o.status === "pending").length,
      color: "#f59e0b",
    },
    {
      name: "Отменено",
      value: orders.filter((o) => o.status === "cancelled").length,
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0);

  const chartData = buildChartData(orders);

  // топ водителей по числу доставленных заявок в этом периоде
  const driverOrderCount: Record<string, number> = {};
  orders.forEach((o) => {
    if (o.status === "delivered" && o.driverId) {
      driverOrderCount[o.driverId] = (driverOrderCount[o.driverId] ?? 0) + 1;
    }
  });
  const topDrivers = drivers
    .filter((d) => driverOrderCount[d.id])
    .sort((a, b) => (driverOrderCount[b.id] ?? 0) - (driverOrderCount[a.id] ?? 0))
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
                {isLoading ? "—" : totalRevenue.toLocaleString("ru-RU") + " ₽"}
              </div>
              {!isLoading && totalRevenue > 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> За выбранный период
                </p>
              )}
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Всего заказов</CardTitle>
              <Package className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? "—" : orders.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">За выбранный период</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Выполнено</CardTitle>
              <Package className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? "—" : completedOrders}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {!isLoading && orders.length > 0
                  ? `${((completedOrders / orders.length) * 100).toFixed(0)}% от всех`
                  : "За период"}
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
                {isLoading ? "—" : drivers.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {!isLoading ? `${availableDrivers} доступно` : ""}
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
                <CardDescription>Динамика за период</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
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
            {isLoading ? (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                Загрузка...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                Нет данных за выбранный период
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
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
            )}
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
              {isLoading ? (
                <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
                  Загрузка...
                </div>
              ) : statusData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
                  Нет данных
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>

          {/* Топ водителей */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Топ водителей</CardTitle>
              <CardDescription>По доставленным заказам за период</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-gray-400 text-sm text-center py-4">Загрузка...</p>
              ) : topDrivers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Нет данных за период
                </p>
              ) : (
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
                            #{shortId(driver.id)}
                          </div>
                          <p className="text-xs text-gray-500">
                            {driver.licenseNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {driverOrderCount[driver.id]} заказов
                        </div>
                        <p className="text-xs text-gray-500">
                          ⭐ {driver.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

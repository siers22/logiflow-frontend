"use client";

import { useState } from "react";
import { MapPin, Package, MessageSquare, Settings, User } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/lib/UserContext";
import {
  mockOrders,
  mockDrivers,
  mockMessages,
  type DriverStatus,
} from "@/lib/mockData";

const statusColors: Record<DriverStatus, string> = {
  available:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  busy: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  offline: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};
const statusLabels: Record<DriverStatus, string> = {
  available: "Доступен",
  busy: "Занят",
  offline: "Не в сети",
};

export function DriverDashboard() {
  const { user } = useUser();

  // Шаблон данных водителя — будет заменён на GET /me/driver после подключения Driver API
  const driverTemplate = mockDrivers[0];
  const [driverStatus, setDriverStatus] = useState<DriverStatus>(
    driverTemplate.status,
  );
  const [newMessage, setNewMessage] = useState("");

  // Показываем заказы с назначенным водителем как пример активных рейсов
  const activeOrders = mockOrders.filter(
    (o) => o.status === "in_progress" && o.driverId,
  );
  const completedOrders = mockOrders.filter((o) => o.status === "delivered");
  const activeOrder = activeOrders[0];

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">
              Панель водителя
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Добро пожаловать, {user.name}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${statusColors[driverStatus]}`}
          >
            {statusLabels[driverStatus]}
          </div>
        </div>

        {/* Профиль */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
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

        {/* Статистика */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Рейтинг</CardTitle>
              <span className="text-yellow-500">⭐</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {driverTemplate.rating}
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Завершено</CardTitle>
              <Package className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {driverTemplate.completedOrders}
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Транспорт</CardTitle>
              <Settings className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {driverTemplate.vehicleType}
              </div>
              <p className="text-xs text-gray-500">
                {driverTemplate.vehicleNumber}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Локация</CardTitle>
              <MapPin className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {driverTemplate.currentLocation}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Статус */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Изменить статус</CardTitle>
            <CardDescription>
              Установите свой статус доступности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label>Статус:</Label>
              <Select
                value={driverStatus}
                onValueChange={(v) => setDriverStatus(v as DriverStatus)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="busy">Занят</SelectItem>
                  <SelectItem value="offline">Не в сети</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Текущий рейс */}
        {activeOrder && (
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Текущий рейс</CardTitle>
              <CardDescription>Активная перевозка</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {activeOrder.id}
                      </span>
                      <StatusBadge status="in_progress" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activeOrder.cargoType} • {activeOrder.weight} кг
                    </p>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {activeOrder.price.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Забрать:</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activeOrder.pickupAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Доставить:</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activeOrder.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t flex gap-2">
                  <Button className="flex-1">Обновить локацию</Button>
                  <Button variant="glass_outline" className="flex-1">
                    Завершить доставку
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Сообщения */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Сообщения
              </CardTitle>
              <CardDescription>Связь с менеджером</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg text-sm ${
                        msg.senderId === driverTemplate.id
                          ? "bg-blue-100 dark:bg-blue-900 ml-8"
                          : "bg-gray-100 dark:bg-gray-800 mr-8"
                      }`}
                    >
                      <p className="font-medium text-xs text-gray-500 mb-1">
                        {msg.senderName}
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {msg.text}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Написать сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                  />
                  <Button>Отправить</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* История */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>История поездок</CardTitle>
              <CardDescription>Завершённые перевозки</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[380px] overflow-y-auto">
                {completedOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {order.id}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.cargoType}
                        </p>
                      </div>
                      <StatusBadge status="delivered" />
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.updatedAt).toLocaleDateString("ru-RU")}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {order.price.toLocaleString("ru-RU")} ₽
                    </p>
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

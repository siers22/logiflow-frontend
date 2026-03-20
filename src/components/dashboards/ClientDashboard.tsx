"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, MapPin, Clock, CheckCircle, User } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/lib/UserContext";
import { mockOrders } from "@/lib/mockData";

export function ClientDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  // Реальная фильтрация появится после подключения Orders API
  const orders = mockOrders;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Мои заказы</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Добро пожаловать, {user.name}
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="glass_outline">
                <Plus className="w-4 h-4 mr-2" /> Новая заявка
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Новая заявка на перевозку</DialogTitle>
                <DialogDescription>
                  Заполните форму для создания заявки
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Адрес отправления</Label>
                    <Input placeholder="Москва, ул. Ленинская, 15" />
                  </div>
                  <div className="space-y-2">
                    <Label>Адрес доставки</Label>
                    <Input placeholder="Санкт-Петербург, пр. Невский, 28" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Тип груза</Label>
                    <Input placeholder="Электроника" />
                  </div>
                  <div className="space-y-2">
                    <Label>Вес (кг)</Label>
                    <Input type="number" placeholder="150" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Примечания</Label>
                  <Textarea
                    placeholder="Дополнительная информация о грузе"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>
                    Создать заявку
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Профиль */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Всего заказов</CardTitle>
              <Package className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {orders.length}
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>В пути</CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {orders.filter((o) => o.status === "in_progress").length}
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Доставлено</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {orders.filter((o) => o.status === "delivered").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Список заказов */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Активные заявки</CardTitle>
            <CardDescription>
              Отслеживайте статус ваших перевозок
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((order) => {
                return (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {order.id}
                          </span>
                          <StatusBadge status={order.status} />
                          {order.status === "in_progress" && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:underline">
                              Отследить →
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.cargoType} • {order.weight} кг
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
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{order.pickupAddress}</p>
                        <p className="text-gray-400">→</p>
                        <p>{order.deliveryAddress}</p>
                      </div>
                    </div>
                    {order.driverName && (
                      <div className="pt-3 border-t mt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Водитель: {order.driverName}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

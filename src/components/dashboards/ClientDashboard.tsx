"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, MapPin, Clock, CheckCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/lib/UserContext";
import { mockOrders } from "@/lib/mockData";

function getStatusBadge(status: string) {
  const variants: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "outline" | "destructive";
    }
  > = {
    pending: { label: "Ожидает", variant: "secondary" },
    assigned: { label: "Назначен водитель", variant: "default" },
    in_progress: { label: "В пути", variant: "default" },
    delivered: { label: "Доставлен", variant: "outline" },
    cancelled: { label: "Отменен", variant: "destructive" },
  };
  return variants[status] ?? variants.pending;
}

export function ClientDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [orders] = useState(mockOrders.filter((o) => o.clientId === user?.id));

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Мои заказы</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление и отслеживание заявок на перевозку
            </p>
          </div>
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Новая заявка
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
                    <Label htmlFor="pickup">Адрес отправления</Label>
                    <Input
                      id="pickup"
                      placeholder="Москва, ул. Ленинская, 15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery">Адрес доставки</Label>
                    <Input
                      id="delivery"
                      placeholder="Санкт-Петербург, пр. Невский, 28"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Тип груза</Label>
                    <Input id="cargo" placeholder="Электроника" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Вес (кг)</Label>
                    <Input id="weight" type="number" placeholder="150" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Примечания</Label>
                  <Textarea
                    id="notes"
                    placeholder="Дополнительная информация о грузе"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsNewOrderOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button onClick={() => setIsNewOrderOpen(false)}>
                    Создать заявку
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                const badge = getStatusBadge(order.status);
                return (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {order.id}
                          </span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
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
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{order.pickupAddress}</p>
                        <p className="text-gray-400">→</p>
                        <p>{order.deliveryAddress}</p>
                      </div>
                    </div>
                    {order.driverName && (
                      <div className="pt-3 border-t">
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

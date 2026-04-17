"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Clock, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";
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
import { api, type Order, type OrderCreate } from "@/lib/api";

function orderShortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function ClientDashboard() {
  const { user, withAuth } = useUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Partial<OrderCreate>>({});

  const loadOrders = useCallback(() => {
    setIsLoading(true);
    withAuth((token) => api.orders.list(token))
      .then(setOrders)
      .catch((err: Error) => toast.error(err.message ?? "Не удалось загрузить заявки"))
      .finally(() => setIsLoading(false));
  }, [withAuth]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCreate = async () => {
    if (!form.destinationAddress) return;
    setIsCreating(true);
    try {
      const created = await withAuth((token) =>
        api.orders.create(token, {
          destinationAddress: form.destinationAddress!,
          originAddress: form.originAddress ?? null,
          cargoDescription: form.cargoDescription ?? null,
          weightKg: form.weightKg ?? null,
          volumeM3: form.volumeM3 ?? null,
        }),
      );
      setOrders((prev) => [created, ...prev]);
      setIsOpen(false);
      setForm({});
      toast.success("Заявка создана");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось создать заявку");
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return null;

  const inTransitCount = orders.filter(
    (o) => o.status === "in_transit" || o.status === "assigned",
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

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
                    <Input
                      placeholder="Москва, ул. Ленинская, 15"
                      value={form.originAddress ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, originAddress: e.target.value || null }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Адрес доставки *</Label>
                    <Input
                      placeholder="Санкт-Петербург, пр. Невский, 28"
                      value={form.destinationAddress ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, destinationAddress: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Вес (кг)</Label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={form.weightKg ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          weightKg: e.target.value ? parseFloat(e.target.value) : null,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Объём (м³)</Label>
                    <Input
                      type="number"
                      placeholder="1.5"
                      value={form.volumeM3 ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          volumeM3: e.target.value ? parseFloat(e.target.value) : null,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Описание груза</Label>
                  <Textarea
                    placeholder="Электроника, хрупкое"
                    rows={3}
                    value={form.cargoDescription ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cargoDescription: e.target.value || null }))
                    }
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Отмена
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !form.destinationAddress}
                  >
                    {isCreating ? "Создание..." : "Создать заявку"}
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
                {isLoading ? "—" : orders.length}
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
                {isLoading ? "—" : inTransitCount}
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
                {isLoading ? "—" : deliveredCount}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Загрузка...
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
                  <Package className="w-7 h-7" />
                </div>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Нет заявок
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Создайте первую заявку — нажмите «Новая заявка»
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const statusAccent =
                    order.status === "in_transit"
                      ? "border-l-amber-400"
                      : order.status === "delivered"
                        ? "border-l-green-400"
                        : order.status === "cancelled"
                          ? "border-l-red-400"
                          : order.status === "assigned"
                            ? "border-l-orange-400"
                            : "border-l-blue-400";

                  return (
                    <div
                      key={order.id}
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className={`rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] border-l-[3px] ${statusAccent} hover:bg-white/70 dark:hover:bg-white/[0.07] hover:shadow-md transition-all cursor-pointer group`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              #{orderShortId(order.id)}
                            </span>
                            <StatusBadge status={order.status} />
                            {order.status === "in_transit" && (
                              <span className="text-xs text-blue-500 dark:text-blue-400 group-hover:underline">
                                Отследить →
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {order.cargoDescription ?? "Без описания"}
                            {order.weightKg ? ` • ${order.weightKg} кг` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          {order.totalPrice != null && (
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {order.totalPrice.toLocaleString("ru-RU")} ₽
                            </div>
                          )}
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-[3px] mt-1 shrink-0">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                        <div className="space-y-1.5">
                          <p>{order.originAddress ?? "Со склада"}</p>
                          <p>{order.destinationAddress}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

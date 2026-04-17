"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Package, Truck, AlertCircle, User } from "lucide-react";
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
import { Badge, RoleBadge, StatusBadge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/UserContext";
import { api, type Driver, type Order } from "@/lib/api";

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function ManagerDashboard() {
  const { user, withAuth } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = useCallback(() => {
    setIsLoading(true);
    Promise.all([
      withAuth((token) => api.orders.list(token)),
      withAuth((token) => api.drivers.list(token)),
    ])
      .then(([ordersRes, driversRes]) => {
        setOrders(ordersRes);
        setDrivers(driversRes);
      })
      .catch((err: Error) => toast.error(err.message ?? "Не удалось загрузить данные"))
      .finally(() => setIsLoading(false));
  }, [withAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter(
    (o) => o.status === "assigned" || o.status === "in_transit",
  );
  const availableDrivers = drivers.filter((d) => d.status === "available");

  const handleAssign = async () => {
    if (!selectedOrder || !selectedDriverId) return;
    setIsAssigning(true);
    try {
      const updated = await withAuth((token) =>
        api.orders.updateStatus(token, selectedOrder.id, {
          status: "assigned",
          driverId: selectedDriverId,
        }),
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? updated ?? { ...o, status: "assigned", driverId: selectedDriverId } : o)),
      );
      setDrivers((prev) =>
        prev.map((d) => (d.id === selectedDriverId ? { ...d, status: "on_route" } : d)),
      );
      toast.success("Водитель назначен");
      setIsAssignOpen(false);
      setSelectedOrder(null);
      setSelectedDriverId("");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось назначить водителя");
    } finally {
      setIsAssigning(false);
    }
  };

  const openAssign = (order: Order) => {
    setSelectedOrder(order);
    setIsAssignOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-gray-900 dark:text-gray-100">Панель менеджера</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Добро пожаловать, {user.name}
          </p>
        </div>

        {/* Профиль */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
          {[
            {
              label: "Новые заявки",
              value: pendingOrders.length,
              icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
            },
            {
              label: "В работе",
              value: activeOrders.length,
              icon: <Package className="w-4 h-4 text-blue-600" />,
            },
            {
              label: "Свободно водителей",
              value: availableDrivers.length,
              icon: <Users className="w-4 h-4 text-green-600" />,
            },
            {
              label: "Всего водителей",
              value: drivers.length,
              icon: <Truck className="w-4 h-4 text-gray-600" />,
            },
          ].map((stat) => (
            <Card key={stat.label} variant="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{stat.label}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isLoading ? "—" : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Новые заявки */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Новые заявки</CardTitle>
              <CardDescription>Требуют назначения водителя</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-gray-400 text-center py-4 text-sm">Загрузка...</p>
                ) : pendingOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Нет новых заявок
                  </p>
                ) : (
                  pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div
                            className="font-medium text-gray-900 dark:text-gray-100 mb-1 cursor-pointer hover:underline"
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                          >
                            #{shortId(order.id)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <StatusBadge status="pending" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {order.cargoDescription ?? "Без описания"}
                        {order.weightKg ? ` • ${order.weightKg} кг` : ""}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {(order.originAddress ?? "Со склада")} → {order.destinationAddress}
                      </p>
                      {availableDrivers.length === 0 ? (
                        <p className="text-xs text-center text-gray-400 py-1">
                          Нет свободных водителей
                        </p>
                      ) : (
                        <Button
                          onClick={() => openAssign(order)}
                          className="w-full"
                          variant="glass_outline_easy"
                        >
                          Назначить водителя
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Свободные водители */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Свободные водители</CardTitle>
              <CardDescription>Доступны для назначения</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-gray-400 text-center py-4 text-sm">Загрузка...</p>
                ) : availableDrivers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Нет свободных водителей
                  </p>
                ) : (
                  availableDrivers.map((driver) => (
                    <div key={driver.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            ID: {shortId(driver.id)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {driver.licenseNumber}
                          </p>
                        </div>
                        <Badge>Доступен</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          {driver.vehicleId ? "ТС привязано" : "Без ТС"}
                        </span>
                        <span>⭐ {driver.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Активные перевозки */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Активные перевозки</CardTitle>
            <CardDescription>Заявки в процессе выполнения</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-gray-400 text-center py-4 text-sm">Загрузка...</p>
              ) : activeOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Нет активных перевозок</p>
              ) : (
                activeOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-white/70 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            #{shortId(order.id)}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      {order.totalPrice != null && (
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {order.totalPrice.toLocaleString("ru-RU")} ₽
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {order.cargoDescription ?? "Без описания"}
                      {order.weightKg ? ` • ${order.weightKg} кг` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(order.originAddress ?? "Со склада")} → {order.destinationAddress}
                    </p>
                    {order.driverId && (
                      <div className="pt-2 border-t mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Водитель: #{shortId(order.driverId)}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Диалог назначения */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить водителя</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Заявка #${shortId(selectedOrder.id)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {selectedOrder.cargoDescription ?? "Без описания"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedOrder.weightKg != null && `${selectedOrder.weightKg} кг`}
                  {selectedOrder.volumeM3 != null && ` • ${selectedOrder.volumeM3} м³`}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {(selectedOrder.originAddress ?? "Со склада")} → {selectedOrder.destinationAddress}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Водитель</Label>
              <Select
                value={selectedDriverId}
                onValueChange={setSelectedDriverId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите водителя" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.licenseNumber} — ⭐ {d.rating.toFixed(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="glass_outline_easy"
                onClick={() => setIsAssignOpen(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleAssign} disabled={!selectedDriverId || isAssigning}>
                {isAssigning ? "Назначение..." : "Назначить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

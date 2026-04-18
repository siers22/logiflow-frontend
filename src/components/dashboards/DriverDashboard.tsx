"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Package, Settings, User, IdCard, Car } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/UserContext";
import { api, type Driver, type DriverStatus, type Order, type Route, type Vehicle } from "@/lib/api";
import { RouteMap } from "@/components/RouteMap";

const statusColors: Record<DriverStatus, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  on_route: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  off_duty: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};
const statusLabels: Record<DriverStatus, string> = {
  available: "Доступен",
  on_route: "В пути",
  off_duty: "Не на смене",
};

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function DriverDashboard() {
  const { user, withAuth } = useUser();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>("off_duty");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const loadVehicle = useCallback((vehicleId: string) => {
    withAuth((token) => api.vehicles.list(token))
      .then((list) => {
        const found = list.find((v) => v.id === vehicleId);
        if (found) setVehicle(found);
      })
      .catch(() => {});
  }, [withAuth]);

  useEffect(() => {
    if (!user?.id) return;
    withAuth((token) => api.drivers.get(token, user.slug ?? user.id))
      .then((d) => {
        setDriver(d);
        setDriverStatus(d.status);
        if (d.vehicleId) loadVehicle(d.vehicleId);
      })
      .catch(() =>
        withAuth((token) => api.drivers.list(token))
          .then((list) => {
            const mine = list.find((d) => d.userId === user.id);
            if (mine) {
              setDriver(mine);
              setDriverStatus(mine.status);
              if (mine.vehicleId) loadVehicle(mine.vehicleId);
            }
          })
          .catch(() => {}),
      );
  }, [user?.id, user?.slug, withAuth]);

  const loadOrders = useCallback(() => {
    if (!driver) return;
    setIsLoadingOrders(true);
    withAuth((token) => api.orders.list(token, { driverId: driver.id }))
      .then(setOrders)
      .catch(() => {})
      .finally(() => setIsLoadingOrders(false));
  }, [driver, withAuth]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const activeOrder = orders.find(
    (o) => o.status === "in_transit" || o.status === "assigned",
  );

  // Загружаем маршрут и подключаем WebSocket для активного заказа
  useEffect(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setRoute(null);
    setCurrentIndex(0);

    if (!activeOrder) return;

    withAuth((token) => api.routes.get(token, activeOrder.id))
      .then((r) => {
        setRoute(r);
        setCurrentIndex(r.currentIndex);
      })
      .catch(() => {});

    let ws: WebSocket | null = null;
    withAuth(async (token) => {
      ws = api.routes.connectWs(activeOrder.id, token, (pos) => {
        setCurrentIndex(pos.currentIndex);
      });
      wsRef.current = ws;
    }).catch(() => {});

    return () => {
      ws?.close();
      wsRef.current = null;
    };
  }, [activeOrder?.id, activeOrder?.status, withAuth]);

  const handleStatusChange = async (newStatus: DriverStatus) => {
    const prev = driverStatus;
    setDriverStatus(newStatus);
    try {
      await withAuth((token) => api.drivers.updateMyStatus(token, newStatus));
      if (driver) setDriver({ ...driver, status: newStatus });
      toast.success(`Статус изменён: ${statusLabels[newStatus]}`);
    } catch (err: unknown) {
      setDriverStatus(prev);
      toast.error((err as Error).message ?? "Не удалось изменить статус");
    }
  };

  const handleCompleteDelivery = async (order: Order) => {
    try {
      const updated = await withAuth((token) =>
        api.orders.updateStatus(token, order.id, { status: "delivered" }),
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updated ?? { ...o, status: "delivered" } : o)),
      );
      // Автоматически переводим водителя в "доступен"
      await withAuth((token) => api.drivers.updateMyStatus(token, "available")).catch(() => {});
      setDriverStatus("available");
      if (driver) setDriver({ ...driver, status: "available" });
      toast.success("Доставка завершена");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось завершить доставку");
    }
  };

  const handleStartDelivery = async (order: Order) => {
    try {
      const updated = await withAuth((token) =>
        api.orders.updateStatus(token, order.id, { status: "in_transit" }),
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updated ?? { ...o, status: "in_transit" } : o)),
      );
      // Автоматически переводим водителя в "в пути"
      await withAuth((token) => api.drivers.updateMyStatus(token, "on_route")).catch(() => {});
      setDriverStatus("on_route");
      if (driver) setDriver({ ...driver, status: "on_route" });
      toast.success("Доставка начата");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось обновить статус");
    }
  };

  if (!user) return null;

  const completedOrders = orders.filter((o) => o.status === "delivered");

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
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${statusColors[driverStatus]}`}>
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
        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Рейтинг</CardTitle>
              <span className="text-yellow-500">⭐</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {driver ? driver.rating.toFixed(1) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Удостоверение</CardTitle>
              <IdCard className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {driver ? driver.licenseNumber : "—"}
              </div>
              {driver && (
                <p className="text-xs text-gray-500">до {driver.licenseExpiry}</p>
              )}
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Транспорт</CardTitle>
              <Car className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              {vehicle ? (
                <>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {vehicle.plateNumber}
                  </div>
                  {(vehicle.brand || vehicle.model) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                      {vehicle.year ? ` (${vehicle.year})` : ""}
                    </div>
                  )}
                  {(vehicle.capacityKg || vehicle.capacityM3) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {vehicle.capacityKg ? `${vehicle.capacityKg} кг` : ""}
                      {vehicle.capacityKg && vehicle.capacityM3 ? " • " : ""}
                      {vehicle.capacityM3 ? `${vehicle.capacityM3} м³` : ""}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {driver ? (driver.vehicleId ? "Загрузка..." : "Нет ТС") : "—"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Статус */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Изменить статус
            </CardTitle>
            <CardDescription>
              Установите свой статус доступности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label>Статус:</Label>
              <Select
                value={driverStatus}
                onValueChange={(v) => handleStatusChange(v as DriverStatus)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="on_route">В пути</SelectItem>
                  <SelectItem value="off_duty">Не на смене</SelectItem>
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
                        #{shortId(activeOrder.id)}
                      </span>
                      <StatusBadge status={activeOrder.status} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activeOrder.cargoDescription ?? "Без описания"}
                      {activeOrder.weightKg ? ` • ${activeOrder.weightKg} кг` : ""}
                    </p>
                  </div>
                  {activeOrder.totalPrice != null && (
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {activeOrder.totalPrice.toLocaleString("ru-RU")} ₽
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Забрать:</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activeOrder.originAddress ?? "Со склада"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Доставить:</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activeOrder.destinationAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {route && route.coordinates.length >= 2 ? (
                  <div>
                    <RouteMap coordinates={route.coordinates} currentIndex={currentIndex} />
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>📏 {route.distanceKm.toFixed(1)} км</span>
                      <span>⏱ {Math.round(route.durationSec / 60)} мин</span>
                      {activeOrder.status === "in_transit" && (
                        <span className="text-blue-500 dark:text-blue-400 animate-pulse">● Live</span>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="pt-4 border-t flex gap-2">
                  {activeOrder.status === "assigned" && (
                    <Button
                      className="flex-1"
                      variant="glass_outline_easy"
                      onClick={() => handleStartDelivery(activeOrder)}
                    >
                      Начать доставку
                    </Button>
                  )}
                  {activeOrder.status === "in_transit" && (
                    <Button
                      className="flex-1"
                      onClick={() => handleCompleteDelivery(activeOrder)}
                    >
                      Завершить доставку
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* История */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> История поездок
            </CardTitle>
            <CardDescription>Завершённые перевозки</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[380px] overflow-y-auto">
              {isLoadingOrders ? (
                <p className="text-gray-400 text-center py-4 text-sm">Загрузка...</p>
              ) : completedOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Нет завершённых поездок</p>
              ) : (
                completedOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          #{shortId(order.id)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.cargoDescription ?? "Без описания"}
                        </p>
                      </div>
                      <StatusBadge status="delivered" />
                    </div>
                    {order.deliveredAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(order.deliveredAt).toLocaleDateString("ru-RU")}
                      </p>
                    )}
                    {order.totalPrice != null && (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {order.totalPrice.toLocaleString("ru-RU")} ₽
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

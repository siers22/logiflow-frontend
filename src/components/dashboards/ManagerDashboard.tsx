"use client";

import { useState } from "react";
import { Users, Package, Truck, AlertCircle, User } from "lucide-react";
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
import { mockOrders, mockDrivers, type Order } from "@/lib/mockData";

export function ManagerDashboard() {
  const { user } = useUser();
  const [orders, setOrders] = useState(mockOrders);
  const [drivers] = useState(mockDrivers);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  if (!user) return null;

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter(
    (o) => o.status === "assigned" || o.status === "in_progress",
  );
  const availableDrivers = drivers.filter((d) => d.status === "available");

  const handleAssign = () => {
    if (!selectedOrder || !selectedDriverId) return;
    const driver = drivers.find((d) => d.id === selectedDriverId);
    if (!driver) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: "assigned" as const,
              driverId: driver.id,
              driverName: driver.name,
            }
          : o,
      ),
    );
    setIsAssignOpen(false);
    setSelectedOrder(null);
    setSelectedDriverId("");
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
                  {stat.value}
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
                {pendingOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Нет новых заявок
                  </p>
                ) : (
                  pendingOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {order.id}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.clientName}
                          </p>
                        </div>
                        <StatusBadge status="pending" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {order.cargoType} • {order.weight} кг
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {order.pickupAddress} → {order.deliveryAddress}
                      </p>
                      <Button
                        onClick={() => openAssign(order)}
                        className="w-full"
                        variant="glass_outline_easy"
                      >
                        Назначить водителя
                      </Button>
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
                {availableDrivers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Нет свободных водителей
                  </p>
                ) : (
                  availableDrivers.map((driver) => (
                    <div key={driver.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {driver.name}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {driver.vehicleType} • {driver.vehicleNumber}
                          </p>
                        </div>
                        <Badge>Доступен</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>📍 {driver.currentLocation}</span>
                        <span>⭐ {driver.rating}</span>
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
              {activeOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {order.id}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.clientName}
                      </p>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {order.price.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {order.cargoType} • {order.weight} кг
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.pickupAddress} → {order.deliveryAddress}
                  </p>
                  {order.driverName && (
                    <div className="pt-2 border-t mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Водитель: {order.driverName}
                      </p>
                    </div>
                  )}
                </div>
              ))}
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
              Выберите водителя для заявки {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {selectedOrder.cargoType}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedOrder.weight} кг • {selectedOrder.distance} км
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedOrder.pickupAddress} →{" "}
                  {selectedOrder.deliveryAddress}
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
                      {d.name} — {d.vehicleType} ({d.currentLocation})
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
              <Button onClick={handleAssign} disabled={!selectedDriverId}>
                Назначить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

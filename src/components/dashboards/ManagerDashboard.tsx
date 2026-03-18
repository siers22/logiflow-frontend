"use client";

import { useState } from "react";
import { Users, Package, Truck, AlertCircle } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { mockOrders, mockDrivers, type Order } from "@/lib/mockData";

export function ManagerDashboard() {
  const [orders, setOrders] = useState(mockOrders);
  const [drivers] = useState(mockDrivers);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter(
    (o) => o.status === "assigned" || o.status === "in_progress",
  );
  const availableDrivers = drivers.filter((d) => d.status === "available");

  const handleAssignDriver = () => {
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
    setIsAssignDialogOpen(false);
    setSelectedOrder(null);
    setSelectedDriverId("");
  };

  const openAssignDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsAssignDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-gray-900 dark:text-gray-100">Панель менеджера</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление заявками и назначение водителей
          </p>
        </div>

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
                        <Badge variant="secondary">Новая</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {order.cargoType} • {order.weight} кг
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {order.pickupAddress} → {order.deliveryAddress}
                      </p>
                      <Button
                        onClick={() => openAssignDialog(order)}
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
                        <Badge
                          variant={
                            order.status === "in_progress"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {order.status === "in_progress"
                            ? "В пути"
                            : "Назначен"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.clientName}
                      </p>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {order.price.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {order.cargoType} • {order.weight} кг
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {order.pickupAddress} → {order.deliveryAddress}
                  </p>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Водитель: {order.driverName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
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
              <Label htmlFor="driver">Водитель</Label>
              <Select
                value={selectedDriverId}
                onValueChange={setSelectedDriverId}
              >
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Выберите водителя" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} — {driver.vehicleType} (
                      {driver.currentLocation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="glass_outline_easy"
                onClick={() => setIsAssignDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleAssignDriver} disabled={!selectedDriverId}>
                Назначить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

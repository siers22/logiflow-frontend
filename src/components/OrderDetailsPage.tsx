"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/lib/UserContext";
import { api, ApiError, type Order, type Route } from "@/lib/api";
import { RouteMap } from "@/components/RouteMap";

function getDeliveryProgress(status: Order["status"]): number {
  const map: Record<Order["status"], number> = {
    pending: 0,
    assigned: 25,
    in_transit: 65,
    delivered: 100,
    cancelled: 0,
  };
  return map[status] ?? 0;
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

interface OrderDetailsPageProps {
  orderId: string;
}

export function OrderDetailsPage({ orderId }: OrderDetailsPageProps) {
  const router = useRouter();
  const { withAuth, user } = useUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setIsLoading(true);
    withAuth((token) => api.orders.get(token, orderId))
      .then((o) => setOrder(o))
      .catch((err: unknown) => {
        if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
          setNotFound(true);
        } else {
          toast.error((err as Error).message ?? "Не удалось загрузить заявку");
          setNotFound(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, [orderId, withAuth]);

  // Загружаем маршрут и подключаемся к WebSocket когда заявка активна
  useEffect(() => {
    if (!order || (order.status !== "in_transit" && order.status !== "assigned")) return;

    withAuth((token) => api.routes.get(token, orderId))
      .then((r) => {
        setRoute(r);
        setCurrentIndex(r.currentIndex);
      })
      .catch(() => {}); // маршрут может ещё не существовать

    let ws: WebSocket | null = null;
    withAuth(async (token) => {
      ws = api.routes.connectWs(orderId, token, (pos) => {
        setCurrentIndex(pos.currentIndex);
      });
      wsRef.current = ws;
    }).catch(() => {});

    return () => {
      ws?.close();
      wsRef.current = null;
    };
  }, [order?.status, orderId, withAuth]);

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await withAuth((token) => api.orders.cancel(token, order.id));
      setOrder({ ...order, status: "cancelled" });
      setIsCancelOpen(false);
      toast.success("Заявка отменена");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось отменить заявку");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-gray-400 text-sm">Загрузка...</div>
      </DashboardLayout>
    );
  }

  if (notFound || !order) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-gray-500">Заказ не найден</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Назад
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const progress = getDeliveryProgress(order.status);
  const canCancel = order.status === "pending" && user?.role !== "driver";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="glass_outline" size="default" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-gray-900 dark:text-gray-100">
                Заявка #{shortId(order.id)}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Детали и статус перевозки
            </p>
          </div>
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setIsCancelOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Отменить
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Маршрут */}
          <Card className="lg:col-span-2" variant="glass">
            <CardHeader>
              <CardTitle>Маршрут</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-[4px] mt-1 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="w-px h-10 bg-gray-300 dark:bg-gray-600" />
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Откуда</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {order.originAddress ?? "Со склада"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Куда</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {order.destinationAddress}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Прогресс доставки
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {route && route.coordinates.length >= 2 ? (
                  <div className="pt-2">
                    <RouteMap coordinates={route.coordinates} currentIndex={currentIndex} />
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>📏 {route.distanceKm.toFixed(1)} км</span>
                      <span>⏱ {Math.round(route.durationSec / 60)} мин</span>
                      {order.status === "in_transit" && (
                        <span className="text-blue-500 dark:text-blue-400 animate-pulse">● Live</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 pt-2">
                    {order.status === "in_transit" || order.status === "assigned"
                      ? "Маршрут загружается..."
                      : "Карта маршрута будет доступна после назначения водителя"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Сайдбар */}
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Детали</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Груз</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                      {order.cargoDescription ?? "Без описания"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                      {order.weightKg != null && <span>{order.weightKg} кг</span>}
                      {order.volumeM3 != null && <span>{order.volumeM3} м³</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Создана</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(order.createdAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                </div>

                {order.assignedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Назначена
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(order.assignedAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  </div>
                )}

                {order.deliveredAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Доставлена
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(order.deliveredAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  </div>
                )}

                {order.totalPrice != null && (
                  <div className="pt-4 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Стоимость
                    </span>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {order.totalPrice.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {order.driverId && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Водитель</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ID: {shortId(order.driverId)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Полная карточка водителя появится после расширения API
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(order.originAddress || order.destinationAddress) && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Адреса</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-900 dark:text-gray-100 break-words">
                      {order.originAddress ?? "Со склада"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <span className="text-gray-900 dark:text-gray-100 break-words">
                      {order.destinationAddress}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отменить заявку?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Заявка будет помечена как отменённая.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="glass_outline_easy" onClick={() => setIsCancelOpen(false)}>
              Назад
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? "Отмена..." : "Отменить заявку"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

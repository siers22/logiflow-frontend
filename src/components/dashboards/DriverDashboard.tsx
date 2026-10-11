'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Package,
  Settings,
  User,
  IdCard,
  Car,
  Star,
  Ruler,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RoleBadge, StatusBadge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { useUser } from '@/lib/UserContext';
import {
  api,
  type Assignment,
  type DriverStatus,
  type Order,
  type Route,
  type Vehicle,
} from '@/lib/api';
import { RouteMap } from '@/components/RouteMap';
import { RoleFeatureCard } from '@/components/new/RoleFeatureCard';

const statusColors: Record<DriverStatus, string> = {
  available:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  on_route: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  off_duty: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};
const statusLabels: Record<DriverStatus, string> = {
  available: 'Доступен',
  on_route: 'В пути',
  off_duty: 'Не на смене',
};

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function DriverDashboard() {
  const { user, withAuth } = useUser();
  const workspace = useWorkspace();
  const driver = workspace.driver;
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('off_duty');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadVehicle = useCallback(
    (vehicleId: string) => {
      withAuth((token) => api.vehicles.list(token))
        .then((list) => {
          const found = list.find((v) => v.id === vehicleId);
          if (found) setVehicle(found);
        })
        .catch(() => {});
    },
    [withAuth],
  );

  useEffect(() => {
    if (driver) setDriverStatus(driver.status);
  }, [driver]);

  const loadOrders = useCallback(() => {
    if (!driver) return;
    setIsLoadingOrders(true);
    Promise.all([
      withAuth((token) => api.orders.list(token)),
      withAuth((token) => api.assignments.list(token)),
    ])
      .then(([nextOrders, nextAssignments]) => {
        setOrders(nextOrders);
        setAssignments(nextAssignments);
      })
      .catch(() => {})
      .finally(() => setIsLoadingOrders(false));
  }, [driver, withAuth]);

  useEffect(() => {
    loadOrders();
    const tick = () => {
      if (!document.hidden) loadOrders();
    };
    const timer = window.setInterval(tick, 15000);
    return () => window.clearInterval(timer);
  }, [loadOrders]);

  const activeOrder = orders.find(
    (o) =>
      assignments.some(
        (a) =>
          a.orderId === o.id &&
          a.driverId === driver?.id &&
          ['accepted', 'active'].includes(a.status),
      ) && ['assigned', 'in_transit', 'arrived'].includes(o.status),
  );
  const activeAssignment = assignments.find(
    (a) =>
      a.orderId === activeOrder?.id &&
      (a.status === 'accepted' || a.status === 'active'),
  );
  useEffect(() => {
    if (activeAssignment?.vehicleId) loadVehicle(activeAssignment.vehicleId);
    else if (driver?.vehicleId) loadVehicle(driver.vehicleId);
    else setVehicle(null);
  }, [activeAssignment?.vehicleId, driver?.vehicleId, loadVehicle]);
  const pendingAssignments = assignments.filter(
    (a) => a.status === 'pending_acceptance',
  );

  const activeOrderId = activeOrder?.id,
    activeOrderStatus = activeOrder?.status;
  // Poll through the authenticated REST route while the order is in transit.
  useEffect(() => {
    setRoute(null);
    setCurrentIndex(0);

    if (!activeOrderId) return;

    let busy = false,
      live = true;
    const refreshRoute = () => {
      if (busy || document.hidden) return;
      busy = true;
      withAuth((token) => api.routes.get(token, activeOrderId))
        .then((r) => {
          if (live) {
            setRoute(r);
            setCurrentIndex(r.currentIndex);
          }
        })
        .catch(() => {})
        .finally(() => {
          busy = false;
        });
    };
    refreshRoute();
    const timer =
      activeOrderStatus === 'in_transit'
        ? window.setInterval(refreshRoute, 10000)
        : null;
    return () => {
      live = false;
      if (timer) window.clearInterval(timer);
    };
  }, [activeOrderId, activeOrderStatus, withAuth]);

  const handleStatusChange = async (newStatus: DriverStatus) => {
    const prev = driverStatus;
    setDriverStatus(newStatus);
    try {
      await withAuth((token) => api.drivers.updateMyStatus(token, newStatus));
      workspace.reload();
      toast.success(`Статус изменён: ${statusLabels[newStatus]}`);
    } catch (err: unknown) {
      setDriverStatus(prev);
      toast.error((err as Error).message ?? 'Не удалось изменить статус');
    }
  };

  if (!user) return null;

  const completedOrders = orders.filter(
    (o) =>
      o.status === 'completed' ||
      assignments.some(
        (a) =>
          a.orderId === o.id &&
          a.startedAt &&
          ['released', 'completed'].includes(a.status),
      ),
  );

  return (
    <DashboardLayout>
      <div className="role-dashboard driver-dashboard space-y-6">
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
        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Рейтинг</CardTitle>
              <Star className="w-4 h-4 text-violet-500" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {driver ? driver.rating.toFixed(1) : '—'}
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
                {driver ? driver.licenseNumber : '—'}
              </div>
              {driver && (
                <p className="text-xs text-gray-500">
                  до{' '}
                  {new Date(driver.licenseExpiry).toLocaleDateString('ru-RU')}
                </p>
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
                      {[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}
                      {vehicle.year ? ` (${vehicle.year})` : ''}
                    </div>
                  )}
                  {(vehicle.capacityKg || vehicle.capacityM3) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {vehicle.capacityKg ? `${vehicle.capacityKg} кг` : ''}
                      {vehicle.capacityKg && vehicle.capacityM3 ? ' • ' : ''}
                      {vehicle.capacityM3 ? `${vehicle.capacityM3} м³` : ''}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {driver ? (driver.vehicleId ? 'Загрузка...' : 'Нет ТС') : '—'}
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

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Предложения рейсов</CardTitle>
            <CardDescription>
              Подтвердите назначение до истечения срока
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">Новых предложений нет</p>
            ) : (
              pendingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div className="text-sm">
                    Заказ #{shortId(assignment.orderId)}
                    <div className="text-xs text-gray-500">
                      До{' '}
                      {new Date(assignment.offerExpiresAt).toLocaleString(
                        'ru-RU',
                      )}
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/dashboard/orders/${assignment.orderId}`}>
                      Открыть предложение
                    </Link>
                  </Button>
                </div>
              ))
            )}
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
                      {activeOrder.cargoDescription ?? 'Без описания'}
                      {activeOrder.weightKg
                        ? ` • ${activeOrder.weightKg} кг`
                        : ''}
                    </p>
                  </div>
                  {activeOrder.totalPrice != null && (
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {activeOrder.totalPrice.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Забрать:</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activeOrder.originAddress ?? 'Со склада'}
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
                    <RouteMap
                      coordinates={route.coordinates}
                      currentIndex={currentIndex}
                    />
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="w-3 h-3" aria-hidden="true" />
                        {route.distanceKm?.toFixed(1) ?? '—'} км
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Timer className="w-3 h-3" aria-hidden="true" />
                        {route.durationSec == null
                          ? '—'
                          : Math.round(route.durationSec / 60)}{' '}
                        мин
                      </span>
                      {activeOrder.status === 'in_transit' && (
                        <span className="text-blue-500 dark:text-blue-400 animate-pulse">
                          Данные маршрута
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="pt-4 border-t flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/dashboard/orders/${activeOrder.id}`}>
                      Открыть рейс и действия
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <RoleFeatureCard
          className="role-feature"
          eyebrow="МОЙ ТРАНСПОРТ"
          title={
            vehicle
              ? [vehicle.brand, vehicle.model].filter(Boolean).join(' ') ||
                'Транспорт назначен'
              : 'Ожидание транспорта'
          }
          description={
            vehicle
              ? `${vehicle.plateNumber} · ${vehicle.capacityKg ?? '—'} кг`
              : 'После назначения автомобиля его данные появятся здесь.'
          }
        />

        {/* История */}
        <Card variant="glass" className="driver-history">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> История поездок
            </CardTitle>
            <CardDescription>Завершённые перевозки</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[380px] overflow-y-auto">
              {isLoadingOrders ? (
                <p className="text-gray-400 text-center py-4 text-sm">
                  Загрузка...
                </p>
              ) : completedOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Нет завершённых поездок
                </p>
              ) : (
                completedOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          #{shortId(order.id)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.cargoDescription ?? 'Без описания'}
                        </p>
                      </div>
                      <StatusBadge status="completed" />
                    </div>
                    {order.deliveredAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(order.deliveredAt).toLocaleDateString(
                          'ru-RU',
                        )}
                      </p>
                    )}
                    {order.totalPrice != null && (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {order.totalPrice.toLocaleString('ru-RU')} ₽
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

'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, type WarehouseQueueItem, type WarehouseStage } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { errorMessage } from '@/lib/api-errors';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
const stages: Record<WarehouseStage, string> = {
  awaiting_receipt: 'Ожидает приёма',
  awaiting_assignment: 'Ожидает назначения',
  awaiting_loading: 'Ожидает погрузки',
  ready_to_depart: 'Готов к выезду',
  departed: 'Отправлен',
  expected: 'Ожидается прибытие',
  awaiting_unloading: 'Ожидает разгрузки',
  received: 'Груз принят',
  awaiting_return: 'Ожидает возврата отправителю',
  returned_to_sender: 'Выдан отправителю',
  incident_open: 'Открыта проблема',
  completed: 'Завершён',
  cancelled: 'Отменён',
};
export function WarehouseQueuePage({ warehouseId }: { warehouseId: string }) {
  const { withAuth } = useUser();
  const [orders, setOrders] = useState<WarehouseQueueItem[]>([]),
    [offset, setOffset] = useState(0),
    [includeClosed, setIncludeClosed] = useState(false),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true,
      running = false;
    const load = async () => {
      if (running || document.hidden) return;
      running = true;
      setLoading(true);
      try {
        const values = await withAuth((token) =>
          api.warehouses.queue(token, warehouseId, {
            limit: 20,
            offset,
            includeClosed,
          }),
        );
        if (live) {
          setOrders(values);
          setError('');
        }
      } catch (err) {
        if (live) setError(errorMessage(err));
      } finally {
        running = false;
        if (live) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 15000);
    document.addEventListener('visibilitychange', load);
    window.addEventListener('logiflow:changed', load);
    return () => {
      live = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
      window.removeEventListener('logiflow:changed', load);
    };
  }, [warehouseId, offset, includeClosed, revision, withAuth]);
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between gap-3">
          <h1>Очередь склада</h1>
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Обновить
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Склад {warehouseId}</p>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeClosed}
            onChange={(e) => {
              setIncludeClosed(e.target.checked);
              setOffset(0);
            }}
          />{' '}
          Включить закрытые заказы
        </label>
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
        {loading && <p>Обновление очереди…</p>}
        {!loading && !error && !orders.length && <p>Очередь пуста.</p>}
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="space-y-3 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  className="font-medium underline"
                  href={`/dashboard/orders/${order.id}`}
                >
                  Заказ #{order.id.slice(0, 8).toUpperCase()}
                </Link>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm">
                {order.originWarehouseId === warehouseId
                  ? 'Исходящий'
                  : 'Входящий'}{' '}
                ·{' '}
                <span className="rounded bg-muted px-2 py-1">
                  {stages[order.warehouseStage] ?? order.warehouseStage}
                </span>
                {order.openIncidentCount > 0 && (
                  <span className="ml-2 text-amber-700">
                    Проблем: {order.openIncidentCount}
                  </span>
                )}
              </p>
              <p className="text-sm">
                {order.originAddress} → {order.destinationAddress}
              </p>
              <p className="text-xs text-muted-foreground">
                Окно забора:{' '}
                {order.pickupFrom
                  ? new Date(order.pickupFrom).toLocaleString('ru-RU')
                  : '—'}{' '}
                —{' '}
                {order.pickupTo
                  ? new Date(order.pickupTo).toLocaleString('ru-RU')
                  : '—'}
              </p>
              <Button asChild variant="outline">
                <Link href={`/dashboard/orders/${order.id}#warehouse`}>
                  Операции и журнал
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            disabled={loading || !offset}
            onClick={() => setOffset((v) => Math.max(0, v - 20))}
          >
            Назад
          </Button>
          <span className="text-sm">Страница {offset / 20 + 1}</span>
          <Button
            variant="outline"
            disabled={
              loading || !!error || orders.length < 20 || offset >= 10000
            }
            onClick={() => setOffset((v) => v + 20)}
          >
            Далее
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

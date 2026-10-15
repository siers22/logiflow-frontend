'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { useOrderWorkspace } from '@/lib/useOrderWorkspace';
import { orderActions, submitBlockers } from '@/lib/order-actions';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RouteMap } from '@/components/RouteMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { OrderDraftForm } from '@/components/orders/OrderDraftForm';
import { TransportDetailsForm } from '@/components/orders/TransportDetailsForm';
import { WarehouseOperationsPanel } from '@/components/orders/WarehouseOperationsPanel';
import { DeliveryReceiptPanel } from '@/components/orders/DeliveryReceiptPanel';
import { TripHandoversPanel } from '@/components/orders/TripHandoversPanel';
import { OrderDocumentsPanel } from '@/components/orders/OrderDocumentsPanel';
import { AssignmentHistory } from '@/components/orders/AssignmentHistory';
import { OrderReferencesProvider, ReferenceLabel } from '@/components/orders/OrderReferences';
import { AssignmentPanel } from '@/components/orders/AssignmentPanel';
import { OrderIncidentsPanel } from '@/components/orders/OrderIncidentsPanel';
const noAssignments: import('@/lib/api').Assignment[] = [];
export function OrderDetailsPage({ orderId }: { orderId: string }) {
  const [, setClock] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setClock((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const router = useRouter(),
    { user } = useUser(),
    profile = useWorkspace();
  const state = useOrderWorkspace(orderId),
    {
      order,
      errors,
      route,
      assignments,
      operations,
      incidents,
      receipt,
      command,
      busy,
    } = state;
  const [cancelOpen, setCancelOpen] = useState(false),
    [cancelComment, setCancelComment] = useState('');
  const [editOpen, setEditOpen] = useState(false),
    [transportOpen, setTransportOpen] = useState(false);
  const retry = (section: string) =>
    errors[section] && (
      <p role="alert" className="text-sm text-red-600">
        {errors[section]}{' '}
        <Button variant="outline" size="sm" onClick={() => state.refresh()}>
          Повторить
        </Button>
      </p>
    );
  if (!order)
    return (
      <DashboardLayout>
        <div className="space-y-4 py-12">
          <h1>
            {state.loading ? 'Загрузка заказа…' : 'Не удалось загрузить заказ'}
          </h1>
          {retry('order')}
          <Button variant="outline" onClick={() => router.back()}>
            Назад
          </Button>
        </div>
      </DashboardLayout>
    );
  const actor = {
    id: user?.id ?? '',
    role: user?.role ?? '',
    warehouseId: profile.manager?.warehouseId,
    driverId: profile.driver?.id,
  };
  const assignment =
    assignments?.find((a) =>
      ['pending_acceptance', 'accepted', 'active'].includes(a.status),
    ) ?? null;
  const unavailable =
    profile.loading ||
    !!profile.error ||
    !!errors.order ||
    !!errors.assignments;
  const actions = orderActions({
    order,
    actor,
    assignment,
    operations: unavailable ? null : operations,
    incidents: unavailable ? null : incidents,
    receipt: unavailable ? undefined : receipt,
  });
  const blockers = submitBlockers(order, route);
  return (
    <OrderReferencesProvider labels={state.references} operations={operations}>
    <DashboardLayout>
      <div className="space-y-6">
        {retry('references')}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Назад
          </Button>
          <h1 className="flex-1">
            Заказ #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <StatusBadge status={order.status} />
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => state.refresh()}
          >
            Обновить
          </Button>
          {actions.cancel && (
            <Button
              disabled={busy}
              variant="destructive"
              onClick={() => setCancelOpen(true)}
            >
              Отменить заказ
            </Button>
          )}
        </div>
        {retry('order')}
        {retry('assignments')}
        {profile.error && (
          <p role="alert">
            {profile.error}{' '}
            <Button variant="outline" onClick={profile.reload}>
              Повторить загрузку профиля
            </Button>
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {actions.edit && (
            <>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setEditOpen((v) => !v)}
              >
                Изменить черновик
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setTransportOpen((v) => !v);
                  document
                    .getElementById('transport')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Реквизиты перевозки
              </Button>
              <Button
                disabled={busy || unavailable || !!blockers.length}
                onClick={() =>
                  command(
                    (token) => api.orders.submit(token, order.id),
                    'Заказ отправлен на распределение',
                  )
                }
              >
                Отправить на распределение
              </Button>
            </>
          )}
          {actions.start && assignment && (
            <Button
              disabled={busy}
              onClick={() =>
                command(
                  (token) => api.assignments.start(token, assignment.id),
                  'Перевозка начата',
                )
              }
            >
              Начать перевозку
            </Button>
          )}
          {actions.arrive && assignment && (
            <Button
              disabled={busy}
              onClick={() =>
                command(
                  (token) => api.assignments.arrive(token, assignment.id),
                  'Прибытие отмечено',
                )
              }
            >
              Отметить прибытие
            </Button>
          )}
          {actions.complete && assignment && (
            <Button
              disabled={busy}
              onClick={() =>
                command(
                  (token) => api.assignments.complete(token, assignment.id),
                  'Перевозка завершена. Документы появятся после обработки.',
                )
              }
            >
              Завершить перевозку
            </Button>
          )}
        </div>
        {actions.edit && blockers.length > 0 && (
          <div className="rounded-lg border border-amber-300 p-4 text-sm">
            <p className="font-medium">До отправки заказа:</p>
            <ul className="list-disc pl-5">
              {blockers.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            {!order.transportDetails && order.transportPolicyVersion === 1 && (
              <Button variant="link" onClick={() => setTransportOpen(true)}>
                Заполнить реквизиты
              </Button>
            )}
          </div>
        )}
        {order.status === 'assigned' &&
          order.originWarehouseId &&
          !actions.loaded &&
          assignment?.status === 'accepted' && (
            <p className="rounded-lg border p-3 text-sm">
              Для выезда ожидается подтверждение погрузки складом отправления.
            </p>
          )}
        {incidents?.some((i) => i.status === 'open') && (
          <a
            href="#incidents"
            className="block rounded-lg border border-amber-400 p-3 text-sm"
          >
            Есть открытые проблемы перевозки. Для погрузки, старта и завершения
            требуется решение ответственного.
          </a>
        )}
        {editOpen && actions.edit && (
          <Card>
            <CardHeader>
              <CardTitle>Черновик</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderDraftForm
                key={order.id}
                order={order}
                onSaved={() => {
                  setEditOpen(false);
                  state.refresh();
                }}
              />
            </CardContent>
          </Card>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Маршрут</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <span className="text-muted-foreground">Откуда:</span>{' '}
                {order.originAddress || 'Склад отправления'}
              </p>
              <p>
                <span className="text-muted-foreground">Куда:</span>{' '}
                {order.destinationAddress}
              </p>
              {route && (
                <>
                  <p className="text-sm">
                    Расстояние: {route.distanceKm?.toFixed(1) ?? '—'} км ·
                    Время:{' '}
                    {route.durationSec == null
                      ? '—'
                      : Math.round(route.durationSec / 60)}{' '}
                    мин
                  </p>
                  {route.coordinates.length > 0 && (
                    <RouteMap
                      coordinates={route.coordinates}
                      currentIndex={route.currentIndex}
                    />
                  )}
                </>
              )}
              {retry('route')}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Груз и окно забора</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{order.cargoDescription || 'Описание не указано'}</p>
              <p>
                {order.weightKg ?? '—'} кг · {order.volumeM3 ?? '—'} м³
              </p>
              <p>
                {order.pickupFrom
                  ? new Date(order.pickupFrom).toLocaleString('ru-RU')
                  : '—'}{' '}
                —{' '}
                {order.pickupTo
                  ? new Date(order.pickupTo).toLocaleString('ru-RU')
                  : '—'}
              </p>
              <p className="text-lg font-medium">
                {order.totalPrice == null
                  ? 'Стоимость не рассчитана'
                  : `${order.totalPrice.toLocaleString('ru-RU')} ₽`}
              </p>
              <p className="text-xs text-muted-foreground">
                Процедура перевозки: {order.transportPolicyVersion}
              </p>
            </CardContent>
          </Card>
        </div>
        <section id="transport" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Реквизиты перевозки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.transportDetails ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {(['sender', 'recipient', 'carrier'] as const).map(
                      (key, i) => {
                        const party = order.transportDetails![key];
                        return (
                          <div
                            key={key}
                            className="rounded-lg border p-3 text-sm"
                          >
                            <p className="text-xs text-muted-foreground">
                              {['Отправитель', 'Получатель', 'Перевозчик'][i]}
                            </p>
                            <strong>{party.name}</strong>
                            <p>{party.address}</p>
                            <p>
                              {party.inn && `ИНН ${party.inn}`}
                              {party.kpp && ` · КПП ${party.kpp}`}
                            </p>
                            <p>
                              {party.contactName} · {party.phone || party.email}
                            </p>
                          </div>
                        );
                      },
                    )}
                  </div>
                  <p className="text-sm">
                    {order.transportDetails.basisType === 'contract'
                      ? 'Договор'
                      : 'Заявка'}{' '}
                    № {order.transportDetails.basisNumber} от{' '}
                    {order.transportDetails.basisDate} · Мест:{' '}
                    {order.transportDetails.packageCount}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {order.transportDetails.terms}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Снимок сохранён{' '}
                    {new Date(order.transportDetails.recordedAt).toLocaleString(
                      'ru-RU',
                    )}{' '}
                    · <ReferenceLabel kind="users" id={order.transportDetails.recordedByUserId} />
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Реквизиты ещё не сохранены.
                </p>
              )}
              {actions.edit && (transportOpen || !order.transportDetails) && (
                <TransportDetailsForm
                  key={order.id}
                  order={order}
                  onSaved={() => {
                    setTransportOpen(false);
                    state.refresh();
                  }}
                />
              )}
            </CardContent>
          </Card>
        </section>
        <section id="warehouse" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Складские операции</CardTitle>
            </CardHeader>
            <CardContent>
              {retry('operations')}
              {operations && (
                <WarehouseOperationsPanel
                  order={order}
                  operations={operations}
                  assignment={assignment}
                  actions={actions}
                  busy={busy}
                  command={command}
                />
              )}
            </CardContent>
          </Card>
        </section>
        <section id="incidents" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Проблемы перевозки</CardTitle>
            </CardHeader>
            <CardContent>
              {retry('incidents')}
              {incidents && (
                <OrderIncidentsPanel
                  order={order}
                  incidents={incidents}
                  assignment={assignment}
                  actor={actor}
                  canCreate={actions.reportIncident}
                  busy={busy}
                  command={command}
                />
              )}
            </CardContent>
          </Card>
        </section>
        <section id="receipt" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Фактическая приёмка</CardTitle>
            </CardHeader>
            <CardContent>
              {retry('receipt')}
              {receipt !== undefined && (
                <DeliveryReceiptPanel
                  order={order}
                  assignment={assignment}
                  receipt={receipt}
                  canCreate={actions.receipt}
                  busy={busy}
                  command={command}
                />
              )}
            </CardContent>
          </Card>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Управление назначением</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentPanel
              order={order}
              assignment={assignment}
              canAssign={actions.assign}
              canAccept={actions.accept}
              canReject={actions.reject}
              busy={busy}
              command={command}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'driver'
                ? 'Мои назначения'
                : 'История назначений'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user?.role === 'client' ? (
              <p className="text-sm">
                Полная история назначений доступна диспетчеру.
              </p>
            ) : (
              assignments && <AssignmentHistory assignments={assignments} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Передачи груза в пути</CardTitle>
          </CardHeader>
          <CardContent>
            <TripHandoversPanel
              order={order}
              assignments={assignments ?? noAssignments}
              actor={actor}
              canCreate={actions.handover}
              busy={busy}
              command={command}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Документы заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderDocumentsPanel orderId={order.id} />
          </CardContent>
        </Card>
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Отменить заказ?</DialogTitle>
              <DialogDescription>
                Принятый складом груз останется в очереди до выдачи отправителю.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              maxLength={2000}
              placeholder="Причина отмены"
              aria-label="Причина отмены"
              value={cancelComment}
              onChange={(e) => setCancelComment(e.target.value)}
            />
            <Button
              variant="destructive"
              disabled={busy || !actions.cancel}
              onClick={async () => {
                if (
                  await command(
                    (token) =>
                      api.orders.cancel(token, order.id, {
                        comment: cancelComment.trim(),
                      }),
                    'Заказ отменён',
                  )
                )
                  setCancelOpen(false);
              }}
            >
              Подтвердить отмену
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
    </OrderReferencesProvider>
  );
}

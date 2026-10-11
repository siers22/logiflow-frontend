'use client';
import { useEffect, useState } from 'react';
import {
  api,
  type Order,
  type Assignment,
  type Driver,
  type Vehicle,
  type TripHandover,
} from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import type { Actor } from '@/lib/order-actions';
import type { OrderCommand } from '@/lib/useOrderWorkspace';
import { errorMessage } from '@/lib/api-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, NativeSelect } from './Fields';
export function TripHandoversPanel({
  order,
  assignments,
  actor,
  canCreate,
  busy,
  command,
}: {
  order: Order;
  assignments: Assignment[];
  actor: Actor;
  canCreate: boolean;
  busy: boolean;
  command: OrderCommand;
}) {
  const { withAuth } = useUser();
  const [handovers, setHandovers] = useState<TripHandover[] | null>(null),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  const [drivers, setDrivers] = useState<Driver[]>([]),
    [vehicles, setVehicles] = useState<Vehicle[]>([]),
    [resourceError, setResourceError] = useState('');
  const [form, setForm] = useState({
    driverId: '',
    vehicleId: '',
    plannedTo: '',
    reason: '',
    location: '',
    cargoCondition: '',
  });
  useEffect(() => {
    let live = true;
    withAuth((token) => api.handovers.list(token, order.id))
      .then((value) => {
        if (live) {
          setHandovers(value);
          setError('');
        }
      })
      .catch((err) => {
        if (live) {
          setError(errorMessage(err));
          setHandovers(null);
        }
      });
    return () => {
      live = false;
    };
  }, [withAuth, order.id, order.status, assignments, revision]);
  useEffect(() => {
    if (!canCreate) return;
    let live = true;
    Promise.allSettled([
      withAuth((token) => api.drivers.list(token)),
      withAuth((token) => api.vehicles.list(token)),
    ]).then(([d, v]) => {
      if (!live) return;
      if (d.status === 'fulfilled') setDrivers(d.value);
      if (v.status === 'fulfilled') setVehicles(v.value);
      setResourceError(
        d.status === 'rejected'
          ? errorMessage(d.reason)
          : v.status === 'rejected'
            ? errorMessage(v.reason)
            : '',
      );
    });
    return () => {
      live = false;
    };
  }, [canCreate, withAuth]);
  const active = assignments.find((a) => a.status === 'active'),
    pending = handovers?.some(
      (h) => h.status === 'pending' && Date.parse(h.expiresAt) > Date.now(),
    );
  const run = async (
    execute: (token: string) => Promise<unknown>,
    message: string,
  ) => {
    const ok = await command(execute, message);
    setRevision((v) => v + 1);
    return ok;
  };
  return (
    <div className="space-y-4">
      {error && (
        <p role="alert">
          {error}{' '}
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Повторить
          </Button>
        </p>
      )}
      {actor.role === 'driver' && (
        <p className="text-sm text-muted-foreground">
          Входящие передачи пока доступны по ссылке на заказ от диспетчера:
          сервер не предоставляет отдельный список приглашений.
        </p>
      )}
      {canCreate && handovers && !pending && active && (
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (Date.parse(form.plannedTo) <= Date.now()) {
              setResourceError('Окончание рейса должно быть в будущем.');
              return;
            }
            if (
              form.driverId === active.driverId &&
              form.vehicleId === active.vehicleId
            ) {
              setResourceError('Выберите другого водителя или другую машину.');
              return;
            }
            if (
              await run(
                (token) =>
                  api.handovers.create(token, order.id, {
                    driverId: form.driverId,
                    vehicleId: form.vehicleId,
                    plannedTo: new Date(form.plannedTo).toISOString(),
                    reason: form.reason.trim(),
                    location: form.location.trim(),
                    cargoCondition: form.cargoCondition.trim(),
                  }),
                'Запрос передачи создан. Ожидаются два подтверждения водителей.',
              )
            )
              setForm({
                driverId: '',
                vehicleId: '',
                plannedTo: '',
                reason: '',
                location: '',
                cargoCondition: '',
              });
          }}
        >
          <h3 className="font-medium">Передать груз в пути</h3>
          {resourceError && <p role="alert">{resourceError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Принимающий водитель *">
              <NativeSelect
                required
                value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              >
                <option value="">Выберите</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.licenseNumber} · {d.status}
                    {d.id === active.driverId ? ' · Текущий' : ''}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Машина после передачи *">
              <NativeSelect
                required
                value={form.vehicleId}
                onChange={(e) =>
                  setForm({ ...form, vehicleId: e.target.value })
                }
              >
                <option value="">Выберите</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} · {v.status}
                    {v.id === active.vehicleId ? ' · Текущая' : ''}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Плановое окончание *">
              <Input
                type="datetime-local"
                required
                value={form.plannedTo}
                onChange={(e) =>
                  setForm({ ...form, plannedTo: e.target.value })
                }
              />
            </Field>
            <Field label="Место передачи *">
              <Input
                required
                maxLength={1000}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Причина передачи *">
            <Textarea
              required
              maxLength={1000}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>
          <Field label="Состояние груза *">
            <Textarea
              required
              maxLength={2000}
              value={form.cargoCondition}
              onChange={(e) =>
                setForm({ ...form, cargoCondition: e.target.value })
              }
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Запрос действует 15 минут. До двух подтверждений прежний водитель и
            машина остаются ответственными. Новая пара ещё не забронирована.
          </p>
          <Button type="submit" disabled={busy}>
            Создать запрос передачи
          </Button>
        </form>
      )}
      {handovers?.length === 0 && (
        <p className="text-sm text-muted-foreground">Передач груза пока нет.</p>
      )}
      {handovers?.map((h) => {
        const live =
            h.status === 'pending' && Date.parse(h.expiresAt) > Date.now(),
          outgoing =
            assignments.find((a) => a.id === h.previousAssignmentId)
              ?.driverId === actor.driverId;
        return (
          <article
            key={h.id}
            className="space-y-2 rounded-lg border p-4 text-sm"
          >
            <strong>
              {
                {
                  pending: 'Ожидает подтверждений',
                  completed: 'Передача завершена',
                  cancelled: 'Отменена',
                  expired: 'Срок истёк',
                }[h.status]
              }
            </strong>
            <p>
              Новое назначение: водитель {h.driverId} · машина {h.vehicleId}
            </p>
            <p>
              {h.location} · {h.reason}
            </p>
            <p>Состояние груза: {h.cargoCondition}</p>
            <p>Срок запроса: {new Date(h.expiresAt).toLocaleString('ru-RU')}</p>
            <p>
              Передающий водитель:{' '}
              {h.outgoingConfirmedAt
                ? `подтвердил ${new Date(h.outgoingConfirmedAt).toLocaleString('ru-RU')}`
                : 'не подтвердил'}
            </p>
            <p className="text-xs text-muted-foreground">
              Прежнее назначение: {h.previousAssignmentId}
              {h.nextAssignmentId && ` · Новое: ${h.nextAssignmentId}`}
            </p>
            {live &&
              actor.role === 'driver' &&
              outgoing &&
              !h.outgoingConfirmedAt && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(
                      (token) => api.handovers.confirmRelease(token, h.id),
                      'Передача подтверждена передающим водителем',
                    )
                  }
                >
                  Подтвердить передачу груза
                </Button>
              )}
            {live &&
              actor.role === 'driver' &&
              actor.driverId === h.driverId &&
              !!h.outgoingConfirmedAt && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(
                      (token) => api.handovers.accept(token, h.id),
                      'Груз принят новым исполнителем',
                    )
                  }
                >
                  Принять груз и рейс
                </Button>
              )}
            {live && canCreate && (
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  run(
                    (token) => api.handovers.cancel(token, h.id),
                    'Запрос передачи отменён',
                  )
                }
              >
                Отменить запрос
              </Button>
            )}
            {h.status === 'pending' && !live && (
              <p>Срок подтверждения истёк. Обновляем серверное состояние.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

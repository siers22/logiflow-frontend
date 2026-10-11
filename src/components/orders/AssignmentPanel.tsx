'use client';
import { useEffect, useState } from 'react';
import {
  api,
  type Order,
  type Assignment,
  type Driver,
  type Vehicle,
  type DispatchCandidate,
  type DispatchRecommendations,
} from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { errorMessage } from '@/lib/api-errors';
import type { OrderCommand } from '@/lib/useOrderWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, NativeSelect } from './Fields';
export function AssignmentPanel({
  order,
  assignment,
  canAssign,
  canAccept,
  canReject,
  busy,
  command,
}: {
  order: Order;
  assignment: Assignment | null;
  canAssign: boolean;
  canAccept: boolean;
  canReject: boolean;
  busy: boolean;
  command: OrderCommand;
}) {
  const { withAuth } = useUser();
  const [drivers, setDrivers] = useState<Driver[]>([]),
    [vehicles, setVehicles] = useState<Vehicle[]>([]),
    [resourceError, setResourceError] = useState('');
  const [recommendations, setRecommendations] =
      useState<DispatchRecommendations | null>(null),
    [dispatchError, setDispatchError] = useState(''),
    [refreshing, setRefreshing] = useState(false);
  const [driverId, setDriverId] = useState(''),
    [vehicleId, setVehicleId] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [error, setError] = useState('');
  const [pollRevision, setPollRevision] = useState(0);
  const [selected, setSelected] = useState<{
      candidate: DispatchCandidate;
      createdAt: string;
    } | null>(null),
    [rejectOpen, setRejectOpen] = useState(false),
    [reason, setReason] = useState(''),
    [comment, setComment] = useState('');
  useEffect(() => {
    if (!canAssign) return;
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
  }, [canAssign, withAuth]);
  useEffect(() => {
    if (!canAssign || order.status !== 'ready_for_dispatch') return;
    let live = true,
      running = false,
      attempts = 0;
    const load = async () => {
      if (!live || document.hidden || running || attempts >= 20) return;
      running = true;
      attempts++;
      try {
        const result = await withAuth((token) =>
          api.dispatch.get(token, order.id),
        );
        if (live) {
          setRecommendations(result);
          setDispatchError('');
          if (result.status !== 'pending') attempts = 20;
        }
      } catch (err) {
        if (live) {
          setDispatchError(errorMessage(err));
          attempts = 20;
        }
      } finally {
        running = false;
      }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [canAssign, order.id, order.status, withAuth, pollRevision]);
  return (
    <div className="space-y-4">
      {canAccept && assignment && (
        <Button
          disabled={busy}
          onClick={() =>
            command(
              (token) => api.assignments.accept(token, assignment.id),
              'Рейс принят',
            )
          }
        >
          Принять предложение
        </Button>
      )}
      {canReject && assignment && (
        <Button
          className="ml-2"
          disabled={busy}
          variant="outline"
          onClick={() => setRejectOpen((value) => !value)}
        >
          Отклонить
        </Button>
      )}
      {rejectOpen && canReject && assignment && (
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              await command(
                (token) =>
                  api.assignments.reject(
                    token,
                    assignment.id,
                    reason,
                    comment.trim(),
                  ),
                'Предложение отклонено',
              )
            )
              setRejectOpen(false);
          }}
        >
          <Field label="Причина отказа *">
            <NativeSelect
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Выберите причину</option>
              <option value="driver_unavailable">Недоступен в это время</option>
              <option value="vehicle_issue">Проблема с машиной</option>
              <option value="other">Другая причина</option>
            </NativeSelect>
          </Field>
          <Field label="Комментарий">
            <Textarea
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={busy}>
            Подтвердить отказ
          </Button>
        </form>
      )}
      {canAssign && (
        <>
          {order.status === 'ready_for_dispatch' && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between gap-3">
                <h3 className="font-medium">Рекомендации диспетчера</h3>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={refreshing || busy}
                  onClick={async () => {
                    setRefreshing(true);
                    try {
                      setRecommendations(
                        await withAuth((token) =>
                          api.dispatch.refresh(token, order.id),
                        ),
                      );
                      setDispatchError('');
                      setPollRevision((v) => v + 1);
                    } catch (err) {
                      setDispatchError(errorMessage(err));
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                >
                  Пересчитать
                </Button>
              </div>
              {dispatchError && (
                <p role="alert" className="text-sm text-amber-700">
                  {dispatchError} Можно выбрать ресурсы вручную.
                </p>
              )}
              {recommendations?.status === 'pending' && (
                <p className="text-sm">Рекомендации рассчитываются…</p>
              )}
              {recommendations?.status === 'unavailable' && (
                <p className="text-sm">
                  Сервис рекомендаций недоступен. Используйте ручной выбор.
                </p>
              )}
              {recommendations?.status === 'ready' &&
                !recommendations.candidates.length && (
                  <p className="text-sm">Подходящих ресурсов пока нет.</p>
                )}
              {recommendations?.candidates.slice(0, 5).map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className={`block w-full rounded-md border p-3 text-left text-sm ${selected?.candidate.id === candidate.id ? 'border-blue-500' : ''}`}
                  onClick={() => {
                    if (!recommendations.createdAt) return;
                    setSelected({
                      candidate,
                      createdAt: recommendations.createdAt,
                    });
                    setDriverId(candidate.driver_id);
                    setVehicleId(candidate.vehicle_id);
                  }}
                >
                  <strong>
                    {drivers.find((d) => d.id === candidate.driver_id)
                      ?.licenseNumber ?? candidate.driver_id}{' '}
                    ·{' '}
                    {vehicles.find((v) => v.id === candidate.vehicle_id)
                      ?.plateNumber ?? candidate.vehicle_id}
                  </strong>
                  <p>
                    Оценка: {candidate.score} · {candidate.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Расчёт: {recommendations.createdAt}
                  </p>
                </button>
              ))}
            </div>
          )}
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!(Date.parse(from) < Date.parse(to))) {
                setError('Конец окна должен быть позже начала.');
                return;
              }
              const ok = await command(
                (token) =>
                  api.assignments.create(token, order.id, {
                    driverId,
                    vehicleId,
                    plannedFrom: new Date(from).toISOString(),
                    plannedTo: new Date(to).toISOString(),
                    ...(assignment
                      ? { replacesAssignmentId: assignment.id }
                      : {}),
                    ...(selected
                      ? {
                          source: 'dispatch_recommendation',
                          recommendationId: selected.candidate.id,
                          recommendationCreatedAt: selected.createdAt,
                        }
                      : { source: 'manual' }),
                  }),
                'Предложение отправлено водителю',
              );
              if (ok) {
                setDriverId('');
                setVehicleId('');
                setSelected(null);
                setError('');
              } else {
                try {
                  setRecommendations(
                    await withAuth((token) =>
                      api.dispatch.get(token, order.id),
                    ),
                  );
                } catch (err) {
                  setDispatchError(errorMessage(err));
                }
              }
            }}
          >
            <h3 className="font-medium">
              {assignment
                ? 'Заменить предложение до старта'
                : 'Предложение водителю'}
            </h3>
            {resourceError && <p role="alert">{resourceError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Водитель *">
                <NativeSelect
                  required
                  value={driverId}
                  onChange={(e) => {
                    setDriverId(e.target.value);
                    setSelected(null);
                  }}
                >
                  <option value="">Выберите водителя</option>
                  {driverId && !drivers.some((d) => d.id === driverId) && (
                    <option value={driverId}>{driverId}</option>
                  )}
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.licenseNumber} · {d.status}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Машина *">
                <NativeSelect
                  required
                  value={vehicleId}
                  onChange={(e) => {
                    setVehicleId(e.target.value);
                    setSelected(null);
                  }}
                >
                  <option value="">Выберите машину</option>
                  {vehicleId && !vehicles.some((v) => v.id === vehicleId) && (
                    <option value={vehicleId}>{vehicleId}</option>
                  )}
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} · {v.status}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Начало планового окна *">
                <Input
                  required
                  type="datetime-local"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="Конец планового окна *">
                <Input
                  required
                  type="datetime-local"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              {selected
                ? 'Выбрана рекомендованная пара.'
                : 'Ручное назначение.'}{' '}
              Бронь и допуск ресурсов проверяются сервером при отправке.
            </p>
            {error && <p role="alert">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Отправка…' : 'Отправить предложение'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

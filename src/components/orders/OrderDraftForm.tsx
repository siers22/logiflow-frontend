'use client';
import { useEffect, useRef, useState } from 'react';
import { api, type Order, type OrderCreate, type Warehouse } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { errorMessage } from '@/lib/api-errors';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Field, NativeSelect } from './Fields';
function localTime(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function OrderDraftForm({
  order,
  onSaved,
}: {
  order?: Order;
  onSaved: (value: Order) => void;
}) {
  const { user, withAuth } = useUser();
  const workspace = useWorkspace();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]),
    [warehouseError, setWarehouseError] = useState('');
  const [revision, setRevision] = useState(0);
  const [originMode, setOriginMode] = useState('warehouse'),
    [destinationMode, setDestinationMode] = useState('address');
  const [form, setForm] = useState({
    originWarehouseId: '',
    destinationWarehouseId: '',
    originAddress: '',
    destinationAddress: '',
    cargoDescription: order?.cargoDescription ?? '',
    weightKg: String(order?.weightKg ?? 0),
    volumeM3: String(order?.volumeM3 ?? 0),
    pickupFrom: localTime(order?.pickupFrom),
    pickupTo: localTime(order?.pickupTo),
  });
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const editingId = order?.id;
  useEffect(() => {
    if (editingId) return;
    let live = true;
    withAuth((token) => api.warehouses.list(token))
      .then((value) => {
        if (live) {
          setWarehouses(value);
          setWarehouseError('');
        }
      })
      .catch((err) => {
        if (live) setWarehouseError(errorMessage(err));
      });
    return () => {
      live = false;
    };
  }, [withAuth, editingId, revision]);
  const update = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const usable = warehouses.filter(
    (w) => w.status === 'active' && w.latitude != null && w.longitude != null,
  );
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (lock.current) return;
        const from = Date.parse(form.pickupFrom),
          to = Date.parse(form.pickupTo),
          weightKg = Number(form.weightKg),
          volumeM3 = Number(form.volumeM3);
        if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
          setError('Конец окна забора должен быть позже начала.');
          return;
        }
        if (
          ![weightKg, volumeM3].every(
            (value) => Number.isFinite(value) && value >= 0,
          )
        ) {
          setError('Вес и объём должны быть неотрицательными числами.');
          return;
        }
        const payload: OrderCreate = {
          cargoDescription: form.cargoDescription.trim(),
          weightKg,
          volumeM3,
          pickupFrom: new Date(from).toISOString(),
          pickupTo: new Date(to).toISOString(),
        };
        if (!order) {
          const originWarehouseId =
            user?.role === 'manager'
              ? workspace.manager?.warehouseId
              : form.originWarehouseId;
          if (originMode === 'warehouse') {
            if (!usable.some((w) => w.id === originWarehouseId)) {
              setError('Выберите активный склад отправления с координатами.');
              return;
            }
            payload.originWarehouseId = originWarehouseId;
          } else payload.originAddress = form.originAddress.trim();
          if (destinationMode === 'warehouse') {
            if (!usable.some((w) => w.id === form.destinationWarehouseId)) {
              setError('Выберите активный склад назначения с координатами.');
              return;
            }
            payload.destinationWarehouseId = form.destinationWarehouseId;
          } else payload.destinationAddress = form.destinationAddress.trim();
        }
        lock.current = true;
        setBusy(true);
        setError('');
        try {
          onSaved(
            await withAuth((token) =>
              order
                ? api.orders.updateDraft(token, order.id, {
                    cargoDescription: payload.cargoDescription ?? '',
                    weightKg,
                    volumeM3,
                    pickupFrom: payload.pickupFrom!,
                    pickupTo: payload.pickupTo!,
                  })
                : api.orders.create(token, payload),
            ),
          );
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      {!order && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(['origin', 'destination'] as const).map((side) => {
            const origin = side === 'origin',
              mode = origin ? originMode : destinationMode;
            const warehouseKey = origin
                ? 'originWarehouseId'
                : 'destinationWarehouseId',
              addressKey = origin ? 'originAddress' : 'destinationAddress';
            return (
              <div key={side} className="space-y-3">
                <Field label={origin ? 'Отправление *' : 'Назначение *'}>
                  <NativeSelect
                    value={mode}
                    disabled={origin && user?.role === 'manager'}
                    onChange={(e) =>
                      origin
                        ? setOriginMode(e.target.value)
                        : setDestinationMode(e.target.value)
                    }
                  >
                    <option value="warehouse">Склад</option>
                    <option value="address">Адрес</option>
                  </NativeSelect>
                </Field>
                {mode === 'warehouse' ? (
                  <Field label="Склад *">
                    <NativeSelect
                      required
                      value={
                        origin && user?.role === 'manager'
                          ? (workspace.manager?.warehouseId ?? '')
                          : form[warehouseKey]
                      }
                      disabled={origin && user?.role === 'manager'}
                      onChange={(e) => update(warehouseKey, e.target.value)}
                    >
                      <option value="">Выберите склад</option>
                      {usable.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} — {w.address}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                ) : (
                  <Field label="Адрес *">
                    <Input
                      required
                      maxLength={1000}
                      value={form[addressKey]}
                      onChange={(e) => update(addressKey, e.target.value)}
                    />
                  </Field>
                )}
              </div>
            );
          })}
        </div>
      )}
      {warehouseError && (
        <p role="alert" className="text-sm text-red-600">
          {warehouseError}{' '}
          <Button
            type="button"
            variant="outline"
            onClick={() => setRevision((v) => v + 1)}
          >
            Повторить
          </Button>
        </p>
      )}
      {order && (
        <p className="text-sm text-muted-foreground">
          Маршрут сохранён при создании. После изменения груза сервер
          пересчитает стоимость.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Забрать с *">
          <Input
            required
            type="datetime-local"
            value={form.pickupFrom}
            onChange={(e) => update('pickupFrom', e.target.value)}
          />
        </Field>
        <Field label="Забрать до *">
          <Input
            required
            type="datetime-local"
            value={form.pickupTo}
            onChange={(e) => update('pickupTo', e.target.value)}
          />
        </Field>
        <Field label="Вес, кг">
          <Input
            required
            min="0"
            step="any"
            type="number"
            value={form.weightKg}
            onChange={(e) => update('weightKg', e.target.value)}
          />
        </Field>
        <Field label="Объём, м³">
          <Input
            required
            min="0"
            step="any"
            type="number"
            value={form.volumeM3}
            onChange={(e) => update('volumeM3', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Описание груза">
        <Textarea
          value={form.cargoDescription}
          maxLength={2000}
          onChange={(e) => update('cargoDescription', e.target.value)}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          busy ||
          (!order &&
            user?.role === 'manager' &&
            (workspace.loading || !!workspace.error))
        }
      >
        {busy
          ? 'Сохранение…'
          : order
            ? 'Сохранить черновик'
            : 'Создать черновик'}
      </Button>
    </form>
  );
}

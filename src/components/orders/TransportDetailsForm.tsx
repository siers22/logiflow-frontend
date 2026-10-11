'use client';
import { useEffect, useRef, useState } from 'react';
import {
  api,
  type Order,
  type Counterparty,
  type TransportDetailsWrite,
} from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { errorMessage } from '@/lib/api-errors';
import { CounterpartyForm } from '@/components/CounterpartyForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Field, NativeSelect } from './Fields';
export function TransportDetailsForm({
  order,
  onSaved,
}: {
  order: Order;
  onSaved: (order: Order) => void;
}) {
  const { withAuth } = useUser(),
    snapshot = order.transportDetails;
  const [parties, setParties] = useState<Counterparty[]>([]),
    [loadError, setLoadError] = useState(''),
    [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TransportDetailsWrite>({
    senderId: snapshot?.sender.id ?? '',
    recipientId: snapshot?.recipient.id ?? '',
    carrierId: snapshot?.carrier.id ?? '',
    basisType: snapshot?.basisType ?? 'contract',
    basisNumber: snapshot?.basisNumber ?? '',
    basisDate: snapshot?.basisDate ?? '',
    packageCount: snapshot?.packageCount ?? 1,
    terms: snapshot?.terms ?? '',
  });
  const [creating, setCreating] = useState<
      'senderId' | 'recipientId' | 'carrierId' | null
    >(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setLoadError('');
    (async () => {
      const values: Counterparty[] = [];
      for (let offset = 0; offset <= 10000; offset += 100) {
        const page = await withAuth((token) =>
          api.counterparties.list(token, { limit: 100, offset }),
        );
        values.push(...page);
        if (page.length < 100) break;
      }
      if (live) setParties(values);
    })()
      .catch((err) => {
        if (live) setLoadError(errorMessage(err));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [withAuth, revision]);
  const options = [
    ...new Map(
      [
        ...(snapshot
          ? [snapshot.sender, snapshot.recipient, snapshot.carrier]
          : []),
        ...parties,
      ].map((p) => [p.id, p]),
    ).values(),
  ];
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (lock.current) return;
        if (!Number.isInteger(form.packageCount) || form.packageCount <= 0) {
          setError('Число мест должно быть целым и больше нуля.');
          return;
        }
        lock.current = true;
        setBusy(true);
        setError('');
        try {
          onSaved(
            await withAuth((token) =>
              api.orders.setTransportDetails(token, order.id, {
                senderId: form.senderId,
                recipientId: form.recipientId,
                carrierId: form.carrierId,
                basisType: form.basisType,
                basisNumber: form.basisNumber.trim(),
                basisDate: form.basisDate,
                packageCount: form.packageCount,
                terms: form.terms?.trim(),
              }),
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
      {loading && <p className="text-sm">Загрузка каталога…</p>}
      {loadError && (
        <p role="alert">
          {loadError}{' '}
          <Button
            type="button"
            variant="outline"
            onClick={() => setRevision((v) => v + 1)}
          >
            Повторить
          </Button>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ['senderId', 'Отправитель'],
            ['recipientId', 'Получатель'],
            ['carrierId', 'Перевозчик'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-2">
            <Field label={`${label} *`}>
              <NativeSelect
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              >
                <option value="">Выберите</option>
                {options
                  .filter(
                    (p) =>
                      p.status === 'active' &&
                      (key !== 'carrierId' || p.kind !== 'individual'),
                  )
                  .map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                      {p.shared ? ' · Общий' : ''}
                    </option>
                  ))}
              </NativeSelect>
            </Field>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreating(key)}
            >
              Добавить
            </Button>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Основание *">
          <NativeSelect
            value={form.basisType}
            onChange={(e) =>
              setForm({
                ...form,
                basisType: e.target.value as TransportDetailsWrite['basisType'],
              })
            }
          >
            <option value="contract">Договор</option>
            <option value="transport_request">Заявка на перевозку</option>
          </NativeSelect>
        </Field>
        <Field label="Номер основания *">
          <Input
            required
            maxLength={100}
            value={form.basisNumber}
            onChange={(e) => setForm({ ...form, basisNumber: e.target.value })}
          />
        </Field>
        <Field label="Дата основания *">
          <Input
            required
            type="date"
            value={form.basisDate}
            onChange={(e) => setForm({ ...form, basisDate: e.target.value })}
          />
        </Field>
        <Field label="Число мест *">
          <Input
            required
            type="number"
            min="1"
            step="1"
            value={Number.isNaN(form.packageCount) ? '' : form.packageCount}
            onChange={(e) =>
              setForm({
                ...form,
                packageCount:
                  e.target.value === '' ? NaN : Number(e.target.value),
              })
            }
          />
        </Field>
      </div>
      <Field label="Условия перевозки">
        <Textarea
          maxLength={2000}
          value={form.terms}
          onChange={(e) => setForm({ ...form, terms: e.target.value })}
        />
      </Field>
      <p className="text-xs text-muted-foreground">
        Сохраняется снимок реквизитов сторон. Изменения каталога не обновляют
        его автоматически.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy
          ? 'Сохранение…'
          : snapshot
            ? 'Пересохранить снимок реквизитов'
            : 'Сохранить реквизиты перевозки'}
      </Button>
      <Dialog
        open={!!creating}
        onOpenChange={(open) => {
          if (!open) setCreating(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый контрагент</DialogTitle>
            <DialogDescription>
              После сохранения вернёмся к реквизитам этого черновика.
            </DialogDescription>
          </DialogHeader>
          {creating && (
            <CounterpartyForm
              onSaved={(party) => {
                setParties((previous) => [...previous, party]);
                setForm((previous) => ({ ...previous, [creating]: party.id }));
                setCreating(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}

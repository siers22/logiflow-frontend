'use client';
import { useState } from 'react';
import {
  api,
  type Order,
  type Assignment,
  type DeliveryReceipt,
} from '@/lib/api';
import type { OrderCommand } from '@/lib/useOrderWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from './Fields';
import { ReferenceLabel } from './OrderReferences';
export function DeliveryReceiptPanel({
  order,
  assignment,
  receipt,
  canCreate,
  busy,
  command,
}: {
  order: Order;
  assignment: Assignment | null;
  receipt: DeliveryReceipt | null;
  canCreate: boolean;
  busy: boolean;
  command: OrderCommand;
}) {
  const [form, setForm] = useState({
      recipientName: '',
      recipientRole: '',
      authorityBasis: '',
      packageCount: '',
      cargoCondition: '',
      sealNumber: '',
      comment: '',
    }),
    [confirmed, setConfirmed] = useState(false);
  if (receipt)
    return (
      <div className="space-y-2 text-sm">
        <p>
          <strong>{receipt.recipientName}</strong> · {receipt.recipientRole}
        </p>
        <p>Основание: {receipt.authorityBasis}</p>
        <p>
          Принято мест: {receipt.packageCount} · {receipt.cargoCondition}
        </p>
        {receipt.sealNumber && <p>Пломба: {receipt.sealNumber}</p>}
        {receipt.comment && <p>{receipt.comment}</p>}
        <p>
          Фактическая приёмка:{' '}
          {new Date(receipt.receivedAt).toLocaleString('ru-RU')}
        </p>
        <p className="text-xs text-muted-foreground">
          Записано: {new Date(receipt.recordedAt).toLocaleString('ru-RU')} ·{' '}
          <ReferenceLabel kind="users" id={receipt.recordedByUserId} />. Изменение записи недоступно.
        </p>
      </div>
    );
  if (!canCreate || !assignment)
    return (
      <p className="text-sm text-muted-foreground">
        Приёмка не зарегистрирована.
        {order.destinationWarehouseId && order.status === 'arrived'
          ? ' Ожидается разгрузка и подтверждение склада назначения.'
          : ''}
        {order.transportPolicyVersion === 0
          ? ' Для этого заказа действует прежняя процедура завершения.'
          : ''}
      </p>
    );
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!confirmed || form.packageCount === '') return;
        const packageCount = Number(form.packageCount);
        if (!Number.isInteger(packageCount) || packageCount < 0) return;
        await command(
          (token) =>
            api.deliveryReceipts.create(token, order.id, {
              assignmentId: assignment.id,
              recipientName: form.recipientName.trim(),
              recipientRole: form.recipientRole.trim(),
              authorityBasis: form.authorityBasis.trim(),
              packageCount,
              cargoCondition: form.cargoCondition.trim(),
              sealNumber: form.sealNumber.trim(),
              comment: form.comment.trim(),
            }),
          'Приёмка зарегистрирована. Проверьте проблемы перед завершением.',
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ['recipientName', 'ФИО получателя *', 200],
            ['recipientRole', 'Должность / роль *', 200],
            ['authorityBasis', 'Основание полномочий *', 1000],
            ['sealNumber', 'Номер пломбы', 100],
          ] as const
        ).map(([key, label, max]) => (
          <Field key={key} label={label}>
            <Input
              required={key !== 'sealNumber'}
              maxLength={max}
              value={form[key]}
              onChange={(e) => {
                setConfirmed(false);
                setForm({ ...form, [key]: e.target.value });
              }}
            />
          </Field>
        ))}
        <Field label="Фактическое число мест *">
          <Input
            required
            type="number"
            min="0"
            step="1"
            value={form.packageCount}
            onChange={(e) => {
              setConfirmed(false);
              setForm({ ...form, packageCount: e.target.value });
            }}
          />
        </Field>
      </div>
      <Field label="Состояние груза *">
        <Textarea
          required
          maxLength={2000}
          value={form.cargoCondition}
          onChange={(e) => {
            setConfirmed(false);
            setForm({ ...form, cargoCondition: e.target.value });
          }}
        />
      </Field>
      <Field label="Комментарий">
        <Textarea
          maxLength={2000}
          value={form.comment}
          onChange={(e) => {
            setConfirmed(false);
            setForm({ ...form, comment: e.target.value });
          }}
        />
      </Field>
      <div className="rounded-lg border p-3 text-sm">
        <p>
          Принимает: {form.recipientName || '—'}, {form.recipientRole || '—'}.
          Основание: {form.authorityBasis || '—'}.
        </p>
        <p>
          Мест: {form.packageCount || '—'}. Состояние:{' '}
          {form.cargoCondition || '—'}.
        </p>
        <p>Время приёмки определит сервер при сохранении.</p>
        <label className="mt-3 flex gap-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />{' '}
          Данные проверены. Запись однократная, исправить её через интерфейс
          нельзя.
        </label>
      </div>
      <Button type="submit" disabled={busy || !confirmed}>
        {busy ? 'Сохранение…' : 'Зафиксировать приёмку'}
      </Button>
    </form>
  );
}

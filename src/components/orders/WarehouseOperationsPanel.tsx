'use client';
import { useState } from 'react';
import {
  api,
  type Assignment,
  type Order,
  type WarehouseOperation,
  type WarehouseOperationType,
} from '@/lib/api';
import type { OrderCommand } from '@/lib/useOrderWorkspace';
import type { orderActions } from '@/lib/order-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from './Fields';
export const operationLabels: Record<WarehouseOperationType, string> = {
  receive: 'Принять отправление',
  load: 'Подтвердить погрузку',
  unload: 'Подтвердить разгрузку',
  undo_load: 'Снять погрузку',
  return_to_sender: 'Выдать отправителю',
};
export function WarehouseOperationsPanel({
  order,
  operations,
  assignment,
  actions,
  busy,
  command,
}: {
  order: Order;
  operations: WarehouseOperation[];
  assignment: Assignment | null;
  actions: ReturnType<typeof orderActions>;
  busy: boolean;
  command: OrderCommand;
}) {
  const [kind, setKind] = useState<WarehouseOperationType | null>(null);
  const [count, setCount] = useState(''),
    [condition, setCondition] = useState(''),
    [comment, setComment] = useState(''),
    [recipient, setRecipient] = useState('');
  const allowed = {
    receive: actions.receive,
    load: actions.load,
    unload: actions.unload,
    undo_load: actions.undoLoad,
    return_to_sender: actions.returnToSender,
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(allowed) as WarehouseOperationType[])
          .filter((key) => allowed[key])
          .map((key) => (
            <Button
              key={key}
              disabled={busy}
              variant="outline"
              onClick={() => setKind(key)}
            >
              {operationLabels[key]}
            </Button>
          ))}
      </div>
      {kind && (
        <form
          className="space-y-3 rounded-lg border p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!allowed[kind]) return;
            const packageCount = Number(count);
            if (
              count === '' ||
              !Number.isInteger(packageCount) ||
              packageCount < (kind === 'receive' || kind === 'load' ? 1 : 0)
            )
              return;
            const needsTrip = ['load', 'unload', 'undo_load'].includes(kind);
            if (needsTrip && !assignment) return;
            if (
              await command(
                (token) =>
                  api.warehouseOperations.create(token, order.id, {
                    operationType: kind,
                    ...(needsTrip ? { assignmentId: assignment!.id } : {}),
                    packageCount,
                    cargoCondition: condition.trim(),
                    comment: comment.trim(),
                    ...(kind === 'return_to_sender'
                      ? { recipientName: recipient.trim() }
                      : {}),
                  }),
                'Складская операция сохранена',
              )
            ) {
              setKind(null);
              setCount('');
              setCondition('');
              setComment('');
              setRecipient('');
            }
          }}
        >
          <h3 className="font-medium">{operationLabels[kind]}</h3>
          <Field label="Фактическое число мест *">
            <Input
              required
              type="number"
              step="1"
              min={kind === 'receive' || kind === 'load' ? 1 : 0}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </Field>
          <Field label="Состояние груза *">
            <Textarea
              required
              maxLength={2000}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
          </Field>
          <Field
            label={
              kind === 'undo_load' || kind === 'return_to_sender'
                ? 'Причина / комментарий *'
                : 'Комментарий'
            }
          >
            <Textarea
              required={kind === 'undo_load' || kind === 'return_to_sender'}
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Field>
          {kind === 'return_to_sender' && (
            <Field label="Кому выдан груз *">
              <Input
                required
                maxLength={200}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </Field>
          )}
          <p className="text-xs text-muted-foreground">
            Операция сохраняется в неизменяемый журнал. Расхождение количества
            может создать проблему перевозки.
          </p>
          <div className="flex gap-2">
            <Button disabled={busy || !allowed[kind]} type="submit">
              {busy ? 'Сохранение…' : 'Подтвердить операцию'}
            </Button>
            <Button
              disabled={busy}
              type="button"
              variant="outline"
              onClick={() => setKind(null)}
            >
              Закрыть
            </Button>
          </div>
        </form>
      )}
      {!operations.length && (
        <p className="text-sm text-muted-foreground">
          Складских операций пока нет.
        </p>
      )}
      {operations.map((op) => (
        <article key={op.id} className="rounded-lg border p-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <strong>{operationLabels[op.operationType]}</strong>
            <time>{new Date(op.occurredAt).toLocaleString('ru-RU')}</time>
          </div>
          <p>
            Мест: {op.packageCount} · {op.cargoCondition}
          </p>
          {op.comment && <p>{op.comment}</p>}
          {op.recipientName && <p>Получатель: {op.recipientName}</p>}
          <p className="text-xs text-muted-foreground">
            Склад: {op.warehouseId} · Подтвердил: {op.createdByUserId}
            {op.assignmentId && ` · Назначение: ${op.assignmentId}`}
          </p>
        </article>
      ))}
    </div>
  );
}

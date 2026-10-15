'use client';
import { useState } from 'react';
import {
  api,
  type Order,
  type OrderIncident,
  type IncidentKind,
  type IncidentResolution,
  type Assignment,
} from '@/lib/api';
import { canResolveIncident, type Actor } from '@/lib/order-actions';
import type { OrderCommand } from '@/lib/useOrderWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, NativeSelect } from './Fields';
import { ReferenceLabel } from './OrderReferences';
const kinds: Record<IncidentKind, string> = {
  vehicle_breakdown: 'Поломка машины',
  cargo_damage: 'Повреждение груза',
  quantity_discrepancy: 'Расхождение количества',
  recipient_refusal: 'Отказ получателя',
  other: 'Другая проблема',
};
const resolutions: Record<IncidentResolution, string> = {
  accept_discrepancy: 'Согласовать расхождение',
  accept_with_remarks: 'Принять с замечаниями',
  remediated: 'Проблема устранена',
  repaired: 'Машина отремонтирована',
  resources_replaced: 'Ресурсы заменены передачей в пути',
  recipient_accepted: 'Получатель согласился принять',
};
const choices: Record<IncidentKind, IncidentResolution[]> = {
  quantity_discrepancy: ['accept_discrepancy'],
  cargo_damage: ['accept_with_remarks', 'remediated'],
  other: ['remediated'],
  vehicle_breakdown: ['repaired', 'resources_replaced'],
  recipient_refusal: ['recipient_accepted'],
};
function ResolutionForm({
  incident,
  order,
  busy,
  command,
}: {
  incident: OrderIncident;
  order: Order;
  busy: boolean;
  command: OrderCommand;
}) {
  const [resolution, setResolution] = useState<IncidentResolution>(
      choices[incident.kind][0],
    ),
    [note, setNote] = useState(''),
    [recipient, setRecipient] = useState('');
  return (
    <form
      className="mt-3 space-y-3 border-t pt-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await command(
          (token) =>
            api.incidents.resolve(token, incident.id, {
              resolution,
              note: note.trim(),
              ...(resolution === 'recipient_accepted'
                ? { recipientName: recipient.trim() }
                : {}),
            }),
          'Решение по проблеме сохранено',
        );
      }}
    >
      <Field label="Решение *">
        <NativeSelect
          value={resolution}
          onChange={(e) => setResolution(e.target.value as IncidentResolution)}
        >
          {choices[incident.kind].map((value) => (
            <option key={value} value={value}>
              {resolutions[value]}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {resolution === 'accept_discrepancy' && (
        <p className="text-sm">
          Согласуется исходное расхождение: ожидалось{' '}
          {incident.expectedPackages ?? '—'}, фактически{' '}
          {incident.actualPackages ?? '—'}. Цифры в журнале сохраняются.
        </p>
      )}
      {resolution === 'resources_replaced' && (
        <p className="text-sm">
          Сначала завершите передачу груза с заменой машины. Сервер проверит
          смену ресурсов.
        </p>
      )}
      {resolution === 'recipient_accepted' && (
        <Field label="ФИО согласившегося получателя *">
          <Input
            required
            maxLength={200}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </Field>
      )}
      <Field label="Обоснование решения *">
        <Textarea
          required
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <Button
        type="submit"
        disabled={
          busy ||
          (resolution === 'recipient_accepted' && order.status !== 'arrived')
        }
      >
        {busy ? 'Сохранение…' : 'Сохранить решение'}
      </Button>
    </form>
  );
}
export function OrderIncidentsPanel({
  order,
  incidents,
  actor,
  assignment,
  canCreate,
  busy,
  command,
}: {
  order: Order;
  incidents: OrderIncident[];
  actor: Actor;
  assignment: Assignment | null;
  canCreate: boolean;
  busy: boolean;
  command: OrderCommand;
}) {
  const [adding, setAdding] = useState(false),
    [kind, setKind] = useState<IncidentKind>('other'),
    [description, setDescription] = useState(''),
    [expected, setExpected] = useState(''),
    [actual, setActual] = useState('');
  return (
    <div className="space-y-4">
      {canCreate && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setAdding((value) => !value)}
        >
          Сообщить о проблеме
        </Button>
      )}
      {adding && canCreate && (
        <form
          className="space-y-3 rounded-lg border p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const discrepancy = kind === 'quantity_discrepancy';
            if (
              discrepancy &&
              (expected === '' || actual === '' || expected === actual)
            )
              return;
            if (
              await command(
                (token) =>
                  api.incidents.create(token, order.id, {
                    kind,
                    description: description.trim(),
                    ...(discrepancy
                      ? {
                          expectedPackages: Number(expected),
                          actualPackages: Number(actual),
                        }
                      : {}),
                  }),
                'Проблема зарегистрирована',
              )
            ) {
              setAdding(false);
              setDescription('');
            }
          }}
        >
          <Field label="Вид проблемы">
            <NativeSelect
              value={kind}
              onChange={(e) => setKind(e.target.value as IncidentKind)}
            >
              {(Object.keys(kinds) as IncidentKind[])
                .filter(
                  (value) =>
                    (value !== 'vehicle_breakdown' ||
                      (!!assignment &&
                        ['accepted', 'active'].includes(assignment.status))) &&
                    (value !== 'recipient_refusal' ||
                      order.status === 'arrived'),
                )
                .map((value) => (
                  <option key={value} value={value}>
                    {kinds[value]}
                  </option>
                ))}
            </NativeSelect>
          </Field>
          <Field label="Описание *">
            <Textarea
              required
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          {kind === 'quantity_discrepancy' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ожидалось мест *">
                <Input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                />
              </Field>
              <Field label="Фактически мест *">
                <Input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                />
              </Field>
            </div>
          )}
          <Button disabled={busy} type="submit">
            Зарегистрировать
          </Button>
        </form>
      )}
      {!incidents.length && (
        <p className="text-sm text-muted-foreground">
          Проблемы не зарегистрированы.
        </p>
      )}
      {incidents.map((incident) => (
        <article
          key={incident.id}
          className={`rounded-lg border p-4 text-sm ${incident.status === 'open' ? 'border-amber-400' : ''}`}
        >
          <div className="flex justify-between gap-3">
            <strong>{kinds[incident.kind]}</strong>
            <span>{incident.status === 'open' ? 'Открыта' : 'Решена'}</span>
          </div>
          <p className="my-2 whitespace-pre-wrap">{incident.description}</p>
          {incident.expectedPackages != null && (
            <p>
              Ожидалось: {incident.expectedPackages} · Фактически:{' '}
              {incident.actualPackages ?? '—'}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Сообщил: <ReferenceLabel kind="users" id={incident.reportedByUserId} /> ·{' '}
            {new Date(incident.reportedAt).toLocaleString('ru-RU')}
            {incident.sourceOperationId &&
              <> · Операция: <ReferenceLabel kind="operations" id={incident.sourceOperationId} /></>}
          </p>
          {incident.status === 'resolved' ? (
            <div className="mt-3 border-t pt-3">
              <strong>
                {incident.resolution && resolutions[incident.resolution]}
              </strong>
              <p>{incident.resolutionNote}</p>
              {incident.recipientName && (
                <p>Получатель: {incident.recipientName}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Решение принял: <ReferenceLabel kind="users" id={incident.resolvedByUserId} /> ·{' '}
                {incident.resolvedAt &&
                  new Date(incident.resolvedAt).toLocaleString('ru-RU')}
              </p>
            </div>
          ) : canResolveIncident(incident, actor) ? (
            <ResolutionForm
              incident={incident}
              order={order}
              busy={busy}
              command={command}
            />
          ) : (
            <p className="mt-2 text-amber-700">
              Ожидается решение{' '}
              {incident.warehouseId
                ? 'менеджера ответственного склада или администратора'
                : 'администратора'}
              .
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

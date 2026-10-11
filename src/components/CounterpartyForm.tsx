'use client';
import { useRef, useState } from 'react';
import { api, type Counterparty, type CounterpartyWrite } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import {
  counterpartyErrors,
  counterpartyPayload,
} from '@/lib/counterparty-validation';
import { errorMessage } from '@/lib/api-errors';
import { Field, NativeSelect } from '@/components/orders/Fields';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function CounterpartyForm({
  initial,
  onSaved,
}: {
  initial?: Counterparty;
  onSaved: (party: Counterparty) => void;
}) {
  const { user, withAuth } = useUser();
  const [form, setForm] = useState<CounterpartyWrite>(
    initial ?? {
      kind: 'organization',
      name: '',
      address: '',
      contactName: '',
      inn: '',
      kpp: '',
      phone: '',
      email: '',
    },
  );
  const [errors, setErrors] = useState<ReturnType<typeof counterpartyErrors>>(
    {},
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const admin = user?.role === 'admin';
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (lock.current) return;
        const payload = counterpartyPayload(form, admin),
          issues = counterpartyErrors(payload);
        setErrors(issues);
        if (Object.keys(issues).length) return;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
          onSaved(
            await withAuth((token) =>
              initial
                ? api.counterparties.update(token, initial.id, payload)
                : api.counterparties.create(token, payload),
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
      <Field label="Вид контрагента">
        <NativeSelect
          value={form.kind}
          onChange={(e) =>
            setForm({
              ...form,
              kind: e.target.value as CounterpartyWrite['kind'],
              kpp: '',
            })
          }
        >
          <option value="organization">Организация</option>
          <option value="entrepreneur">ИП</option>
          <option value="individual">Физическое лицо</option>
        </NativeSelect>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ['name', 'Название / ФИО *', 300],
            ['inn', form.kind === 'individual' ? 'ИНН' : 'ИНН *', 12],
            ['kpp', 'КПП', 9],
            ['address', 'Адрес *', 1000],
            ['contactName', 'Контактное лицо *', 200],
            ['phone', 'Телефон', 40],
            ['email', 'Email', 254],
          ] as const
        )
          .filter(([key]) => key !== 'kpp' || form.kind === 'organization')
          .map(([key, label, max]) => (
            <Field key={key} label={label} error={errors[key]}>
              <Input
                value={form[key] ?? ''}
                maxLength={max}
                type={key === 'email' ? 'email' : 'text'}
                aria-invalid={!!errors[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </Field>
          ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Проверка ИНН проверяет только формат и контрольную сумму.
      </p>
      {admin && (
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.shared ?? false}
            onChange={(e) => setForm({ ...form, shared: e.target.checked })}
          />{' '}
          Общий каталог
        </label>
      )}
      {initial && (
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.status === 'archived'}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.checked ? 'archived' : 'active',
              })
            }
          />{' '}
          В архиве
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button disabled={busy} type="submit">
        {busy ? 'Сохранение…' : 'Сохранить контрагента'}
      </Button>
    </form>
  );
}

import type { CounterpartyWrite } from '../types/logistics.ts';
export function validINN(value: string): boolean {
  if (!/^(?:\d{10}|\d{12})$/.test(value) || /^0+$/.test(value)) return false;
  const check = (weights: number[], index: number) =>
    (weights.reduce((sum, weight, i) => sum + Number(value[i]) * weight, 0) %
      11) %
      10 ===
    Number(value[index]);
  return value.length === 10
    ? check([2, 4, 10, 3, 5, 9, 4, 6, 8], 9)
    : check([7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 10) &&
        check([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 11);
}
export function counterpartyErrors(
  data: CounterpartyWrite,
): Partial<Record<keyof CounterpartyWrite, string>> {
  const errors: Partial<Record<keyof CounterpartyWrite, string>> = {};
  for (const [key, max] of [
    ['name', 300],
    ['address', 1000],
    ['contactName', 200],
  ] as const)
    if (!data[key].trim() || [...data[key].trim()].length > max)
      errors[key] = `Обязательное поле, до ${max} символов`;
  const inn = data.inn?.trim() ?? '';
  if (
    (data.kind !== 'individual' || inn) &&
    (!validINN(inn) || inn.length !== (data.kind === 'organization' ? 10 : 12))
  )
    errors.inn = 'Проверьте длину и контрольную сумму ИНН';
  if (
    data.kpp &&
    (data.kind !== 'organization' || !/^\d{9}$/.test(data.kpp.trim()))
  )
    errors.kpp = 'КПП: 9 цифр, только для организации';
  if (!data.phone?.trim() && !data.email?.trim())
    errors.phone = 'Укажите телефон или email';
  if ((data.phone?.trim().length ?? 0) > 40) errors.phone = 'До 40 символов';
  if (
    data.email &&
    (data.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
  )
    errors.email = 'Укажите корректный email';
  return errors;
}
export function counterpartyPayload(
  data: CounterpartyWrite,
  admin: boolean,
): CounterpartyWrite {
  return {
    kind: data.kind,
    name: data.name.trim(),
    address: data.address.trim(),
    contactName: data.contactName.trim(),
    inn: data.inn?.trim() ?? '',
    kpp: data.kind === 'organization' ? (data.kpp?.trim() ?? '') : '',
    phone: data.phone?.trim() ?? '',
    email: data.email?.trim() ?? '',
    status: data.status ?? 'active',
    ...(admin ? { shared: data.shared ?? false } : {}),
  };
}

import type { OrderReferences, WarehouseOperation } from './api';

export const referenceFallbacks = {
  users: 'Имя недоступно',
  drivers: 'Водитель недоступен',
  vehicles: 'Машина недоступна',
  warehouses: 'Склад недоступен',
  assignments: 'Данные рейса недоступны',
};

export function referenceLabel(
  refs: OrderReferences | null,
  kind: keyof OrderReferences,
  id?: string | null,
) {
  return (id && refs?.[kind]?.[id]?.trim()) || referenceFallbacks[kind];
}

const operationNames = {
  receive: 'Приём отправления',
  load: 'Погрузка',
  unload: 'Разгрузка',
  undo_load: 'Снятие погрузки',
  return_to_sender: 'Возврат отправителю',
};

export function operationReferenceLabel(operations: WarehouseOperation[] | null, id?: string | null) {
  const op = operations?.find((item) => item.id === id);
  return op
    ? `${operationNames[op.operationType]} · ${new Date(op.occurredAt).toLocaleString('ru-RU')}`
    : 'Складская операция недоступна';
}

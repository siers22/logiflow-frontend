import test from 'node:test';
import assert from 'node:assert/strict';
import { referenceLabel, operationReferenceLabel } from '../src/lib/order-reference-labels.ts';

test('reference labels show names and never expose raw IDs as fallback', () => {
  const refs = { users: { u: 'Анна Смирнова' }, drivers: { d: 'Михаил Соколов' }, vehicles: { v: 'А101ДМ77 · Ford Transit' }, warehouses: { w: 'Московский склад' }, assignments: { a: 'Михаил Соколов · А101ДМ77' } };
  assert.equal(referenceLabel(refs, 'drivers', 'd'), 'Михаил Соколов');
  assert.equal(referenceLabel(refs, 'vehicles', 'v'), 'А101ДМ77 · Ford Transit');
  assert.equal(referenceLabel(refs, 'users', 'u'), 'Анна Смирнова');
  assert.equal(referenceLabel(refs, 'warehouses', 'w'), 'Московский склад');
  assert.equal(referenceLabel(refs, 'assignments', 'a'), 'Михаил Соколов · А101ДМ77');
  assert.equal(referenceLabel(refs, 'users', 'unavailable-id'), 'Имя недоступно');
  assert.equal(referenceLabel(null, 'drivers', 'unavailable-id'), 'Водитель недоступен');
  assert.equal(referenceLabel({ ...refs, users: { u: ' ' } }, 'users', 'u'), 'Имя недоступно');
});

test('operation reference shows its action and time instead of UUID', () => {
  const label = operationReferenceLabel([{ id: 'operation-uuid', operationType: 'unload', occurredAt: '2026-10-15T15:20:10Z' }], 'operation-uuid');
  assert.match(label, /^Разгрузка · /);
  assert.ok(!label.includes('operation-uuid'));
  assert.equal(operationReferenceLabel(null, 'unknown'), 'Складская операция недоступна');
});

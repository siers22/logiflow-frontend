import test from 'node:test';
import assert from 'node:assert/strict';
import {
  orderActions,
  planningActor,
  draftActor,
  submitBlockers,
  canResolveIncident,
} from '../src/lib/order-actions.ts';
import {
  validINN,
  counterpartyErrors,
  counterpartyPayload,
} from '../src/lib/counterparty-validation.ts';
const origin = { id: 'm1', role: 'manager', warehouseId: 'w1' },
  destination = { id: 'm2', role: 'manager', warehouseId: 'w2' },
  driver = { id: 'u', role: 'driver', driverId: 'd' },
  admin = { id: 'admin', role: 'admin' },
  client = { id: 'c', role: 'client' };
const order = {
  id: 'o',
  createdById: 'c',
  originWarehouseId: 'w1',
  destinationWarehouseId: 'w2',
  transportPolicyVersion: 1,
  status: 'assigned',
};
const trip = {
  id: 'a',
  driverId: 'd',
  status: 'accepted',
  offerExpiresAt: '2099-01-01T00:00:00Z',
};
const receive = { operationType: 'receive', assignmentId: null },
  load = { operationType: 'load', assignmentId: 'a' },
  unload = { operationType: 'unload', assignmentId: 'a', packageCount: 0 };
const run = (actor, patch = {}) =>
  orderActions({
    order,
    actor,
    assignment: trip,
    operations: [],
    incidents: [],
    receipt: null,
    ...patch,
  });
test('only origin manager and admin plan; only owner client edits draft', () => {
  assert.equal(planningActor(order, origin), true);
  assert.equal(planningActor(order, destination), false);
  assert.equal(planningActor(order, admin), true);
  assert.equal(planningActor(order, client), false);
  assert.equal(draftActor(order, client), true);
  assert.equal(draftActor(order, { ...client, id: 'stranger' }), false);
  assert.equal(run(destination).assign, false);
  assert.equal(run(origin).assign, true);
});
test('warehouse departure needs receive and effective load for the current trip', () => {
  assert.equal(run(driver).start, false);
  assert.equal(run(origin, { operations: [receive] }).load, true);
  assert.equal(run(destination, { operations: [receive] }).load, false);
  assert.equal(run(driver, { operations: [receive, load] }).start, true);
  assert.equal(
    run(driver, { operations: [receive, { ...load, assignmentId: 'old' }] })
      .start,
    false,
  );
  assert.equal(
    run(driver, {
      operations: [
        receive,
        load,
        { operationType: 'undo_load', assignmentId: 'a' },
      ],
    }).start,
    false,
  );
});
test('loading blocks cancellation/reassignment; undo_load remains possible with incidents', () => {
  const patch = {
    operations: [receive, load],
    incidents: [{ status: 'open' }],
  };
  assert.equal(run(origin, patch).cancel, false);
  assert.equal(run(origin, patch).assign, false);
  assert.equal(run(origin, patch).undoLoad, true);
  assert.equal(run(driver, patch).start, false);
});
test('destination manager receives and completes warehouse delivery; driver cannot', () => {
  const patch = {
    order: { ...order, status: 'arrived' },
    assignment: { ...trip, status: 'active' },
    operations: [receive, load, unload],
    receipt: { assignmentId: 'a' },
  };
  for (const actor of [destination, admin])
    assert.equal(run(actor, patch).complete, true);
  for (const actor of [origin, driver, client])
    assert.equal(run(actor, patch).complete, false);
  assert.equal(run(destination, { ...patch, receipt: null }).receipt, true);
  assert.equal(run(driver, { ...patch, receipt: null }).receipt, false);
  assert.equal(
    run(destination, { ...patch, operations: [receive, load] }).complete,
    false,
  );
  assert.equal(run(destination, { ...patch, receipt: null }).complete, false);
});
test('address delivery is completed by current driver, origin manager or admin', () => {
  const patch = {
    order: { ...order, destinationWarehouseId: null, status: 'arrived' },
    assignment: { ...trip, status: 'active' },
    receipt: { assignmentId: 'a' },
  };
  for (const actor of [driver, origin, admin])
    assert.equal(run(actor, patch).complete, true);
  for (const actor of [destination, client, { ...driver, driverId: 'old' }])
    assert.equal(run(actor, patch).complete, false);
});
test('legacy complete skips receipt but preserves unload, role and incident constraints', () => {
  const patch = {
    order: { ...order, transportPolicyVersion: 0, status: 'arrived' },
    assignment: { ...trip, status: 'active' },
    operations: [unload],
    receipt: null,
  };
  assert.equal(run(destination, patch).complete, true);
  assert.equal(run(driver, patch).complete, false);
  assert.equal(run(destination, { ...patch, operations: [] }).complete, false);
  assert.equal(
    run(destination, { ...patch, incidents: [{ status: 'open' }] }).complete,
    false,
  );
});
test('closed received cargo still allows return to sender, including zero actual cargo', () => {
  const patch = {
    order: { ...order, status: 'cancelled' },
    operations: [receive],
  };
  assert.equal(run(origin, patch).returnToSender, true);
  assert.equal(run(destination, patch).returnToSender, false);
  assert.equal(
    run(origin, {
      ...patch,
      operations: [
        receive,
        { operationType: 'return_to_sender', packageCount: 0 },
      ],
    }).returnToSender,
    false,
  );
});
test('failed prerequisites never authorize operations', () => {
  for (const patch of [
    { operations: null },
    { incidents: null },
    { receipt: undefined },
  ]) {
    const result = run(origin, patch);
    for (const action of [
      'receive',
      'load',
      'cancel',
      'assign',
      'reportIncident',
    ])
      assert.equal(result[action], false);
  }
});
test("expired and other drivers' offers cannot be accepted", () => {
  const patch = { assignment: { ...trip, status: 'pending_acceptance' } };
  assert.equal(run(driver, patch).accept, true);
  assert.equal(
    run(driver, {
      assignment: {
        ...patch.assignment,
        offerExpiresAt: '2000-01-01T00:00:00Z',
      },
    }).accept,
    false,
  );
  assert.equal(run({ ...driver, driverId: 'other' }, patch).accept, false);
  assert.equal(run(admin, patch).accept, false);
});
test('incident decisions belong to responsible warehouse or admin', () => {
  const incident = { status: 'open', warehouseId: 'w2' };
  assert.equal(canResolveIncident(incident, destination), true);
  assert.equal(canResolveIncident(incident, origin), false);
  assert.equal(
    canResolveIncident({ ...incident, warehouseId: null }, origin),
    false,
  );
  assert.equal(
    canResolveIncident({ ...incident, warehouseId: null }, admin),
    true,
  );
  assert.equal(
    canResolveIncident({ ...incident, status: 'resolved' }, admin),
    false,
  );
});
test('submit checks route and zero price without converting unknowns to zero', () => {
  const draft = {
      ...order,
      pickupFrom: '2026-10-11T10:00:00Z',
      pickupTo: '2026-10-11T11:00:00Z',
      totalPrice: 0,
      transportDetails: {},
    },
    route = { coordinates: [[0, 0]], distanceKm: 0, durationSec: 0 };
  assert.deepEqual(submitBlockers(draft, route), []);
  assert.equal(submitBlockers(draft, null).length, 1);
  assert.equal(
    submitBlockers({ ...draft, transportDetails: null }, route).length,
    1,
  );
  assert.equal(
    submitBlockers(
      { ...draft, transportPolicyVersion: 0, transportDetails: null },
      route,
    ).length,
    0,
  );
});
test('INN syntax uses both checksums and rejects all-zero values', () => {
  assert.equal(validINN('7707083893'), true);
  assert.equal(validINN('500100732259'), true);
  for (const value of [
    '7707083894',
    '500100732258',
    '0000000000',
    '123',
    'abcdefghij',
  ])
    assert.equal(validINN(value), false);
});
test('counterparty validation and payload avoid UI-only fields', () => {
  const base = {
    kind: 'individual',
    name: ' Иван ',
    address: ' Адрес ',
    contactName: ' Контакт ',
    phone: ' +7 ',
    shared: true,
    id: 'ui-only',
    createdAt: 'ui-only',
  };
  assert.deepEqual(counterpartyErrors(base), {});
  assert.deepEqual(counterpartyPayload(base, false), {
    kind: 'individual',
    name: 'Иван',
    address: 'Адрес',
    contactName: 'Контакт',
    inn: '',
    kpp: '',
    phone: '+7',
    email: '',
    status: 'active',
  });
  assert.ok(counterpartyErrors({ ...base, kind: 'organization' }).inn);
  assert.ok(counterpartyErrors({ ...base, phone: '' }).phone);
  assert.ok(counterpartyErrors({ ...base, kpp: '123456789' }).kpp);
});

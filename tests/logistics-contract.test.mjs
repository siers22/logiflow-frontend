import test from 'node:test';
import assert from 'node:assert/strict';
import { api, ApiError } from '../src/lib/api.ts';
import { documentFilename } from '../src/lib/documents.ts';
const entity = { id: 'entity-id', status: 'active' };
const response = (data, status = 200, requestID = 'request-1') =>
  new Response(
    JSON.stringify({ success: status < 400, status, data, requestID }),
    { status },
  );
async function withFetch(handler, work) {
  const previous = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    await work();
  } finally {
    globalThis.fetch = previous;
  }
}
const counterparty = {
  kind: 'individual',
  name: 'Иванов',
  address: 'Адрес',
  contactName: 'Иван',
  phone: '+7',
};
const transport = {
  senderId: 's',
  recipientId: 'r',
  carrierId: 'c',
  basisType: 'contract',
  basisNumber: '12',
  basisDate: '2026-10-11',
  packageCount: 2,
};
const receipt = {
  assignmentId: 'a',
  recipientName: 'Имя',
  recipientRole: 'Кладовщик',
  authorityBasis: 'Доверенность',
  packageCount: 0,
  cargoCondition: 'Не получен',
};
const operation = {
  operationType: 'unload',
  assignmentId: 'a',
  packageCount: 0,
  cargoCondition: 'Отсутствует',
};
const incident = {
  kind: 'quantity_discrepancy',
  description: 'Недостача',
  expectedPackages: 1,
  actualPackages: 0,
};
const resolve = { resolution: 'accept_discrepancy', note: 'Согласовано' };
const handover = {
  driverId: 'd',
  vehicleId: 'v',
  plannedTo: '2026-10-11T20:00:00Z',
  reason: 'Поломка',
  location: 'Адрес',
  cargoCondition: 'Целый',
};
const matrix = [
  [
    'orders.references',
    '/api/v1/orders/id/references',
    'GET',
    undefined,
    'references',
    { users: { u: 'Анна' }, drivers: {}, vehicles: {}, warehouses: {}, assignments: {} },
    () => api.orders.references('token', 'id'),
  ],
  [
    'counterparties.list',
    '/api/v1/counterparties?limit=20&offset=40&includeArchived=true',
    'GET',
    undefined,
    'counterparties',
    [entity],
    () =>
      api.counterparties.list('token', {
        limit: 20,
        offset: 40,
        includeArchived: true,
      }),
  ],
  [
    'counterparties.get',
    '/api/v1/counterparties/id',
    'GET',
    undefined,
    'counterparty',
    entity,
    () => api.counterparties.get('token', 'id'),
  ],
  [
    'counterparties.create',
    '/api/v1/counterparties',
    'POST',
    counterparty,
    'counterparty',
    entity,
    () => api.counterparties.create('token', counterparty),
  ],
  [
    'counterparties.update',
    '/api/v1/counterparties/id',
    'PUT',
    counterparty,
    'counterparty',
    entity,
    () => api.counterparties.update('token', 'id', counterparty),
  ],
  [
    'transport details',
    '/api/v1/orders/id/transport-details',
    'PUT',
    transport,
    'order',
    entity,
    () => api.orders.setTransportDetails('token', 'id', transport),
  ],
  [
    'receipt.get',
    '/api/v1/orders/id/delivery-receipt',
    'GET',
    undefined,
    'receipt',
    entity,
    () => api.deliveryReceipts.get('token', 'id'),
  ],
  [
    'receipt.create zero count',
    '/api/v1/orders/id/delivery-receipt',
    'POST',
    receipt,
    'receipt',
    entity,
    () => api.deliveryReceipts.create('token', 'id', receipt),
  ],
  [
    'operations.list',
    '/api/v1/orders/id/warehouse-operations',
    'GET',
    undefined,
    'operations',
    [entity],
    () => api.warehouseOperations.list('token', 'id'),
  ],
  [
    'operations.create zero count',
    '/api/v1/orders/id/warehouse-operations',
    'POST',
    operation,
    'operation',
    entity,
    () => api.warehouseOperations.create('token', 'id', operation),
  ],
  [
    'warehouse queue UUID',
    '/api/v1/warehouses/uuid/orders?includeClosed=false&limit=20&offset=0',
    'GET',
    undefined,
    'orders',
    [{ ...entity, warehouseStage: 'awaiting_return', openIncidentCount: 2 }],
    () =>
      api.warehouses.queue('token', 'uuid', {
        includeClosed: false,
        limit: 20,
        offset: 0,
      }),
  ],
  [
    'incidents.list',
    '/api/v1/orders/id/incidents',
    'GET',
    undefined,
    'incidents',
    [entity],
    () => api.incidents.list('token', 'id'),
  ],
  [
    'incidents.create zero actual',
    '/api/v1/orders/id/incidents',
    'POST',
    incident,
    'incident',
    entity,
    () => api.incidents.create('token', 'id', incident),
  ],
  [
    'incidents.resolve',
    '/api/v1/incidents/id/resolve',
    'POST',
    resolve,
    'incident',
    entity,
    () => api.incidents.resolve('token', 'id', resolve),
  ],
  [
    'dispatch.get',
    '/api/v1/orders/id/dispatch-recommendations',
    'GET',
    undefined,
    'success',
    { status: 'pending', candidates: [] },
    () => api.dispatch.get('token', 'id'),
  ],
  [
    'dispatch.refresh',
    '/api/v1/orders/id/dispatch-recommendations',
    'POST',
    undefined,
    'success',
    { status: 'ready', candidates: [] },
    () => api.dispatch.refresh('token', 'id'),
  ],
  [
    'handovers.incoming',
    '/api/v1/handovers/incoming',
    'GET',
    undefined,
    'handovers',
    [entity],
    () => api.handovers.incoming('token'),
  ],
  [
    'handovers.list',
    '/api/v1/orders/id/handovers',
    'GET',
    undefined,
    'handovers',
    [entity],
    () => api.handovers.list('token', 'id'),
  ],
  [
    'handovers.create',
    '/api/v1/orders/id/handovers',
    'POST',
    handover,
    'handover',
    entity,
    () => api.handovers.create('token', 'id', handover),
  ],
  [
    'handovers.confirmRelease',
    '/api/v1/handovers/id/confirm-release',
    'POST',
    undefined,
    'handover',
    entity,
    () => api.handovers.confirmRelease('token', 'id'),
  ],
  [
    'handovers.accept',
    '/api/v1/handovers/id/accept',
    'POST',
    undefined,
    'handover',
    entity,
    () => api.handovers.accept('token', 'id'),
  ],
  [
    'handovers.cancel',
    '/api/v1/handovers/id/cancel',
    'POST',
    undefined,
    'handover',
    entity,
    () => api.handovers.cancel('token', 'id'),
  ],
];
for (const [name, path, method, body, key, data, run] of matrix)
  test(name, async () => {
    await withFetch(
      async (url, init) => {
        assert.equal(url, path);
        assert.equal(init.method ?? 'GET', method);
        assert.deepEqual(init.body ? JSON.parse(init.body) : undefined, body);
        assert.equal(
          new Headers(init.headers).get('Authorization'),
          'Bearer token',
        );
        assert.equal(init.credentials, 'include');
        return response({ [key]: data });
      },
      async () => {
        const result = await run();
        assert.ok(result);
        if (Array.isArray(data)) assert.equal(result.length, 1);
      },
    );
  });
test('order retains destination, policy, snapshots and zero-valued cargo', async () => {
  const snapshot = {
    sender: counterparty,
    recipient: counterparty,
    carrier: counterparty,
    recordedByUserId: 'u',
    recordedAt: '2026-10-11T12:00:00Z',
  };
  await withFetch(
    async () =>
      response({
        success: {
          id: 'o',
          destinationWarehouseId: 'w',
          transportPolicyVersion: 1,
          transportDetails: snapshot,
          weightKg: 0,
          totalPrice: 0,
        },
      }),
    async () => {
      const order = await api.orders.get('token', 'o');
      assert.equal(order.destinationWarehouseId, 'w');
      assert.equal(order.transportPolicyVersion, 1);
      assert.deepEqual(order.transportDetails, snapshot);
      assert.equal(order.weightKg, 0);
      assert.equal(order.totalPrice, 0);
      assert.equal(order.cancelledAt, null);
    },
  );
});
test('nested driver and manager creation responses return the profile', async () => {
  await withFetch(
    async (url) =>
      response(
        url === '/api/drivers'
          ? {
              driver: {
                driver: { ID: 'd', UserID: 'u', LicenseNumber: '123' },
                user: { ID: 'u' },
              },
            }
          : {
              success: {
                manager: { ID: 'm', UserID: 'u', WarehouseID: 'w' },
                user: { ID: 'u' },
              },
            },
      ),
    async () => {
      assert.equal(
        (await api.drivers.create('token', {})).licenseNumber,
        '123',
      );
      assert.equal((await api.managers.create('token', {})).warehouseId, 'w');
    },
  );
});
test('assignment history and recommendation timestamps retain precision', async () => {
  const createdAt = '2026-10-11T12:01:02.123456Z';
  const data = {
    id: 'a',
    orderId: 'o',
    driverId: 'd',
    vehicleId: 'v',
    status: 'released',
    source: 'dispatch_recommendation',
    recommendationId: 'r',
    recommendationCreatedAt: createdAt,
    assignedAt: createdAt,
    acceptedAt: createdAt,
    releasedAt: createdAt,
    startedAt: createdAt,
    completedAt: null,
    recipientName: 'Иван',
    deliveryComment: 'Принято',
    rejectionReasonCode: 'other',
    rejectionComment: 'Причина',
    releaseReasonCode: 'handover',
    createdByUserId: 'm',
  };
  await withFetch(
    async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.recommendationCreatedAt, createdAt);
      return response({ assignment: data });
    },
    async () => {
      const value = await api.assignments.create('token', 'o', {
        driverId: 'd',
        vehicleId: 'v',
        plannedFrom: createdAt,
        plannedTo: createdAt,
        source: 'dispatch_recommendation',
        recommendationId: 'r',
        recommendationCreatedAt: createdAt,
      });
      for (const [key, expected] of Object.entries(data))
        assert.equal(value[key], expected);
      assert.equal(value.rejectedAt, null);
    },
  );
});
test('unknown distance differs from a real zero', async () => {
  let raw = { id: 'r' };
  await withFetch(
    async () => response({ route: raw }),
    async () => {
      const missing = await api.routes.get('token', 'o');
      assert.equal(missing.distanceKm, null);
      assert.equal(missing.durationSec, null);
      raw = { id: 'r', distanceKm: 0, durationSec: 0 };
      const zero = await api.routes.get('token', 'o');
      assert.equal(zero.distanceKm, 0);
      assert.equal(zero.durationSec, 0);
    },
  );
});
test('receipt absence is normal; authorization and server failures propagate', async () => {
  let status = 404;
  await withFetch(
    async () => response({ error: 'missing' }, status),
    async () => {
      assert.equal(await api.deliveryReceipts.get('token', 'o'), null);
      for (status of [403, 503])
        await assert.rejects(
          api.deliveryReceipts.get('token', 'o'),
          (error) => error instanceof ApiError && error.status === status,
        );
    },
  );
});
test('malformed lists and entities fail instead of fabricating empty data', async () => {
  let payload = { counterparties: {} };
  await withFetch(
    async () => response(payload),
    async () => {
      await assert.rejects(api.counterparties.list('token'), ApiError);
      payload = {};
      await assert.rejects(api.counterparties.list('token'), ApiError);
      payload = { counterparties: null };
      assert.deepEqual(await api.counterparties.list('token'), []);
      payload = { counterparty: {} };
      await assert.rejects(api.counterparties.get('token', 'id'), ApiError);
    },
  );
});
test('business errors retain code and diagnostic request ID', async () => {
  await withFetch(
    async () => response({ error: 'INCIDENT_OPEN' }, 409, 'req-diagnostic'),
    async () => {
      await assert.rejects(api.orders.submit('token', 'o'), (error) => {
        assert.equal(error.code, 'INCIDENT_OPEN');
        assert.equal(error.requestID, 'req-diagnostic');
        assert.equal(error.section, 'incidents');
        assert.match(error.userMessage, /проблема/);
        return true;
      });
    },
  );
});
test('cancel, reject and legacy complete preserve optional payload fields', async () => {
  const bodies = [];
  await withFetch(
    async (url, init) => {
      bodies.push(JSON.parse(init.body));
      return response(
        url.includes('cancel') ? { order: entity } : { assignment: entity },
      );
    },
    async () => {
      await api.orders.cancel('token', 'o', {
        reasonCode: 'other',
        comment: 'Причина',
      });
      await api.assignments.reject('token', 'a', 'other', 'Комментарий');
      await api.assignments.complete('token', 'a', {
        recipientName: 'Иван',
        comment: 'Принято',
      });
      await api.assignments.complete('token', 'a');
      assert.deepEqual(bodies, [
        { reasonCode: 'other', comment: 'Причина' },
        { reasonCode: 'other', comment: 'Комментарий' },
        { recipientName: 'Иван', comment: 'Принято' },
        {},
      ]);
    },
  );
});
test('all six document types and repeated trip assignments remain distinct', async () => {
  const documents = [
    'transport_order',
    'trip_assignment',
    'cargo_handover',
    'delivery_confirmation',
    'service_report',
    'cancellation_notice',
    'trip_assignment',
  ].map((type, index) => ({ id: String(index), order_id: 'o', type }));
  await withFetch(
    async () => response({ success: documents }),
    async () => {
      assert.deepEqual(await api.documents.list('token'), documents);
      assert.equal(documentFilename(documents[4]), 'service_report-4.pdf');
    },
  );
});
test('XLSX downloads preserve binary bytes and report filters', async () => {
  await withFetch(
    async (url) => {
      assert.equal(url, '/api/reports/orders?status=completed&warehouseId=w');
      return new Response(new Uint8Array([80, 75, 3, 4, 0, 255]));
    },
    async () => {
      assert.deepEqual(
        [
          ...new Uint8Array(
            await (
              await api.reports.orders('token', {
                status: 'completed',
                warehouseId: 'w',
              })
            ).arrayBuffer(),
          ),
        ],
        [80, 75, 3, 4, 0, 255],
      );
    },
  );
});

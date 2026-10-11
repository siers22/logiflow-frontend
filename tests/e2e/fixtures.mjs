export const party = (id, name) => ({
  id,
  ownerUserId: 'client-user',
  kind: 'organization',
  name,
  inn: '7707083893',
  kpp: '',
  address: 'Москва',
  contactName: 'Контакт',
  phone: '+7',
  email: '',
  shared: true,
  status: 'active',
  createdAt: '2026-10-11T10:00:00Z',
  updatedAt: '2026-10-11T10:00:00Z',
});
export const parties = [
  party('sender', 'Отправитель ООО'),
  party('recipient', 'Получатель ООО'),
  party('carrier', 'Перевозчик ООО'),
];
export const details = {
  sender: parties[0],
  recipient: parties[1],
  carrier: parties[2],
  basisType: 'contract',
  basisNumber: '123',
  basisDate: '2026-10-11',
  packageCount: 2,
  terms: '',
  recordedByUserId: 'client-user',
  recordedAt: '2026-10-11T10:00:00Z',
};
export async function setup(
  page,
  {
    role = 'client',
    warehouseId = 'w1',
    status = 'draft',
    operations = [],
    receipt = null,
    transportDetails = details,
    assignmentStatus = 'accepted',
    recommendations = { status: 'unavailable', candidates: [] },
    handovers = [],
  } = {},
) {
  page.on('pageerror', (error) =>
    console.error('Browser exception:', error.stack),
  );
  const state = {
    order: {
      id: 'order-1',
      createdById: 'client-user',
      originWarehouseId: 'w1',
      destinationWarehouseId: 'w2',
      originAddress: 'Москва',
      destinationAddress: 'Казань',
      status,
      totalPrice: 0,
      weightKg: 100,
      volumeM3: 1,
      pickupFrom: '2099-01-01T10:00:00Z',
      pickupTo: '2099-01-01T12:00:00Z',
      createdAt: '2026-10-11T10:00:00Z',
      arrivedAt: '2026-10-11T10:00:00Z',
      transportPolicyVersion: 1,
      transportDetails,
    },
    assignments: ['assigned', 'in_transit', 'arrived'].includes(status)
      ? [
          {
            id: 'trip-1',
            orderId: 'order-1',
            driverId: 'driver-1',
            vehicleId: 'vehicle-1',
            status: assignmentStatus,
            offerExpiresAt: '2099-01-01T10:00:00Z',
            plannedFrom: '2099-01-01T10:00:00Z',
            plannedTo: '2099-01-01T12:00:00Z',
          },
        ]
      : [],
    operations,
    incidents: [],
    receipt,
    parties: [...parties],
    handovers,
    calls: [],
  };
  await page.route('**/api/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      method = req.method();
    const body = req.postData() ? JSON.parse(req.postData()) : {};
    state.calls.push({ path, method, body });
    const userId = role === 'client' ? 'client-user' : `${role}-user`;
    const send = (data, statusCode = 200) =>
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({
          status: statusCode,
          success: statusCode < 400,
          requestID: 'fixture',
          data,
        }),
      });
    if (path === '/api/auth/refresh')
      return send({
        auth: {
          access_token: 'fixture-token',
          expires_in: 3600,
          user: {
            ID: userId,
            Role: role,
            FullName: 'Тестовый пользователь',
            Email: 'fixture@example.test',
            Slug: 'user-slug',
          },
        },
      });
    if (path === '/api/notifications') return send({ success: [] });
    if (path === '/api/managers')
      return send({
        success: [
          { ID: 'manager-profile', UserID: userId, WarehouseID: warehouseId },
        ],
      });
    if (path === '/api/drivers')
      return send({
        success: [
          {
            ID: 'driver-1',
            UserID: 'driver-user',
            LicenseNumber: '123',
            Status: 'available',
            VehicleID: 'profile-vehicle',
          },
        ],
      });
    if (path === '/api/vehicles')
      return send({
        success: [
          { ID: 'vehicle-1', PlateNumber: 'А001АА', Status: 'available' },
        ],
      });
    if (path === '/api/warehouses')
      return send({
        success: [
          {
            ID: 'w1',
            Name: 'Отправление',
            Address: 'Москва',
            Latitude: 0,
            Longitude: 0,
            Status: 'active',
          },
          {
            ID: 'w2',
            Name: 'Назначение',
            Address: 'Казань',
            Latitude: 55,
            Longitude: 49,
            Status: 'active',
          },
        ],
      });
    if (path === '/api/v1/documents') return send({ success: [] });
    if (path === '/api/v1/counterparties') {
      if (method === 'POST') {
        const value = {
          ...party(`new-${state.parties.length}`, body.name),
          ...body,
          ownerUserId: userId,
        };
        state.parties.push(value);
        return send({ counterparty: value }, 201);
      }
      return send({ counterparties: state.parties });
    }
    if (path === '/api/v1/orders') {
      if (method === 'POST') {
        state.order = {
          ...state.order,
          ...body,
          status: 'draft',
          transportDetails: null,
        };
        return send({ order: { order: state.order } }, 201);
      }
      return send({ success: [state.order] });
    }
    if (path === '/api/v1/orders/order-1')
      return send({ success: state.order });
    if (path === '/api/orders/order-1/route')
      return send({
        route: {
          id: 'route-1',
          coordinates: [
            [37, 55],
            [49, 55],
          ],
          currentIndex: 0,
          distanceKm: 0,
          durationSec: 0,
        },
      });
    if (path === '/api/v1/orders/order-1/transport-details') {
      state.order.transportDetails = {
        ...body,
        sender: state.parties.find((p) => p.id === body.senderId),
        recipient: state.parties.find((p) => p.id === body.recipientId),
        carrier: state.parties.find((p) => p.id === body.carrierId),
        recordedByUserId: userId,
        recordedAt: '2026-10-11T10:00:00Z',
      };
      return send({ order: state.order });
    }
    if (path === '/api/v1/orders/order-1/submit') {
      state.order.status = 'ready_for_dispatch';
      return send({ order: state.order });
    }
    if (path.endsWith('/assignments') && role === 'client')
      return send({ error: 'FORBIDDEN_ACTOR' }, 403);
    if (path === '/api/v1/orders/order-1/assignments' && method === 'POST') {
      const value = {
        ...body,
        id: 'trip-new',
        orderId: 'order-1',
        status: 'pending_acceptance',
        offerExpiresAt: '2099-01-01T10:00:00Z',
      };
      state.assignments = [value];
      state.order.status = 'assigned';
      return send({ assignment: value });
    }
    if (
      path === '/api/v1/orders/order-1/assignments' ||
      path === '/api/v1/assignments'
    )
      return send({ assignments: state.assignments });
    if (path === '/api/v1/orders/order-1/warehouse-operations') {
      if (method === 'POST') {
        const value = {
          ...body,
          id: `operation-${state.operations.length}`,
          orderId: state.order.id,
          warehouseId,
          createdByUserId: userId,
          occurredAt: '2026-10-11T10:00:00Z',
        };
        state.operations.push(value);
        if (value.packageCount !== 2)
          state.incidents.push({
            id: 'incident-1',
            orderId: state.order.id,
            warehouseId,
            kind: 'quantity_discrepancy',
            expectedPackages: 2,
            actualPackages: value.packageCount,
            status: 'open',
            description: 'Автоматическая недостача',
            reportedByUserId: userId,
            reportedAt: '2026-10-11T10:00:00Z',
          });
        await new Promise((resolve) => setTimeout(resolve, 150));
        return send({ operation: value }, 201);
      }
      return send({ operations: state.operations });
    }
    if (path === '/api/v1/orders/order-1/incidents')
      return send({ incidents: state.incidents });
    if (path === '/api/v1/incidents/incident-1/resolve') {
      const value = state.incidents[0];
      Object.assign(value, {
        status: 'resolved',
        resolution: body.resolution,
        resolutionNote: body.note,
        resolvedByUserId: userId,
        resolvedAt: '2026-10-11T10:00:00Z',
      });
      return send({ incident: value });
    }
    if (path === '/api/v1/orders/order-1/delivery-receipt') {
      if (method === 'POST') {
        state.receipt = {
          ...body,
          id: 'receipt-1',
          orderId: state.order.id,
          receivedAt: '2026-10-11T10:00:00Z',
          recordedAt: '2026-10-11T10:00:00Z',
          recordedByUserId: userId,
        };
        if (state.receiptConflict)
          return send({ error: 'DELIVERY_RECEIPT_CONFLICT' }, 409);
        return send({ receipt: state.receipt }, 201);
      }
      return state.receipt
        ? send({ receipt: state.receipt })
        : send({ error: 'missing' }, 404);
    }
    if (path === '/api/v1/assignments/trip-1/complete') {
      state.order.status = 'completed';
      state.assignments[0].status = 'completed';
      return send({ assignment: state.assignments[0] });
    }
    if (path === '/api/v1/handovers/handover-1/confirm-release') {
      state.handovers[0].outgoingConfirmedAt = '2026-10-11T12:00:00Z';
      return send({ handover: state.handovers[0] });
    }
    if (path === '/api/v1/handovers/handover-1/accept') {
      state.handovers[0].status = 'completed';
      state.handovers[0].nextAssignmentId = 'trip-new';
      state.assignments[0].status = 'released';
      state.assignments.push({
        ...state.assignments[0],
        id: 'trip-new',
        status: 'active',
        vehicleId: 'vehicle-new',
      });
      return send({ handover: state.handovers[0] });
    }
    if (path === '/api/v1/orders/order-1/handovers')
      return send({ handovers: state.handovers });
    if (path === '/api/v1/orders/order-1/dispatch-recommendations')
      return send({ success: recommendations });
    return send({ error: `Unhandled fixture: ${method} ${path}` }, 500);
  });
  return state;
}

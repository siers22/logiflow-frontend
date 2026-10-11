import type {
  Order,
  Assignment,
  Route,
  DeliveryReceipt,
  WarehouseOperation,
  OrderIncident,
} from './api.ts';
export interface Actor {
  id: string;
  role: string;
  warehouseId?: string | null;
  driverId?: string | null;
}
export function planningActor(order: Order, actor: Actor): boolean {
  return (
    actor.role === 'admin' ||
    (actor.role === 'manager' &&
      !!actor.warehouseId &&
      order.originWarehouseId === actor.warehouseId)
  );
}
export function draftActor(order: Order, actor: Actor): boolean {
  return (
    planningActor(order, actor) ||
    (actor.role === 'client' && order.createdById === actor.id)
  );
}
export function submitBlockers(order: Order, route: Route | null): string[] {
  const reasons: string[] = [];
  if (
    !order.pickupFrom ||
    !order.pickupTo ||
    !(Date.parse(order.pickupFrom) < Date.parse(order.pickupTo))
  )
    reasons.push('Укажите корректное окно забора груза.');
  if (order.totalPrice == null) reasons.push('Стоимость ещё не рассчитана.');
  if (
    !route ||
    route.distanceKm == null ||
    route.durationSec == null ||
    !route.coordinates.length
  )
    reasons.push('Маршрут ещё не рассчитан. Обновите данные.');
  if (order.transportPolicyVersion === 1 && !order.transportDetails)
    reasons.push('Сохраните реквизиты перевозки.');
  return reasons;
}
export function orderActions(input: {
  order: Order;
  actor: Actor;
  assignment: Assignment | null;
  operations: WarehouseOperation[] | null;
  receipt: DeliveryReceipt | null | undefined;
  incidents: OrderIncident[] | null;
  now?: number;
}) {
  const {
    order: o,
    actor: a,
    assignment: trip,
    operations: ops,
    receipt,
    incidents,
  } = input;
  const ready = ops !== null && incidents !== null && receipt !== undefined;
  const origin =
    !!o.originWarehouseId &&
    (a.role === 'admin' ||
      (a.role === 'manager' && a.warehouseId === o.originWarehouseId));
  const destination =
    !!o.destinationWarehouseId &&
    (a.role === 'admin' ||
      (a.role === 'manager' && a.warehouseId === o.destinationWarehouseId));
  const owner = a.role === 'client' && a.id === o.createdById;
  const mine =
    a.role === 'driver' && !!a.driverId && trip?.driverId === a.driverId;
  const has = (
    kind: WarehouseOperation['operationType'],
    assignmentId?: string,
  ) =>
    ops?.some(
      (op) =>
        op.operationType === kind &&
        (assignmentId === undefined || op.assignmentId === assignmentId),
    ) ?? false;
  const loaded = !!trip && has('load', trip.id) && !has('undo_load', trip.id);
  const open = incidents?.some((i) => i.status === 'open') ?? true;
  const receiptActor =
    a.role === 'admin' ||
    (o.destinationWarehouseId ? destination : planningActor(o, a) || mine);
  const current =
    !!trip && (trip.status === 'accepted' || trip.status === 'active');
  const arrived = o.status === 'arrived' && trip?.status === 'active';
  const unloaded =
    !o.destinationWarehouseId || (!!trip && has('unload', trip.id));
  const unexpired =
    !!trip && Date.parse(trip.offerExpiresAt) > (input.now ?? Date.now());
  return {
    edit: o.status === 'draft' && draftActor(o, a),
    cancel:
      ready &&
      !loaded &&
      ((owner && ['draft', 'ready_for_dispatch'].includes(o.status)) ||
        (planningActor(o, a) &&
          ['draft', 'ready_for_dispatch', 'assigned'].includes(o.status))),
    assign:
      ready &&
      planningActor(o, a) &&
      !loaded &&
      ['ready_for_dispatch', 'assigned'].includes(o.status),
    receive:
      ready &&
      origin &&
      ['ready_for_dispatch', 'assigned'].includes(o.status) &&
      !has('receive'),
    load:
      ready &&
      origin &&
      o.status === 'assigned' &&
      trip?.status === 'accepted' &&
      has('receive') &&
      !loaded &&
      !open,
    undoLoad:
      ready &&
      origin &&
      o.status === 'assigned' &&
      trip?.status === 'accepted' &&
      loaded,
    unload:
      ready && destination && arrived && !!trip && !has('unload', trip.id),
    returnToSender:
      ready &&
      origin &&
      o.status === 'cancelled' &&
      has('receive') &&
      !has('return_to_sender'),
    accept:
      mine &&
      o.status === 'assigned' &&
      trip?.status === 'pending_acceptance' &&
      unexpired,
    reject:
      mine &&
      o.status === 'assigned' &&
      trip?.status === 'pending_acceptance' &&
      unexpired,
    start:
      ready &&
      mine &&
      o.status === 'assigned' &&
      trip?.status === 'accepted' &&
      !open &&
      (!o.originWarehouseId || loaded),
    arrive:
      ready && mine && o.status === 'in_transit' && trip?.status === 'active',
    receipt: ready && arrived && receiptActor && unloaded && !receipt,
    complete:
      ready &&
      arrived &&
      receiptActor &&
      unloaded &&
      !open &&
      (o.transportPolicyVersion === 0 ||
        (!!receipt && receipt.assignmentId === trip?.id)),
    reportIncident:
      ready &&
      ['ready_for_dispatch', 'assigned', 'in_transit', 'arrived'].includes(
        o.status,
      ) &&
      (owner || planningActor(o, a) || destination || (mine && current)),
    handover: ready && planningActor(o, a) && o.status === 'in_transit',
    loaded,
    openIncidents: open,
  };
}
export function canResolveIncident(
  incident: OrderIncident,
  actor: Actor,
): boolean {
  return (
    incident.status === 'open' &&
    (actor.role === 'admin' ||
      (actor.role === 'manager' &&
        !!actor.warehouseId &&
        incident.warehouseId === actor.warehouseId))
  );
}

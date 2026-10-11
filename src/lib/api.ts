import { ApiError } from './api-errors.ts';
import type {
  Counterparty,
  CounterpartyWrite,
  TransportDetails,
  TransportDetailsWrite,
  DeliveryReceipt,
  DeliveryReceiptCreate,
  WarehouseOperation,
  WarehouseOperationCreate,
  WarehouseStage,
  OrderIncident,
  OrderIncidentCreate,
  OrderIncidentResolve,
  TripHandover,
  TripHandoverCreate,
  DispatchRecommendations,
  DocumentType,
} from '../types/logistics.ts';
export { ApiError } from './api-errors.ts';
export type * from '../types/logistics.ts';

const API_BASE = '/api';

export interface ApiResponse<T = unknown> {
  status: number;
  success: boolean;
  requestID: string;
  data: Record<string, T> | null;
}

export interface BackendUser {
  ID: string;
  Email: string;
  Slug: string;
  FullName: string;
  AvatarURL: string;
  Role: string;
  CreatedAt: string;
  UpdatedAt: string;
  LastLoginAt: string | null;
}

export interface AuthData {
  access_token: string;
  expires_in: number;
  user: BackendUser;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  if (options.body != null && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // для refresh_token cookie
    headers,
  });

  const body = await res.text();
  if (!body.trim()) {
    if (!res.ok)
      throw new ApiError(res.status, res.statusText || `HTTP ${res.status}`);
    return { status: res.status, success: true, requestID: '', data: null };
  }

  let data: ApiResponse<T>;
  try {
    data = JSON.parse(body) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, 'Ошибка при разборе ответа сервера');
  }

  if (!res.ok || !data || data.success !== true) {
    const errData = data?.data as Record<string, unknown> | null | undefined;
    const message =
      (errData?.['error'] as string | undefined) ||
      (data as { message?: string } | null)?.message ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiError(
      res.status,
      message,
      typeof errData?.error === 'string' ? errData.error : null,
      data?.requestID ?? res.headers.get('X-Request-ID'),
    );
  }

  return data;
}

// ─── Mappers (legacy PascalCase and current camelCase JSON) ──────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function str(v: any): string {
  return v ?? '';
}

function nullable<T>(v: T | null | undefined): T | null {
  return v ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function num(v: any): number | null {
  return v ?? null;
}

// ─── Driver ───────────────────────────────────────────────────────────────────

export type DriverStatus = 'available' | 'on_route' | 'off_duty';

export interface Driver {
  id: string;
  userId: string;
  vehicleId: string | null;
  licenseNumber: string;
  licenseExpiry: string;
  rating: number;
  slug: string;
  status: DriverStatus;
}

export interface DriverCreate {
  email: string;
  password: string;
  fullName: string;
  vehicleId?: string | null;
  licenseNumber: string;
  licenseExpiry: string;
}

export interface DriverUpdate {
  vehicleId?: string | null;
  licenseNumber?: string;
  licenseExpiry?: string;
  status?: DriverStatus;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export type VehicleStatus = 'available' | 'in_transit' | 'maintenance';

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  capacityKg: number | null;
  capacityM3: number | null;
  status: VehicleStatus;
  slug: string;
}

export interface VehicleCreate {
  plateNumber: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacityKg?: number | null;
  capacityM3?: number | null;
}

export interface VehicleUpdate {
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacityKg?: number | null;
  capacityM3?: number | null;
  status?: VehicleStatus;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: 'registration';
  number: string;
  validUntil: string;
  status: 'valid' | 'suspended' | 'expired';
}

// ─── Warehouse ────────────────────────────────────────────────────────────────

export type WarehouseStatus = 'active' | 'inactive';

export interface Warehouse {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  status: WarehouseStatus;
  createdAt: string;
}

export interface WarehouseCreate {
  name: string;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface WarehouseUpdate {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: WarehouseStatus;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'ready_for_dispatch'
  | 'assigned'
  | 'in_transit'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  createdById: string | null;
  driverId: string | null;
  managerId: string | null;
  originWarehouseId: string | null;
  originAddress: string | null;
  destinationAddress: string;
  destinationWarehouseId: string | null;
  transportPolicyVersion: number;
  transportDetails: TransportDetails | null;
  cargoDescription: string | null;
  weightKg: number | null;
  volumeM3: number | null;
  status: OrderStatus;
  totalPrice: number | null;
  createdAt: string;
  assignedAt: string | null;
  deliveredAt: string | null;
  pickupFrom: string | null;
  pickupTo: string | null;
  submittedAt: string | null;
  startedAt: string | null;
  arrivedAt: string | null;
  cancelledAt: string | null;
}

export interface OrderCreate {
  originWarehouseId?: string | null;
  originAddress?: string | null;
  destinationAddress?: string | null;
  cargoDescription?: string | null;
  weightKg?: number | null;
  volumeM3?: number | null;
  destinationWarehouseId?: string | null;
  pickupFrom?: string | null;
  pickupTo?: string | null;
}

export interface OrderDraftUpdate {
  cargoDescription?: string;
  weightKg?: number;
  volumeM3?: number;
  pickupFrom?: string;
  pickupTo?: string;
}

export type AssignmentStatus =
  | 'pending_acceptance'
  | 'accepted'
  | 'active'
  | 'rejected'
  | 'released'
  | 'expired'
  | 'completed';
export interface Assignment {
  id: string;
  orderId: string;
  driverId: string;
  vehicleId: string;
  status: AssignmentStatus;
  plannedFrom: string;
  plannedTo: string;
  offerExpiresAt: string;
  createdByUserId: string;
  source: 'manual' | 'dispatch_recommendation';
  recommendationId: string | null;
  recommendationCreatedAt: string | null;
  assignedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  releasedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recipientName: string | null;
  deliveryComment: string | null;
  rejectionReasonCode: string | null;
  rejectionComment: string | null;
  releaseReasonCode: string | null;
}
export interface AssignmentCreate {
  driverId: string;
  vehicleId: string;
  plannedFrom: string;
  plannedTo: string;
  replacesAssignmentId?: string;
  source?: 'manual' | 'dispatch_recommendation';
  recommendationId?: string;
  recommendationCreatedAt?: string;
}

export interface ListOrdersParams {
  status?: OrderStatus;
  driverId?: string;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export type Coordinate = [number, number]; // [longitude, latitude]

export type RouteStatus = 'pending' | 'active' | 'finished';

export interface Route {
  id: string;
  orderId: string;
  driverId: string | null;
  coordinates: Coordinate[];
  currentIndex: number;
  startedAt: string | null;
  finishedAt: string | null;
  distanceKm: number | null;
  durationSec: number | null;
  status: RouteStatus;
}

export interface RoutePosition {
  currentIndex: number;
  coordinate: Coordinate;
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export interface Manager {
  id: string;
  userId: string;
  warehouseId: string | null;
  slug: string;
}

export interface ManagerCreate {
  email: string;
  password: string;
  fullName: string;
  warehouseId: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface OrdersReportParams {
  from?: string;
  to?: string;
  status?: OrderStatus;
  driverId?: string;
  warehouseId?: string;
}

export interface OrdersReport {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averagePrice: number;
  orders: Order[];
}

export interface DashboardReport {
  revenue: { total: number; thisMonth: number };
  orders: {
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
    cancelled: number;
  };
  drivers: Array<{
    id: string;
    fullName: string;
    status: DriverStatus;
    rating: number;
    completedOrders: number;
  }>;
}

export interface InboxDocument {
  id: string;
  order_id: string;
  type: DocumentType;
  title: string;
  created_at: string;
  size_bytes: number;
}

async function download(path: string, accessToken: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;
    let code: string | null = null,
      requestID: string | null = res.headers.get('X-Request-ID');
    try {
      const payload = await res.json();
      message = payload?.data?.error ?? payload?.message ?? message;
      code =
        typeof payload?.data?.error === 'string' ? payload.data.error : null;
      requestID = payload?.requestID ?? requestID;
    } catch {
      /* The server may return a non-JSON error for binary downloads. */
    }
    throw new ApiError(res.status, message, code, requestID);
  }
  return res.blob();
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  documentId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDriver(r: any): Driver {
  if (!r || typeof (r.ID ?? r.id) !== 'string' || !(r.ID ?? r.id))
    throw new ApiError(502, 'Некорректный ответ: driver без ID');
  return {
    id: str(r.ID ?? r.id),
    userId: str(r.UserID ?? r.userId),
    vehicleId: nullable(r.VehicleID ?? r.vehicleId),
    licenseNumber: str(r.LicenseNumber ?? r.licenseNumber),
    licenseExpiry: str(r.LicenseExpiry ?? r.licenseExpiry),
    rating: r.Rating ?? r.rating ?? 0,
    slug: str(r.Slug ?? r.slug),
    status: (r.Status ?? r.status) as DriverStatus,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVehicle(r: any): Vehicle {
  if (!r || typeof (r.ID ?? r.id) !== 'string' || !(r.ID ?? r.id))
    throw new ApiError(502, 'Некорректный ответ: vehicle без ID');
  return {
    id: str(r.ID ?? r.id),
    plateNumber: str(r.PlateNumber ?? r.plateNumber),
    brand: nullable(r.Brand ?? r.brand),
    model: nullable(r.Model ?? r.model),
    year: nullable(r.Year ?? r.year),
    capacityKg: num(r.CapacityKg ?? r.capacityKg),
    capacityM3: num(r.CapacityM3 ?? r.capacityM3),
    status: (r.Status ?? r.status) as VehicleStatus,
    slug: str(r.Slug ?? r.slug),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWarehouse(r: any): Warehouse {
  if (!r || typeof (r.ID ?? r.id) !== 'string' || !(r.ID ?? r.id))
    throw new ApiError(502, 'Некорректный ответ: warehouse без ID');
  return {
    id: str(r.ID ?? r.id),
    slug: str(r.Slug ?? r.slug),
    name: str(r.Name ?? r.name),
    address: str(r.Address ?? r.address),
    city: nullable(r.City || r.city || null),
    latitude: nullable(r.Latitude ?? r.latitude),
    longitude: nullable(r.Longitude ?? r.longitude),
    status: (r.Status ?? r.status) as WarehouseStatus,
    createdAt: str(r.CreatedAt ?? r.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(r: any): Order {
  if (!r || typeof (r.ID ?? r.id) !== 'string' || !(r.ID ?? r.id))
    throw new ApiError(502, 'Некорректный ответ: order без ID');
  return {
    id: str(r.ID ?? r.id),
    createdById: nullable(r.CreatedByID ?? r.createdById),
    driverId: nullable(r.DriverID ?? r.driverId),
    managerId: nullable(r.ManagerID ?? r.managerId),
    originWarehouseId: nullable(r.OriginWarehouseID ?? r.originWarehouseId),
    originAddress: nullable(r.OriginAddress || r.originAddress || null),
    destinationAddress: str(r.DestinationAddress ?? r.destinationAddress),
    destinationWarehouseId: nullable(
      r.DestinationWarehouseID ?? r.destinationWarehouseId,
    ),
    transportPolicyVersion:
      r.TransportPolicyVersion ?? r.transportPolicyVersion ?? 0,
    transportDetails: nullable(r.TransportDetails ?? r.transportDetails),
    cargoDescription: nullable(
      r.CargoDescription || r.cargoDescription || null,
    ),
    weightKg: num(r.WeightKg ?? r.weightKg),
    volumeM3: num(r.VolumeM3 ?? r.volumeM3),
    status: (r.Status ?? r.status) as OrderStatus,
    totalPrice: num(r.TotalPrice ?? r.totalPrice),
    createdAt: str(r.CreatedAt ?? r.createdAt),
    assignedAt: nullable(r.AssignedAt ?? r.assignedAt),
    deliveredAt: nullable(r.DeliveredAt ?? r.deliveredAt),
    pickupFrom: nullable(r.PickupFrom ?? r.pickupFrom),
    pickupTo: nullable(r.PickupTo ?? r.pickupTo),
    submittedAt: nullable(r.SubmittedAt ?? r.submittedAt),
    startedAt: nullable(r.StartedAt ?? r.startedAt),
    arrivedAt: nullable(r.ArrivedAt ?? r.arrivedAt),
    cancelledAt: nullable(r.CancelledAt ?? r.cancelledAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAssignment(r: any): Assignment {
  if (!r || typeof (r.ID ?? r.id) !== 'string' || !(r.ID ?? r.id))
    throw new ApiError(502, 'Некорректный ответ: assignment без ID');
  return {
    id: str(r.id),
    orderId: str(r.orderId),
    driverId: str(r.driverId),
    vehicleId: str(r.vehicleId),
    status: r.status as AssignmentStatus,
    plannedFrom: str(r.plannedFrom),
    plannedTo: str(r.plannedTo),
    offerExpiresAt: str(r.offerExpiresAt),
    createdByUserId: str(r.createdByUserId),
    source: r.source ?? 'manual',
    recommendationId: nullable(r.recommendationId),
    recommendationCreatedAt: nullable(r.recommendationCreatedAt),
    assignedAt: str(r.assignedAt),
    acceptedAt: nullable(r.acceptedAt),
    rejectedAt: nullable(r.rejectedAt),
    releasedAt: nullable(r.releasedAt),
    startedAt: nullable(r.startedAt),
    completedAt: nullable(r.completedAt),
    recipientName: nullable(r.recipientName),
    deliveryComment: nullable(r.deliveryComment),
    rejectionReasonCode: nullable(r.rejectionReasonCode),
    rejectionComment: nullable(r.rejectionComment),
    releaseReasonCode: nullable(r.releaseReasonCode),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapManager(r: any): Manager {
  if (!r || typeof (r.ID ?? r.id) !== 'string' || !(r.ID ?? r.id))
    throw new ApiError(502, 'Некорректный ответ: manager без ID');
  return {
    id: str(r.ID ?? r.id),
    userId: str(r.UserID ?? r.userId),
    warehouseId: nullable(r.WarehouseID ?? r.warehouseId),
    slug: str(r.Slug ?? r.slug),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRoute(r: any): Route {
  if (!r || typeof (r.ID ?? r.id) !== 'string' || !(r.ID ?? r.id))
    throw new ApiError(502, 'Некорректный ответ: route без ID');
  return {
    id: str(r.ID ?? r.id),
    orderId: str(r.OrderID ?? r.orderId),
    driverId: nullable(r.DriverID ?? r.driverId),
    coordinates: (r.Coordinates ?? r.coordinates ?? []) as Coordinate[],
    currentIndex: r.CurrentIndex ?? r.currentIndex ?? 0,
    startedAt: nullable(r.StartedAt ?? r.startedAt),
    finishedAt: nullable(r.FinishedAt ?? r.finishedAt),
    distanceKm: num(r.DistanceKm ?? r.distanceKm),
    durationSec: num(r.DurationSec ?? r.durationSec),
    status: (r.Status ?? r.status ?? 'pending') as RouteStatus,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(r: any): Notification {
  if (!r || typeof (r.ID ?? r.id) !== 'string' || !(r.ID ?? r.id))
    throw new ApiError(502, 'Некорректный ответ: notification без ID');
  return {
    id: str(r.ID ?? r.id),
    userId: str(r.UserID ?? r.userId),
    title: str(r.Title ?? r.title),
    body: nullable(r.Body ?? r.body),
    isRead: r.IsRead ?? r.isRead ?? false,
    createdAt: str(r.CreatedAt ?? r.createdAt),
    documentId: nullable(r.DocumentID ?? r.documentId),
  };
}

export interface WarehouseQueueItem extends Order {
  warehouseStage: WarehouseStage;
  openIncidentCount: number;
}
function entity(response: unknown, key: string): Record<string, unknown> {
  const record = response as { data?: Record<string, unknown> };
  const value = record?.data
    ? record.data[key]
    : (response as Record<string, unknown>)?.[key];
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError(502, `Некорректный ответ: ${key}`);
  return value as Record<string, unknown>;
}
function list<T>(response: ApiResponse<unknown>, key: string): T[] {
  const value = response.data?.[key];
  if (value === null) return [];
  if (!Array.isArray(value))
    throw new ApiError(
      502,
      `Некорректный список: ${key}`,
      null,
      response.requestID,
    );
  return value as T[];
}
function queryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined) search.set(key, String(value));
  return search.size ? `?${search}` : '';
}
async function domainEntity<T>(
  token: string,
  path: string,
  key: string,
  method = 'GET',
  body?: object,
): Promise<T> {
  const res = await request(
    path,
    { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
    token,
  );
  const value = entity(res, key);
  if (key !== 'success' && typeof value.id !== 'string')
    throw new ApiError(502, `Ответ ${key} не содержит идентификатор`);
  return value as T;
}
function mapOperation(value: WarehouseOperation): WarehouseOperation {
  return {
    ...value,
    assignmentId: value.assignmentId ?? null,
    recipientName: value.recipientName ?? null,
  };
}
function mapIncident(value: OrderIncident): OrderIncident {
  return {
    ...value,
    assignmentId: value.assignmentId ?? null,
    warehouseId: value.warehouseId ?? null,
    sourceOperationId: value.sourceOperationId ?? null,
    expectedPackages: value.expectedPackages ?? null,
    actualPackages: value.actualPackages ?? null,
    resolvedByUserId: value.resolvedByUserId ?? null,
    resolvedAt: value.resolvedAt ?? null,
  };
}
function mapHandover(value: TripHandover): TripHandover {
  return {
    ...value,
    nextAssignmentId: value.nextAssignmentId ?? null,
    outgoingConfirmedAt: value.outgoingConfirmedAt ?? null,
    completedAt: value.completedAt ?? null,
  };
}

async function assignmentCommand(
  token: string,
  id: string,
  action: 'accept' | 'reject' | 'start' | 'arrive' | 'complete',
  body?: object,
): Promise<Assignment> {
  const res = await request(
    `/v1/assignments/${id}/${action}`,
    {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    },
    token,
  );
  return mapAssignment((res.data as { assignment: Assignment }).assignment);
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthData> => {
      const res = await request<AuthData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return (res.data as Record<string, AuthData>)['auth'];
    },

    register: async (
      email: string,
      password: string,
      fullName: string,
    ): Promise<AuthData> => {
      const res = await request<AuthData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      });
      return (res.data as Record<string, AuthData>)['auth'];
    },

    logout: async (accessToken: string): Promise<void> => {
      await request('/auth/logout', { method: 'POST' }, accessToken);
    },

    refresh: async (signal?: AbortSignal): Promise<AuthData> => {
      const res = await request<AuthData>('/auth/refresh', {
        method: 'POST',
        signal,
      });
      return (res.data as Record<string, AuthData>)['auth'];
    },
  },

  me: {
    get: async (accessToken: string): Promise<BackendUser> => {
      const res = await request<BackendUser>(
        '/me',
        { method: 'GET' },
        accessToken,
      );
      return (res.data as Record<string, BackendUser>)['ok'];
    },
  },

  drivers: {
    list: async (
      accessToken: string,
      status?: DriverStatus,
    ): Promise<Driver[]> => {
      const query = status ? `?status=${status}` : '';
      const res = await request(
        `/drivers${query}`,
        { method: 'GET' },
        accessToken,
      );

      return list<unknown>(
        res,
        res.data && 'drivers' in res.data ? 'drivers' : 'success',
      ).map(mapDriver);
    },
    get: async (accessToken: string, slug: string): Promise<Driver> => {
      const res = await request(
        `/drivers/${slug}`,
        { method: 'GET' },
        accessToken,
      );

      return mapDriver(
        entity(res, res.data && 'driver' in res.data ? 'driver' : 'success'),
      );
    },
    create: async (
      accessToken: string,
      data: DriverCreate,
    ): Promise<Driver> => {
      const res = await request(
        '/drivers',
        { method: 'POST', body: JSON.stringify(data) },
        accessToken,
      );

      return mapDriver(entity(entity(res, 'driver'), 'driver'));
    },
    update: async (
      accessToken: string,
      slug: string,
      data: DriverUpdate,
    ): Promise<Driver> => {
      const res = await request(
        `/drivers/${slug}`,
        { method: 'PUT', body: JSON.stringify(data) },
        accessToken,
      );

      return mapDriver(
        entity(res, res.data && 'driver' in res.data ? 'driver' : 'success'),
      );
    },
    delete: async (accessToken: string, slug: string): Promise<void> => {
      await request(`/drivers/${slug}`, { method: 'DELETE' }, accessToken);
    },
    updateMyStatus: async (
      accessToken: string,
      status: DriverStatus,
    ): Promise<void> => {
      await request(
        '/drivers/me/status',
        { method: 'PATCH', body: JSON.stringify({ status }) },
        accessToken,
      );
    },
  },

  vehicles: {
    list: async (accessToken: string): Promise<Vehicle[]> => {
      const res = await request('/vehicles', { method: 'GET' }, accessToken);

      return list<unknown>(
        res,
        res.data && 'vehicles' in res.data ? 'vehicles' : 'success',
      ).map(mapVehicle);
    },
    get: async (accessToken: string, slug: string): Promise<Vehicle> => {
      const res = await request(
        `/vehicles/${slug}`,
        { method: 'GET' },
        accessToken,
      );

      return mapVehicle(
        entity(res, res.data && 'vehicle' in res.data ? 'vehicle' : 'success'),
      );
    },
    create: async (
      accessToken: string,
      data: VehicleCreate,
    ): Promise<Vehicle> => {
      const res = await request(
        '/vehicles',
        { method: 'POST', body: JSON.stringify(data) },
        accessToken,
      );

      return mapVehicle(
        entity(res, res.data && 'vehicle' in res.data ? 'vehicle' : 'success'),
      );
    },
    update: async (
      accessToken: string,
      slug: string,
      data: VehicleUpdate,
    ): Promise<Vehicle> => {
      const res = await request(
        `/vehicles/${slug}`,
        { method: 'PUT', body: JSON.stringify(data) },
        accessToken,
      );

      return mapVehicle(
        entity(res, res.data && 'vehicle' in res.data ? 'vehicle' : 'success'),
      );
    },
    delete: async (accessToken: string, slug: string): Promise<void> => {
      await request(`/vehicles/${slug}`, { method: 'DELETE' }, accessToken);
    },
    documents: {
      list: async (
        accessToken: string,
        slug: string,
      ): Promise<VehicleDocument[]> => {
        const res = await request(
          `/vehicles/${slug}/documents`,
          { method: 'GET' },
          accessToken,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ((res.data as any)?.vehicleDocuments ?? []).map((r: any) => ({
          id: str(r.ID ?? r.id),
          vehicleId: str(r.VehicleID ?? r.vehicleId),
          type: r.Type ?? r.type,
          number: str(r.Number ?? r.number),
          validUntil: str(r.ValidUntil ?? r.validUntil),
          status: r.Status ?? r.status,
        }));
      },
      create: async (
        accessToken: string,
        slug: string,
        number: string,
        validUntil: string,
      ): Promise<void> => {
        await request(
          `/vehicles/${slug}/documents`,
          {
            method: 'POST',
            body: JSON.stringify({ type: 'registration', number, validUntil }),
          },
          accessToken,
        );
      },
      updateStatus: async (
        accessToken: string,
        slug: string,
        id: string,
        status: VehicleDocument['status'],
      ): Promise<void> => {
        await request(
          `/vehicles/${slug}/documents/${id}`,
          { method: 'PATCH', body: JSON.stringify({ status }) },
          accessToken,
        );
      },
    },
  },

  warehouses: {
    list: async (accessToken: string): Promise<Warehouse[]> => {
      const res = await request('/warehouses', { method: 'GET' }, accessToken);

      return list<unknown>(
        res,
        res.data && 'warehouses' in res.data ? 'warehouses' : 'success',
      ).map(mapWarehouse);
    },
    get: async (accessToken: string, slug: string): Promise<Warehouse> => {
      const res = await request(
        `/warehouses/${slug}`,
        { method: 'GET' },
        accessToken,
      );

      return mapWarehouse(
        entity(
          res,
          res.data && 'warehouse' in res.data ? 'warehouse' : 'success',
        ),
      );
    },
    create: async (
      accessToken: string,
      data: WarehouseCreate,
    ): Promise<Warehouse> => {
      const res = await request(
        '/warehouses',
        { method: 'POST', body: JSON.stringify(data) },
        accessToken,
      );

      return mapWarehouse(
        entity(
          res,
          res.data && 'warehouse' in res.data ? 'warehouse' : 'success',
        ),
      );
    },
    update: async (
      accessToken: string,
      slug: string,
      data: WarehouseUpdate,
    ): Promise<Warehouse> => {
      const res = await request(
        `/warehouses/${slug}`,
        { method: 'PUT', body: JSON.stringify(data) },
        accessToken,
      );

      return mapWarehouse(
        entity(
          res,
          res.data && 'warehouse' in res.data ? 'warehouse' : 'success',
        ),
      );
    },
    queue: async (
      token: string,
      id: string,
      params: { includeClosed?: boolean; limit?: number; offset?: number } = {},
    ): Promise<WarehouseQueueItem[]> => {
      const res = await request(
        `/v1/warehouses/${id}/orders${queryString(params)}`,
        {},
        token,
      );
      return list<WarehouseQueueItem>(res, 'orders').map((r) => ({
        ...mapOrder(r),
        warehouseStage: r.warehouseStage,
        openIncidentCount: r.openIncidentCount,
      }));
    },
    delete: async (accessToken: string, slug: string): Promise<void> => {
      await request(`/warehouses/${slug}`, { method: 'DELETE' }, accessToken);
    },
  },

  orders: {
    list: async (
      accessToken: string,
      params?: ListOrdersParams,
    ): Promise<Order[]> => {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.driverId) search.set('driverId', params.driverId);
      const qs = search.toString();
      const res = await request(
        `/v1/orders${qs ? `?${qs}` : ''}`,
        { method: 'GET' },
        accessToken,
      );

      return list<unknown>(res, 'success').map(mapOrder);
    },
    get: async (accessToken: string, id: string): Promise<Order> => {
      const res = await request(
        `/v1/orders/${id}`,
        { method: 'GET' },
        accessToken,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapOrder((res.data as any)?.success);
    },
    create: async (accessToken: string, data: OrderCreate): Promise<Order> => {
      const res = await request(
        '/v1/orders',
        { method: 'POST', body: JSON.stringify(data) },
        accessToken,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapOrder((res.data as any)?.order?.order);
    },
    updateDraft: async (
      accessToken: string,
      id: string,
      data: OrderDraftUpdate,
    ): Promise<Order> => {
      const res = await request(
        `/v1/orders/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) },
        accessToken,
      );
      return mapOrder((res.data as { order: unknown }).order);
    },
    submit: async (accessToken: string, id: string): Promise<Order> => {
      const res = await request(
        `/v1/orders/${id}/submit`,
        { method: 'POST' },
        accessToken,
      );
      return mapOrder((res.data as { order: unknown }).order);
    },
    cancel: async (
      accessToken: string,
      id: string,
      data: { reasonCode?: string; comment?: string } = {},
    ): Promise<Order> => {
      const res = await request(
        `/v1/orders/${id}/cancel`,
        { method: 'POST', body: JSON.stringify(data) },
        accessToken,
      );
      return mapOrder((res.data as { order: unknown }).order);
    },
    setTransportDetails: async (
      token: string,
      id: string,
      data: TransportDetailsWrite,
    ): Promise<Order> =>
      mapOrder(
        await domainEntity(
          token,
          `/v1/orders/${id}/transport-details`,
          'order',
          'PUT',
          data,
        ),
      ),
    listAssignments: async (
      accessToken: string,
      id: string,
    ): Promise<Assignment[]> => {
      const res = await request(
        `/v1/orders/${id}/assignments`,
        { method: 'GET' },
        accessToken,
      );
      return list<Assignment>(res, 'assignments').map(mapAssignment);
    },
  },

  assignments: {
    list: async (
      accessToken: string,
      params?: { status?: AssignmentStatus; orderId?: string },
    ): Promise<Assignment[]> => {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.orderId) search.set('orderId', params.orderId);
      const res = await request(
        `/v1/assignments${search.size ? `?${search}` : ''}`,
        { method: 'GET' },
        accessToken,
      );
      return list<Assignment>(res, 'assignments').map(mapAssignment);
    },
    create: async (
      accessToken: string,
      orderId: string,
      data: AssignmentCreate,
    ): Promise<Assignment> => {
      const res = await request(
        `/v1/orders/${orderId}/assignments`,
        { method: 'POST', body: JSON.stringify(data) },
        accessToken,
      );
      return mapAssignment((res.data as { assignment: Assignment }).assignment);
    },
    accept: (token: string, id: string) =>
      assignmentCommand(token, id, 'accept'),
    reject: (token: string, id: string, reasonCode: string, comment?: string) =>
      assignmentCommand(token, id, 'reject', { reasonCode, comment }),
    start: (token: string, id: string) => assignmentCommand(token, id, 'start'),
    arrive: (token: string, id: string) =>
      assignmentCommand(token, id, 'arrive'),
    complete: (
      token: string,
      id: string,
      data: { recipientName?: string; comment?: string } = {},
    ) => assignmentCommand(token, id, 'complete', data),
  },

  routes: {
    get: async (accessToken: string, orderId: string): Promise<Route> => {
      const res = await request(
        `/orders/${orderId}/route`,
        { method: 'GET' },
        accessToken,
      );

      return mapRoute(
        entity(res, res.data && 'route' in res.data ? 'route' : 'success'),
      );
    },
  },

  managers: {
    list: async (accessToken: string): Promise<Manager[]> => {
      const res = await request('/managers', { method: 'GET' }, accessToken);

      return list<unknown>(
        res,
        res.data && 'managers' in res.data ? 'managers' : 'success',
      ).map(mapManager);
    },
    get: async (accessToken: string, slug: string): Promise<Manager> => {
      const res = await request(
        `/managers/${slug}`,
        { method: 'GET' },
        accessToken,
      );

      return mapManager(
        entity(res, res.data && 'manager' in res.data ? 'manager' : 'success'),
      );
    },
    create: async (
      accessToken: string,
      data: ManagerCreate,
    ): Promise<Manager> => {
      const res = await request(
        '/managers',
        { method: 'POST', body: JSON.stringify(data) },
        accessToken,
      );

      return mapManager(entity(entity(res, 'success'), 'manager'));
    },
    delete: async (accessToken: string, slug: string): Promise<void> => {
      await request(`/managers/${slug}`, { method: 'DELETE' }, accessToken);
    },
  },

  counterparties: {
    list: async (
      token: string,
      params: {
        limit?: number;
        offset?: number;
        includeArchived?: boolean;
      } = {},
    ): Promise<Counterparty[]> =>
      list(
        await request(`/v1/counterparties${queryString(params)}`, {}, token),
        'counterparties',
      ),
    get: (token: string, id: string) =>
      domainEntity<Counterparty>(
        token,
        `/v1/counterparties/${id}`,
        'counterparty',
      ),
    create: (token: string, data: CounterpartyWrite) =>
      domainEntity<Counterparty>(
        token,
        '/v1/counterparties',
        'counterparty',
        'POST',
        data,
      ),
    update: (token: string, id: string, data: CounterpartyWrite) =>
      domainEntity<Counterparty>(
        token,
        `/v1/counterparties/${id}`,
        'counterparty',
        'PUT',
        data,
      ),
  },
  deliveryReceipts: {
    get: async (token: string, id: string): Promise<DeliveryReceipt | null> => {
      try {
        return await domainEntity<DeliveryReceipt>(
          token,
          `/v1/orders/${id}/delivery-receipt`,
          'receipt',
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    create: (token: string, id: string, data: DeliveryReceiptCreate) =>
      domainEntity<DeliveryReceipt>(
        token,
        `/v1/orders/${id}/delivery-receipt`,
        'receipt',
        'POST',
        data,
      ),
  },
  warehouseOperations: {
    list: async (token: string, id: string): Promise<WarehouseOperation[]> =>
      list<WarehouseOperation>(
        await request(`/v1/orders/${id}/warehouse-operations`, {}, token),
        'operations',
      ).map(mapOperation),
    create: async (token: string, id: string, data: WarehouseOperationCreate) =>
      mapOperation(
        await domainEntity<WarehouseOperation>(
          token,
          `/v1/orders/${id}/warehouse-operations`,
          'operation',
          'POST',
          data,
        ),
      ),
  },
  incidents: {
    list: async (token: string, id: string): Promise<OrderIncident[]> =>
      list<OrderIncident>(
        await request(`/v1/orders/${id}/incidents`, {}, token),
        'incidents',
      ).map(mapIncident),
    create: async (token: string, id: string, data: OrderIncidentCreate) =>
      mapIncident(
        await domainEntity<OrderIncident>(
          token,
          `/v1/orders/${id}/incidents`,
          'incident',
          'POST',
          data,
        ),
      ),
    resolve: async (token: string, id: string, data: OrderIncidentResolve) =>
      mapIncident(
        await domainEntity<OrderIncident>(
          token,
          `/v1/incidents/${id}/resolve`,
          'incident',
          'POST',
          data,
        ),
      ),
  },
  dispatch: {
    get: async (
      token: string,
      id: string,
    ): Promise<DispatchRecommendations> => {
      const res = await domainEntity<DispatchRecommendations>(
        token,
        `/v1/orders/${id}/dispatch-recommendations`,
        'success',
      );
      return {
        ...res,
        createdAt: res.createdAt ?? null,
        candidates: res.candidates ?? [],
      };
    },
    refresh: async (
      token: string,
      id: string,
    ): Promise<DispatchRecommendations> => {
      const res = await domainEntity<DispatchRecommendations>(
        token,
        `/v1/orders/${id}/dispatch-recommendations`,
        'success',
        'POST',
      );
      return {
        ...res,
        createdAt: res.createdAt ?? null,
        candidates: res.candidates ?? [],
      };
    },
  },
  handovers: {
    list: async (token: string, id: string): Promise<TripHandover[]> =>
      list<TripHandover>(
        await request(`/v1/orders/${id}/handovers`, {}, token),
        'handovers',
      ).map(mapHandover),
    create: async (token: string, id: string, data: TripHandoverCreate) =>
      mapHandover(
        await domainEntity<TripHandover>(
          token,
          `/v1/orders/${id}/handovers`,
          'handover',
          'POST',
          data,
        ),
      ),
    confirmRelease: async (token: string, id: string) =>
      mapHandover(
        await domainEntity<TripHandover>(
          token,
          `/v1/handovers/${id}/confirm-release`,
          'handover',
          'POST',
        ),
      ),
    accept: async (token: string, id: string) =>
      mapHandover(
        await domainEntity<TripHandover>(
          token,
          `/v1/handovers/${id}/accept`,
          'handover',
          'POST',
        ),
      ),
    cancel: async (token: string, id: string) =>
      mapHandover(
        await domainEntity<TripHandover>(
          token,
          `/v1/handovers/${id}/cancel`,
          'handover',
          'POST',
        ),
      ),
  },

  reports: {
    dashboard: async (accessToken: string): Promise<DashboardReport> => {
      const res = await request<DashboardReport>(
        '/reports/dashboard',
        { method: 'GET' },
        accessToken,
      );
      return (res.data as { success: DashboardReport }).success;
    },
    orders: async (
      accessToken: string,
      params?: OrdersReportParams,
    ): Promise<Blob> => {
      const search = new URLSearchParams();
      if (params?.from) search.set('from', params.from);
      if (params?.to) search.set('to', params.to);
      if (params?.status) search.set('status', params.status);
      if (params?.driverId) search.set('driverId', params.driverId);
      if (params?.warehouseId) search.set('warehouseId', params.warehouseId);
      const qs = search.toString();
      return download(`/reports/orders${qs ? `?${qs}` : ''}`, accessToken);
    },
  },

  documents: {
    list: async (
      accessToken: string,
      limit = 20,
      offset = 0,
    ): Promise<InboxDocument[]> => {
      const query = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      const res = await request<InboxDocument[]>(
        `/v1/documents?${query}`,
        { method: 'GET' },
        accessToken,
      );
      return list<InboxDocument>(res, 'success');
    },
    download: (accessToken: string, id: string): Promise<Blob> =>
      download(`/v1/documents/${encodeURIComponent(id)}/download`, accessToken),
  },

  notifications: {
    list: async (
      accessToken: string,
      unreadOnly?: boolean,
    ): Promise<Notification[]> => {
      const qs = unreadOnly ? '?unreadOnly=true' : '';
      const res = await request(
        `/notifications${qs}`,
        { method: 'GET' },
        accessToken,
      );

      return list<unknown>(
        res,
        res.data && 'notifications' in res.data ? 'notifications' : 'success',
      ).map(mapNotification);
    },
    markRead: async (accessToken: string, id: string): Promise<void> => {
      await request(
        `/notifications/${id}/read`,
        { method: 'PATCH' },
        accessToken,
      );
    },
  },
};

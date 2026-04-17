const API_BASE = "/api";

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
  PasswordHash: string;
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

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = accessToken;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // для refresh_token cookie
    headers,
  });

  // logout возвращает 200 с пустым телом
  if (res.status === 200 && res.headers.get("content-length") === "0") {
    return { status: 200, success: true, requestID: "", data: null };
  }

  let data: ApiResponse<T>;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(res.status, "Ошибка при разборе ответа сервера");
  }

  if (!data.success) {
    const errData = data.data as Record<string, unknown> | null;
    const message = (errData?.["error"] as string) ?? "Неизвестная ошибка";
    throw new ApiError(data.status, message);
  }

  return data;
}

// ─── Mappers (Go PascalCase → camelCase) ──────────────────────────────────────
// Go models have only `db:` tags, no `json:` tags, so fields serialize as-is
// (ID, UserID, DriverID, CreatedAt, etc.). These mappers normalize to camelCase.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function str(v: any): string { return v ?? ""; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nullable<T>(v: T | null | undefined): T | null { return v ?? null; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function num(v: any): number | null { return v || null; }

// ─── Driver ───────────────────────────────────────────────────────────────────

export type DriverStatus = "available" | "on_route" | "off_duty";

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

export type VehicleStatus = "available" | "in_transit" | "maintenance";

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

// ─── Warehouse ────────────────────────────────────────────────────────────────

export type WarehouseStatus = "active" | "inactive";

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
  city?: string | null;
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
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  createdById: string | null;
  driverId: string | null;
  managerId: string | null;
  originWarehouseId: string | null;
  originAddress: string | null;
  destinationAddress: string;
  cargoDescription: string | null;
  weightKg: number | null;
  volumeM3: number | null;
  status: OrderStatus;
  totalPrice: number | null;
  createdAt: string;
  assignedAt: string | null;
  deliveredAt: string | null;
}

export interface OrderCreate {
  originWarehouseId?: string | null;
  originAddress?: string | null;
  destinationAddress: string;
  cargoDescription?: string | null;
  weightKg?: number | null;
  volumeM3?: number | null;
}

export interface OrderStatusUpdate {
  status: Exclude<OrderStatus, "pending">;
  driverId?: string | null;
}

export interface ListOrdersParams {
  status?: OrderStatus;
  driverId?: string;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export type Coordinate = [number, number]; // [longitude, latitude]

export type RouteStatus = "pending" | "active" | "finished";

export interface Route {
  id: string;
  orderId: string;
  driverId: string | null;
  coordinates: Coordinate[];
  currentIndex: number;
  startedAt: string | null;
  finishedAt: string | null;
  distanceKm: number;
  durationSec: number;
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
  warehouseId?: string | null;
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

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDriver(r: any): Driver {
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
  return {
    id: str(r.ID ?? r.id),
    createdById: nullable(r.CreatedByID ?? r.createdById),
    driverId: nullable(r.DriverID ?? r.driverId),
    managerId: nullable(r.ManagerID ?? r.managerId),
    originWarehouseId: nullable(r.OriginWarehouseID ?? r.originWarehouseId),
    originAddress: nullable(r.OriginAddress || r.originAddress || null),
    destinationAddress: str(r.DestinationAddress ?? r.destinationAddress),
    cargoDescription: nullable(r.CargoDescription || r.cargoDescription || null),
    weightKg: num(r.WeightKg ?? r.weightKg),
    volumeM3: num(r.VolumeM3 ?? r.volumeM3),
    status: (r.Status ?? r.status) as OrderStatus,
    totalPrice: num(r.TotalPrice ?? r.totalPrice),
    createdAt: str(r.CreatedAt ?? r.createdAt),
    assignedAt: nullable(r.AssignedAt ?? r.assignedAt),
    deliveredAt: nullable(r.DeliveredAt ?? r.deliveredAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapManager(r: any): Manager {
  return {
    id: str(r.ID ?? r.id),
    userId: str(r.UserID ?? r.userId),
    warehouseId: nullable(r.WarehouseID ?? r.warehouseId),
    slug: str(r.Slug ?? r.slug),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRoute(r: any): Route {
  return {
    id: str(r.ID ?? r.id),
    orderId: str(r.OrderID ?? r.orderId),
    driverId: nullable(r.DriverID ?? r.driverId),
    coordinates: (r.Coordinates ?? r.coordinates ?? []) as Coordinate[],
    currentIndex: r.CurrentIndex ?? r.currentIndex ?? 0,
    startedAt: nullable(r.StartedAt ?? r.startedAt),
    finishedAt: nullable(r.FinishedAt ?? r.finishedAt),
    distanceKm: r.DistanceKm ?? r.distanceKm ?? 0,
    durationSec: r.DurationSec ?? r.durationSec ?? 0,
    status: (r.Status ?? r.status ?? "pending") as RouteStatus,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(r: any): Notification {
  return {
    id: str(r.ID ?? r.id),
    userId: str(r.UserID ?? r.userId),
    title: str(r.Title ?? r.title),
    body: nullable(r.Body ?? r.body),
    isRead: r.IsRead ?? r.isRead ?? false,
    createdAt: str(r.CreatedAt ?? r.createdAt),
  };
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthData> => {
      const res = await request<AuthData>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return (res.data as Record<string, AuthData>)["auth"];
    },

    register: async (
      email: string,
      password: string,
      fullName: string,
      role: string,
    ): Promise<AuthData> => {
      const res = await request<AuthData>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName, role }),
      });
      return (res.data as Record<string, AuthData>)["auth"];
    },

    logout: async (accessToken: string): Promise<void> => {
      await request("/auth/logout", { method: "POST" }, accessToken);
    },

    refresh: async (accessToken: string): Promise<AuthData> => {
      const res = await request<AuthData>(
        "/auth/refresh",
        { method: "POST" },
        accessToken,
      );
      return (res.data as Record<string, AuthData>)["auth"];
    },
  },

  me: {
    get: async (accessToken: string): Promise<BackendUser> => {
      const res = await request<BackendUser>(
        "/me",
        { method: "GET" },
        accessToken,
      );
      return (res.data as Record<string, BackendUser>)["ok"];
    },
  },

  drivers: {
    list: async (accessToken: string, status?: DriverStatus): Promise<Driver[]> => {
      const query = status ? `?status=${status}` : "";
      const res = await request(`/drivers${query}`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = ((res.data as any)?.drivers ?? (res.data as any)?.success ?? []) as any[];
      return raw.map(mapDriver);
    },
    get: async (accessToken: string, slug: string): Promise<Driver> => {
      const res = await request(`/drivers/${slug}`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapDriver((res.data as any)?.driver ?? (res.data as any)?.success);
    },
    create: async (accessToken: string, data: DriverCreate): Promise<Driver> => {
      const res = await request("/drivers", { method: "POST", body: JSON.stringify(data) }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapDriver((res.data as any)?.driver ?? (res.data as any)?.success);
    },
    update: async (accessToken: string, slug: string, data: DriverUpdate): Promise<Driver> => {
      const res = await request(`/drivers/${slug}`, { method: "PUT", body: JSON.stringify(data) }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapDriver((res.data as any)?.driver ?? (res.data as any)?.success);
    },
    delete: async (accessToken: string, slug: string): Promise<void> => {
      await request(`/drivers/${slug}`, { method: "DELETE" }, accessToken);
    },
    updateMyStatus: async (accessToken: string, status: DriverStatus): Promise<void> => {
      await request("/drivers/me/status", { method: "PATCH", body: JSON.stringify({ status }) }, accessToken);
    },
  },

  vehicles: {
    list: async (accessToken: string): Promise<Vehicle[]> => {
      const res = await request("/vehicles", { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = ((res.data as any)?.vehicles ?? (res.data as any)?.success ?? []) as any[];
      return raw.map(mapVehicle);
    },
    get: async (accessToken: string, slug: string): Promise<Vehicle> => {
      const res = await request(`/vehicles/${slug}`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapVehicle((res.data as any)?.vehicle ?? (res.data as any)?.success);
    },
    create: async (accessToken: string, data: VehicleCreate): Promise<Vehicle> => {
      const res = await request("/vehicles", { method: "POST", body: JSON.stringify(data) }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapVehicle((res.data as any)?.vehicle ?? (res.data as any)?.success);
    },
    update: async (accessToken: string, slug: string, data: VehicleUpdate): Promise<Vehicle> => {
      const res = await request(`/vehicles/${slug}`, { method: "PUT", body: JSON.stringify(data) }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapVehicle((res.data as any)?.vehicle ?? (res.data as any)?.success);
    },
    delete: async (accessToken: string, slug: string): Promise<void> => {
      await request(`/vehicles/${slug}`, { method: "DELETE" }, accessToken);
    },
  },

  warehouses: {
    list: async (accessToken: string): Promise<Warehouse[]> => {
      const res = await request("/warehouses", { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = ((res.data as any)?.warehouses ?? (res.data as any)?.success ?? []) as any[];
      return raw.map(mapWarehouse);
    },
    get: async (accessToken: string, slug: string): Promise<Warehouse> => {
      const res = await request(`/warehouses/${slug}`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapWarehouse((res.data as any)?.warehouse ?? (res.data as any)?.success);
    },
    create: async (accessToken: string, data: WarehouseCreate): Promise<Warehouse> => {
      const res = await request("/warehouses", { method: "POST", body: JSON.stringify(data) }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapWarehouse((res.data as any)?.warehouse ?? (res.data as any)?.success);
    },
    update: async (accessToken: string, slug: string, data: WarehouseUpdate): Promise<Warehouse> => {
      const res = await request(`/warehouses/${slug}`, { method: "PUT", body: JSON.stringify(data) }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapWarehouse((res.data as any)?.warehouse ?? (res.data as any)?.success);
    },
    delete: async (accessToken: string, slug: string): Promise<void> => {
      await request(`/warehouses/${slug}`, { method: "DELETE" }, accessToken);
    },
  },

  orders: {
    list: async (accessToken: string, params?: ListOrdersParams): Promise<Order[]> => {
      const search = new URLSearchParams();
      if (params?.status) search.set("status", params.status);
      if (params?.driverId) search.set("driverId", params.driverId);
      const qs = search.toString();
      const res = await request(`/orders${qs ? `?${qs}` : ""}`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = ((res.data as any)?.orders ?? (res.data as any)?.success ?? []) as any[];
      return raw.map(mapOrder);
    },
    get: async (accessToken: string, id: string): Promise<Order> => {
      const res = await request(`/orders/${id}`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapOrder((res.data as any)?.order ?? (res.data as any)?.success);
    },
    create: async (accessToken: string, data: OrderCreate): Promise<Order> => {
      const res = await request("/orders", { method: "POST", body: JSON.stringify(data) }, accessToken);
      // бэк: data: { success: { order: {...}, route: {...} } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inner = (res.data as any)?.success ?? res.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (inner as any)?.order ?? (inner as any)?.Order ?? inner;
      return mapOrder(raw);
    },
    cancel: async (accessToken: string, id: string): Promise<void> => {
      await request(`/orders/${id}`, { method: "DELETE" }, accessToken);
    },
    updateStatus: async (accessToken: string, id: string, payload: OrderStatusUpdate): Promise<Order> => {
      const res = await request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapOrder((res.data as any)?.order ?? (res.data as any)?.success);
    },
  },

  routes: {
    get: async (accessToken: string, orderId: string): Promise<Route> => {
      const res = await request(`/orders/${orderId}/route`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapRoute((res.data as any)?.route ?? (res.data as any)?.success);
    },
    connectWs: (orderId: string, accessToken: string, onPosition: (pos: RoutePosition) => void): WebSocket => {
      const wsBase = typeof window !== "undefined"
        ? window.location.origin.replace(/^http/, "ws")
        : "";
      const ws = new WebSocket(`${wsBase}/api/orders/${orderId}/route/ws`, [accessToken]);
      ws.onmessage = (e) => {
        try {
          const pos = JSON.parse(e.data) as RoutePosition;
          onPosition(pos);
        } catch {}
      };
      return ws;
    },
  },

  managers: {
    list: async (accessToken: string): Promise<Manager[]> => {
      const res = await request("/managers", { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = ((res.data as any)?.managers ?? (res.data as any)?.success ?? []) as any[];
      return raw.map(mapManager);
    },
    get: async (accessToken: string, slug: string): Promise<Manager> => {
      const res = await request(`/managers/${slug}`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapManager((res.data as any)?.manager ?? (res.data as any)?.success);
    },
    create: async (accessToken: string, data: ManagerCreate): Promise<Manager> => {
      const res = await request("/managers", { method: "POST", body: JSON.stringify(data) }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapManager((res.data as any)?.manager ?? (res.data as any)?.success);
    },
    delete: async (accessToken: string, slug: string): Promise<void> => {
      await request(`/managers/${slug}`, { method: "DELETE" }, accessToken);
    },
  },

  reports: {
    orders: async (accessToken: string, params?: OrdersReportParams): Promise<OrdersReport> => {
      const search = new URLSearchParams();
      if (params?.from) search.set("from", params.from);
      if (params?.to) search.set("to", params.to);
      if (params?.status) search.set("status", params.status);
      if (params?.driverId) search.set("driverId", params.driverId);
      if (params?.warehouseId) search.set("warehouseId", params.warehouseId);
      const qs = search.toString();
      const res = await request<OrdersReport>(
        `/reports/orders${qs ? `?${qs}` : ""}`,
        { method: "GET" },
        accessToken,
      );
      const data = res.data as Record<string, OrdersReport | undefined> | null;
      return (data?.report ?? data?.success) as OrdersReport;
    },
  },

  notifications: {
    list: async (accessToken: string, unreadOnly?: boolean): Promise<Notification[]> => {
      const qs = unreadOnly ? "?unreadOnly=true" : "";
      const res = await request(`/notifications${qs}`, { method: "GET" }, accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = ((res.data as any)?.notifications ?? (res.data as any)?.success ?? []) as any[];
      return raw.map(mapNotification);
    },
    markRead: async (accessToken: string, id: string): Promise<void> => {
      await request(`/notifications/${id}/read`, { method: "PATCH" }, accessToken);
    },
  },
};

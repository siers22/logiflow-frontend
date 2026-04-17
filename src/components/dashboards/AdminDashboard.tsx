"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Settings,
  Shield,
  ClipboardCheck,
  Truck,
  Car,
  User,
  IdCard,
  Weight,
  Box,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/lib/UserContext";
import {
  api,
  type Driver,
  type DriverStatus,
  type DriverCreate,
  type Vehicle,
  type VehicleStatus,
  type VehicleCreate,
  type Order,
  type Manager,
} from "@/lib/api";

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
    </div>
  );
}

const DRIVER_STATUS_CONFIG: Record<DriverStatus, { label: string; className: string }> = {
  available: { label: "Доступен", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  on_route:  { label: "В пути",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  off_duty:  { label: "Не на смене", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, { label: string; className: string }> = {
  available:   { label: "Свободен",  className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  in_transit:  { label: "В рейсе",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  maintenance: { label: "На ТО",     className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

function vehicleLabel(v: Vehicle) {
  const name = [v.brand, v.model].filter(Boolean).join(" ");
  return name ? `${v.plateNumber} — ${name}` : v.plateNumber;
}

export function AdminDashboard() {
  const { user, withAuth } = useUser();

  // ── Drivers ──────────────────────────────────────────────────────────────
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [updatingDriverStatusId, setUpdatingDriverStatusId] = useState<string | null>(null);

  const [isCreateDriverOpen, setIsCreateDriverOpen] = useState(false);
  const [driverForm, setDriverForm] = useState<Partial<DriverCreate>>({});
  const [isCreatingDriver, setIsCreatingDriver] = useState(false);

  // ── Vehicles ─────────────────────────────────────────────────────────────
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [updatingVehicleStatusId, setUpdatingVehicleStatusId] = useState<string | null>(null);
  const [deleteVehicleTarget, setDeleteVehicleTarget] = useState<Vehicle | null>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);

  const [isCreateVehicleOpen, setIsCreateVehicleOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<Partial<VehicleCreate>>({});
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);

  // ── Orders ────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // ── Managers ──────────────────────────────────────────────────────────────
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [deleteManagerTarget, setDeleteManagerTarget] = useState<Manager | null>(null);
  const [isDeletingManager, setIsDeletingManager] = useState(false);
  const [isCreateManagerOpen, setIsCreateManagerOpen] = useState(false);
  const [managerForm, setManagerForm] = useState<{ email: string; password: string; fullName: string }>({ email: "", password: "", fullName: "" });
  const [isCreatingManager, setIsCreatingManager] = useState(false);

  // ── Settings ─────────────────────────────────────────────────────────────
  const [company, setCompany] = useState("LogiFlow");
  const [supportEmail, setSupportEmail] = useState("support@logiflow.com");
  const [currency, setCurrency] = useState("rub");

  useEffect(() => {
    withAuth((token) => api.drivers.list(token))
      .then(setDrivers)
      .catch(() => {})
      .finally(() => setDriversLoading(false));

    withAuth((token) => api.vehicles.list(token))
      .then(setVehicles)
      .catch(() => {})
      .finally(() => setVehiclesLoading(false));

    withAuth((token) => api.orders.list(token))
      .then(setOrders)
      .catch(() => {})
      .finally(() => setOrdersLoading(false));

    withAuth((token) => api.managers.list(token))
      .then(setManagers)
      .catch(() => {})
      .finally(() => setManagersLoading(false));
  }, [withAuth]);

  // ── Driver handlers ───────────────────────────────────────────────────────
  const handleCreateDriver = async () => {
    if (
      !driverForm.email || !driverForm.password || !driverForm.fullName ||
      !driverForm.licenseNumber || !driverForm.licenseExpiry || !driverForm.vehicleId
    ) return;
    setIsCreatingDriver(true);
    try {
      const created = await withAuth((token) =>
        api.drivers.create(token, {
          email: driverForm.email!,
          password: driverForm.password!,
          fullName: driverForm.fullName!,
          licenseNumber: driverForm.licenseNumber!,
          licenseExpiry: driverForm.licenseExpiry!,
          vehicleId: driverForm.vehicleId!,
        }),
      );
      setDrivers((prev) => [...prev, created]);
      setIsCreateDriverOpen(false);
      setDriverForm({});
      toast.success("Водитель добавлен");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось создать водителя");
    } finally {
      setIsCreatingDriver(false);
    }
  };

  const handleDriverStatusChange = async (driver: Driver, newStatus: DriverStatus) => {
    setUpdatingDriverStatusId(driver.id);
    try {
      const updated = await withAuth((token) =>
        api.drivers.update(token, driver.slug, { status: newStatus }),
      );
      setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success("Статус изменён");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось изменить статус");
    } finally {
      setUpdatingDriverStatusId(null);
    }
  };

  // ── Vehicle handlers ──────────────────────────────────────────────────────
  const handleCreateVehicle = async () => {
    if (!vehicleForm.plateNumber) return;
    setIsCreatingVehicle(true);
    try {
      const created = await withAuth((token) =>
        api.vehicles.create(token, {
          plateNumber: vehicleForm.plateNumber!,
          brand: vehicleForm.brand ?? null,
          model: vehicleForm.model ?? null,
          year: vehicleForm.year ?? null,
          capacityKg: vehicleForm.capacityKg ?? null,
          capacityM3: vehicleForm.capacityM3 ?? null,
        }),
      );
      setVehicles((prev) => [...prev, created]);
      setIsCreateVehicleOpen(false);
      setVehicleForm({});
      toast.success("ТС добавлено");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось создать ТС");
    } finally {
      setIsCreatingVehicle(false);
    }
  };

  const handleVehicleStatusChange = async (vehicle: Vehicle, newStatus: VehicleStatus) => {
    setUpdatingVehicleStatusId(vehicle.id);
    try {
      const updated = await withAuth((token) =>
        api.vehicles.update(token, vehicle.slug, { status: newStatus }),
      );
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      toast.success("Статус изменён");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось изменить статус");
    } finally {
      setUpdatingVehicleStatusId(null);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicleTarget) return;
    setIsDeletingVehicle(true);
    try {
      await withAuth((token) => api.vehicles.delete(token, deleteVehicleTarget.slug));
      setVehicles((prev) => prev.filter((v) => v.id !== deleteVehicleTarget.id));
      setDeleteVehicleTarget(null);
      toast.success("ТС удалено");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось удалить ТС");
    } finally {
      setIsDeletingVehicle(false);
    }
  };

  const handleCreateManager = async () => {
    if (!managerForm.email || !managerForm.password || !managerForm.fullName) return;
    setIsCreatingManager(true);
    try {
      const created = await withAuth((token) =>
        api.managers.create(token, {
          email: managerForm.email,
          password: managerForm.password,
          fullName: managerForm.fullName,
        }),
      );
      setManagers((prev) => [...prev, created]);
      setIsCreateManagerOpen(false);
      setManagerForm({ email: "", password: "", fullName: "" });
      toast.success("Менеджер добавлен");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось создать менеджера");
    } finally {
      setIsCreatingManager(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!deleteManagerTarget) return;
    setIsDeletingManager(true);
    try {
      await withAuth((token) => api.managers.delete(token, deleteManagerTarget.slug));
      setManagers((prev) => prev.filter((m) => m.id !== deleteManagerTarget.id));
      setDeleteManagerTarget(null);
      toast.success("Менеджер удалён");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось удалить менеджера");
    } finally {
      setIsDeletingManager(false);
    }
  };

  if (!user) return null;

  const availableVehicles = vehicles.filter((v) => v.status === "available");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-gray-900 dark:text-gray-100">Панель администратора</h1>
          <p className="text-gray-600 dark:text-gray-400">Добро пожаловать, {user.name}</p>
        </div>

        {/* Профиль */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <User className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                <div className="text-sm text-gray-500 truncate">{user.email}</div>
                {user.slug && <div className="text-xs text-gray-400 mt-0.5">@{user.slug}</div>}
              </div>
              <RoleBadge role={user.role} className="shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Статистика */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Водители</CardTitle>
              <Truck className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {driversLoading ? "—" : drivers.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {driversLoading ? "Загрузка..." : `${drivers.filter((d) => d.status === "available").length} доступны`}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Транспорт</CardTitle>
              <Car className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {vehiclesLoading ? "—" : vehicles.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {vehiclesLoading ? "Загрузка..." : `${vehicles.filter((v) => v.status === "available").length} свободны`}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Безопасность</CardTitle>
              <Shield className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-green-600">Все системы в норме</div>
              <p className="text-xs text-gray-500 mt-1">Сервер доступен</p>
            </CardContent>
          </Card>
        </div>

        {/* Вкладки */}
        <Tabs defaultValue="drivers" className="space-y-6">
          <TabsList>
            <TabsTrigger variant="glass" value="orders">
              <ClipboardCheck className="w-4 h-4 mr-2" /> Заказы
            </TabsTrigger>
            <TabsTrigger variant="glass" value="vehicles">
              <Car className="w-4 h-4 mr-2" /> ТС
            </TabsTrigger>
            <TabsTrigger variant="glass" value="drivers">
              <Truck className="w-4 h-4 mr-2" /> Водители
            </TabsTrigger>
            <TabsTrigger variant="glass" value="managers">
              <Users className="w-4 h-4 mr-2" /> Менеджеры
            </TabsTrigger>
            <TabsTrigger variant="glass" value="settings">
              <Settings className="w-4 h-4 mr-2" /> Настройки
            </TabsTrigger>
          </TabsList>

          {/* ── Заказы ── */}
          <TabsContent value="orders">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Все заказы</CardTitle>
                <CardDescription>
                  {ordersLoading ? "Загрузка..." : `${orders.length} заявок в системе`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Загрузка...</div>
                ) : orders.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardCheck className="w-7 h-7" />}
                    title="Заявок нет"
                    description="В системе пока нет ни одной заявки"
                  />
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {order.cargoDescription ?? "Без описания"}
                              {order.weightKg ? ` • ${order.weightKg} кг` : ""}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {order.originAddress ?? "Со склада"} → {order.destinationAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              order.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              order.status === "in_transit" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                              order.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              order.status === "assigned" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}>
                              {order.status === "pending" ? "Ожидает" :
                               order.status === "assigned" ? "Назначен" :
                               order.status === "in_transit" ? "В пути" :
                               order.status === "delivered" ? "Доставлен" : "Отменён"}
                            </span>
                            {order.totalPrice != null && (
                              <p className="text-xs text-gray-500 mt-1">
                                {order.totalPrice.toLocaleString("ru-RU")} ₽
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ТС ── */}
          <TabsContent value="vehicles">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Транспортные средства</CardTitle>
                    <CardDescription>
                      {vehiclesLoading ? "Загрузка..." : `${vehicles.length} ТС в системе`}
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => { setVehicleForm({}); setIsCreateVehicleOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Добавить ТС
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {vehiclesLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Загрузка...</div>
                ) : vehicles.length === 0 ? (
                  <EmptyState
                    icon={<Car className="w-7 h-7" />}
                    title="ТС не найдены"
                    description="Добавьте транспортное средство перед созданием водителя"
                  />
                ) : (
                  <div className="space-y-3">
                    {vehicles.map((vehicle) => {
                      const sc = VEHICLE_STATUS_CONFIG[vehicle.status] ?? VEHICLE_STATUS_CONFIG.available;
                      const isUpdating = updatingVehicleStatusId === vehicle.id;
                      return (
                        <div
                          key={vehicle.id}
                          className="rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  {vehicle.plateNumber}
                                  {vehicle.brand && vehicle.model && (
                                    <span className="font-normal text-gray-500 ml-2">
                                      {vehicle.brand} {vehicle.model}
                                      {vehicle.year ? ` (${vehicle.year})` : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                  {vehicle.capacityKg && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Weight className="w-3 h-3" /> {vehicle.capacityKg} кг
                                    </span>
                                  )}
                                  {vehicle.capacityM3 && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Box className="w-3 h-3" /> {vehicle.capacityM3} м³
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Select
                                value={vehicle.status}
                                onValueChange={(v) => handleVehicleStatusChange(vehicle, v as VehicleStatus)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className={`h-7 text-xs w-32 px-2 rounded-full border-0 font-medium ${sc.className} ${isUpdating ? "opacity-60" : ""}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Свободен</SelectItem>
                                  <SelectItem value="in_transit">В рейсе</SelectItem>
                                  <SelectItem value="maintenance">На ТО</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteVehicleTarget(vehicle)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Водители ── */}
          <TabsContent value="drivers">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Водители</CardTitle>
                    <CardDescription>
                      {driversLoading ? "Загрузка..." : `${drivers.length} водителей в системе`}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { setDriverForm({}); setIsCreateDriverOpen(true); }}
                    disabled={availableVehicles.length === 0}
                    title={availableVehicles.length === 0 ? "Сначала добавьте свободное ТС" : undefined}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Добавить водителя
                  </Button>
                </div>
                {availableVehicles.length === 0 && !vehiclesLoading && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Нет свободных ТС — сначала добавьте транспортное средство во вкладке ТС
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {driversLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Загрузка...</div>
                ) : drivers.length === 0 ? (
                  <EmptyState
                    icon={<Truck className="w-7 h-7" />}
                    title="Водители не найдены"
                    description="Нажмите «Добавить водителя» чтобы создать первого"
                  />
                ) : (
                  <div className="space-y-3">
                    {drivers.map((driver) => {
                      const sc = DRIVER_STATUS_CONFIG[driver.status] ?? DRIVER_STATUS_CONFIG.off_duty;
                      const isUpdating = updatingDriverStatusId === driver.id;
                      const assignedVehicle = vehicles.find((v) => v.id === driver.vehicleId);
                      return (
                        <div
                          key={driver.id}
                          className="rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  @{driver.slug}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <IdCard className="w-3 h-3" /> {driver.licenseNumber}
                                  </span>
                                  {assignedVehicle ? (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Car className="w-3 h-3" /> {assignedVehicle.plateNumber}
                                    </span>
                                  ) : driver.vehicleId ? (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Car className="w-3 h-3" /> ТС привязано
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-gray-500">⭐ {driver.rating.toFixed(1)}</span>
                              <Select
                                value={driver.status}
                                onValueChange={(v) => handleDriverStatusChange(driver, v as DriverStatus)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className={`h-7 text-xs w-36 px-2 rounded-full border-0 font-medium ${sc.className} ${isUpdating ? "opacity-60" : ""}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Доступен</SelectItem>
                                  <SelectItem value="on_route">В пути</SelectItem>
                                  <SelectItem value="off_duty">Не на смене</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Менеджеры ── */}
          <TabsContent value="managers">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Менеджеры</CardTitle>
                    <CardDescription>
                      {managersLoading ? "Загрузка..." : `${managers.length} менеджеров в системе`}
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => { setManagerForm({ email: "", password: "", fullName: "" }); setIsCreateManagerOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Добавить
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {managersLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Загрузка...</div>
                ) : managers.length === 0 ? (
                  <EmptyState
                    icon={<Users className="w-7 h-7" />}
                    title="Менеджеров нет"
                    description="Добавьте первого менеджера"
                  />
                ) : (
                  <div className="space-y-3">
                    {managers.map((manager) => (
                      <div key={manager.id} className="rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">@{manager.slug}</div>
                            <div className="text-xs text-gray-500">
                              ID: #{manager.id.slice(0, 8).toUpperCase()}
                              {manager.warehouseId ? " • Склад привязан" : ""}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteManagerTarget(manager)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Настройки ── */}
          <TabsContent value="settings">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Настройки системы
                </CardTitle>
                <CardDescription>Конфигурация приложения</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Название компании</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email поддержки</Label>
                  <Input id="support-email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rub">Российский рубль (₽)</SelectItem>
                      <SelectItem value="usd">Доллар США ($)</SelectItem>
                      <SelectItem value="eur">Евро (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Сохранить настройки</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Диалог: создать ТС ── */}
      <Dialog open={isCreateVehicleOpen} onOpenChange={setIsCreateVehicleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить транспортное средство</DialogTitle>
            <DialogDescription>Заполните данные о ТС</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Госномер *</Label>
              <Input
                placeholder="А123ВС77"
                value={vehicleForm.plateNumber ?? ""}
                onChange={(e) => setVehicleForm((f) => ({ ...f, plateNumber: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Марка</Label>
                <Input
                  placeholder="Mercedes-Benz"
                  value={vehicleForm.brand ?? ""}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, brand: e.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Модель</Label>
                <Input
                  placeholder="Sprinter"
                  value={vehicleForm.model ?? ""}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value || null }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Год</Label>
                <Input
                  type="number"
                  placeholder="2021"
                  value={vehicleForm.year ?? ""}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, year: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Грузоп. (кг)</Label>
                <Input
                  type="number"
                  placeholder="3500"
                  value={vehicleForm.capacityKg ?? ""}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, capacityKg: e.target.value ? parseFloat(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Объём (м³)</Label>
                <Input
                  type="number"
                  placeholder="18"
                  value={vehicleForm.capacityM3 ?? ""}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, capacityM3: e.target.value ? parseFloat(e.target.value) : null }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="glass_outline_easy" onClick={() => setIsCreateVehicleOpen(false)}>Отмена</Button>
              <Button onClick={handleCreateVehicle} disabled={isCreatingVehicle || !vehicleForm.plateNumber}>
                {isCreatingVehicle ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Диалог: создать водителя ── */}
      <Dialog open={isCreateDriverOpen} onOpenChange={setIsCreateDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить водителя</DialogTitle>
            <DialogDescription>Создаёт пользователя с ролью driver</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="driver@example.com"
                  value={driverForm.email ?? ""}
                  onChange={(e) => setDriverForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Полное имя *</Label>
                <Input
                  placeholder="Иван Петров"
                  value={driverForm.fullName ?? ""}
                  onChange={(e) => setDriverForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Пароль *</Label>
              <Input
                type="password"
                placeholder="Минимум 8 символов"
                value={driverForm.password ?? ""}
                onChange={(e) => setDriverForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер прав *</Label>
                <Input
                  placeholder="AA123456"
                  value={driverForm.licenseNumber ?? ""}
                  onChange={(e) => setDriverForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Срок действия прав *</Label>
                <Input
                  type="date"
                  value={driverForm.licenseExpiry ?? ""}
                  onChange={(e) => setDriverForm((f) => ({ ...f, licenseExpiry: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Транспортное средство *</Label>
              <Select
                value={driverForm.vehicleId ?? ""}
                onValueChange={(v) => setDriverForm((f) => ({ ...f, vehicleId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите свободное ТС" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Нет свободных ТС
                    </SelectItem>
                  ) : (
                    availableVehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {vehicleLabel(v)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="glass_outline_easy" onClick={() => setIsCreateDriverOpen(false)}>Отмена</Button>
              <Button
                onClick={handleCreateDriver}
                disabled={
                  isCreatingDriver ||
                  !driverForm.email || !driverForm.password || !driverForm.fullName ||
                  !driverForm.licenseNumber || !driverForm.licenseExpiry || !driverForm.vehicleId
                }
              >
                {isCreatingDriver ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Диалог: удалить ТС ── */}
      <Dialog open={!!deleteVehicleTarget} onOpenChange={(o) => !o && setDeleteVehicleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить ТС?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Транспортное средство {deleteVehicleTarget?.plateNumber} будет удалено из системы.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="glass_outline_easy" onClick={() => setDeleteVehicleTarget(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDeleteVehicle} disabled={isDeletingVehicle}>
              {isDeletingVehicle ? "Удаление..." : "Удалить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ── Диалог: создать менеджера ── */}
      <Dialog open={isCreateManagerOpen} onOpenChange={setIsCreateManagerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить менеджера</DialogTitle>
            <DialogDescription>Создаёт пользователя с ролью manager</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="manager@example.com"
                  value={managerForm.email}
                  onChange={(e) => setManagerForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Полное имя</Label>
                <Input
                  placeholder="Иван Петров"
                  value={managerForm.fullName}
                  onChange={(e) => setManagerForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input
                type="password"
                placeholder="Минимум 8 символов"
                value={managerForm.password}
                onChange={(e) => setManagerForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="glass_outline_easy" onClick={() => setIsCreateManagerOpen(false)}>Отмена</Button>
              <Button
                onClick={handleCreateManager}
                disabled={isCreatingManager || !managerForm.email || !managerForm.password || !managerForm.fullName}
              >
                {isCreatingManager ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Диалог: удалить менеджера ── */}
      <Dialog open={!!deleteManagerTarget} onOpenChange={(o) => !o && setDeleteManagerTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить менеджера?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Менеджер @{deleteManagerTarget?.slug} будет удалён из системы.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="glass_outline_easy" onClick={() => setDeleteManagerTarget(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDeleteManager} disabled={isDeletingManager}>
              {isDeletingManager ? "Удаление..." : "Удалить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

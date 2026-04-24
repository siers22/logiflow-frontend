"use client";

import { useState, useEffect } from "react";
import { Car, Plus, Pencil, Trash2, Weight, Box } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/lib/UserContext";
import { api } from "@/lib/api";
import type { Vehicle, VehicleCreate, VehicleUpdate } from "@/lib/api";

const STATUS_CONFIG: Record<
  Vehicle["status"],
  { label: string; className: string }
> = {
  available: {
    label: "Свободен",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  in_transit: {
    label: "В рейсе",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  maintenance: {
    label: "На ТО",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
        <Car className="w-7 h-7" />
      </div>
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
        Транспортные средства не найдены
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Добавьте первый автомобиль нажав кнопку выше
      </p>
    </div>
  );
}

export function VehiclesPage() {
  const { withAuth } = useUser();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Vehicle["status"] | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Partial<VehicleCreate & VehicleUpdate>>({});

  useEffect(() => {
    withAuth((token) => api.vehicles.list(token))
      .then(setVehicles)
      .catch((err) => toast.error(err.message ?? "Не удалось загрузить ТС"))
      .finally(() => setIsLoading(false));
  }, [withAuth]);

  const filtered =
    statusFilter === "all"
      ? vehicles
      : vehicles.filter((v) => v.status === statusFilter);

  const counts = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "available").length,
    in_transit: vehicles.filter((v) => v.status === "in_transit").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
  };

  const handleCreate = async () => {
    if (!form.plateNumber) return;
    setIsSaving(true);
    try {
      const created = await withAuth((token) =>
        api.vehicles.create(token, {
          plateNumber: form.plateNumber!,
          brand: form.brand ?? null,
          model: form.model ?? null,
          year: form.year ?? null,
          capacityKg: form.capacityKg ?? null,
          capacityM3: form.capacityM3 ?? null,
        }),
      );
      setVehicles((prev) => [...prev, created]);
      setIsCreateOpen(false);
      setForm({});
      toast.success("ТС добавлено");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось создать ТС");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    const data: VehicleUpdate = {};
    if (form.brand !== undefined) data.brand = form.brand;
    if (form.model !== undefined) data.model = form.model;
    if (form.year !== undefined) data.year = form.year;
    if (form.capacityKg !== undefined) data.capacityKg = form.capacityKg;
    if (form.capacityM3 !== undefined) data.capacityM3 = form.capacityM3;
    if (form.status !== undefined) data.status = form.status as Vehicle["status"];
    try {
      const updated = await withAuth((token) =>
        api.vehicles.update(token, editTarget.slug, data),
      );
      setVehicles((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v)),
      );
      setEditTarget(null);
      setForm({});
      toast.success("Изменения сохранены");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось сохранить изменения");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await withAuth((token) => api.vehicles.delete(token, deleteTarget.slug));
      setVehicles((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("ТС удалено");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось удалить ТС");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditTarget(vehicle);
    setForm({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      capacityKg: vehicle.capacityKg,
      capacityM3: vehicle.capacityM3,
      status: vehicle.status,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">
              Транспортные средства
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление автопарком
            </p>
          </div>
          <Button onClick={() => { setForm({}); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Добавить ТС
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Всего", value: counts.total, icon: <Car className="w-4 h-4 text-gray-500" /> },
            { label: "Свободны", value: counts.available, icon: <Car className="w-4 h-4 text-green-600" /> },
            { label: "В рейсе", value: counts.in_transit, icon: <Car className="w-4 h-4 text-blue-600" /> },
            { label: "На ТО", value: counts.maintenance, icon: <Car className="w-4 h-4 text-orange-500" /> },
          ].map((s) => (
            <Card key={s.label} variant="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{s.label}</CardTitle>
                {s.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {s.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Список */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Список ТС</CardTitle>
                <CardDescription>
                  {filtered.length} из {vehicles.length}
                </CardDescription>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as Vehicle["status"] | "all")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="available">Свободен</SelectItem>
                  <SelectItem value="in_transit">В рейсе</SelectItem>
                  <SelectItem value="maintenance">На ТО</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Загрузка...
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {filtered.map((vehicle) => {
                  const s = STATUS_CONFIG[vehicle.status];
                  return (
                    <div
                      key={vehicle.id}
                      className="rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.07] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {vehicle.capacityKg && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Weight className="w-3 h-3" />
                                  {vehicle.capacityKg} кг
                                </span>
                              )}
                              {vehicle.capacityM3 && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Box className="w-3 h-3" />
                                  {vehicle.capacityM3} м³
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={s.className}>{s.label}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(vehicle)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(vehicle)}
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
      </div>

      {/* Создание ТС */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, plateNumber: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Марка</Label>
                <Input
                  placeholder="Mercedes-Benz"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value || null }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Модель</Label>
                <Input
                  placeholder="Sprinter"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, model: e.target.value || null }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Год</Label>
                <Input
                  type="number"
                  placeholder="2021"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      year: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Грузоп. (кг)</Label>
                <Input
                  type="number"
                  placeholder="3500"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacityKg: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Объём (м³)</Label>
                <Input
                  type="number"
                  placeholder="18"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacityM3: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="glass_outline_easy"
                onClick={() => setIsCreateOpen(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleCreate} disabled={isSaving || !form.plateNumber}>
                {isSaving ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Редактирование ТС */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать ТС</DialogTitle>
            <DialogDescription>{editTarget?.plateNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Марка</Label>
                <Input
                  value={form.brand ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value || null }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Модель</Label>
                <Input
                  value={form.model ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, model: e.target.value || null }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Год</Label>
                <Input
                  type="number"
                  value={form.year ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      year: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Грузоп. (кг)</Label>
                <Input
                  type="number"
                  value={form.capacityKg ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacityKg: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Объём (м³)</Label>
                <Input
                  type="number"
                  value={form.capacityM3 ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacityM3: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.status ?? editTarget?.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Vehicle["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Свободен</SelectItem>
                  <SelectItem value="in_transit">В рейсе</SelectItem>
                  <SelectItem value="maintenance">На ТО</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="glass_outline_easy"
                onClick={() => setEditTarget(null)}
              >
                Отмена
              </Button>
              <Button onClick={handleEdit} disabled={isSaving}>
                {isSaving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить ТС?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Транспортное средство{" "}
              {deleteTarget?.plateNumber} будет удалено из системы.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="glass_outline_easy"
              onClick={() => setDeleteTarget(null)}
            >
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving ? "Удаление..." : "Удалить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

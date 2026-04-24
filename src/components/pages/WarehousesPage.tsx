"use client";

import { useState, useEffect } from "react";
import {
  Warehouse as WarehouseIcon,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Building2,
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
import type { Warehouse, WarehouseCreate, WarehouseUpdate } from "@/lib/api";

const STATUS_CONFIG: Record<
  Warehouse["status"],
  { label: string; className: string }
> = {
  active: {
    label: "Активен",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  inactive: {
    label: "Неактивен",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
        <WarehouseIcon className="w-7 h-7" />
      </div>
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
        Склады не найдены
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Создайте первый склад нажав кнопку выше
      </p>
    </div>
  );
}

export function WarehousesPage() {
  const { user, withAuth } = useUser();
  const isAdmin = user?.role === "admin";

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Warehouse["status"] | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Partial<WarehouseCreate & WarehouseUpdate>>({});

  useEffect(() => {
    withAuth((token) => api.warehouses.list(token))
      .then(setWarehouses)
      .catch((err) => toast.error(err.message ?? "Не удалось загрузить склады"))
      .finally(() => setIsLoading(false));
  }, [withAuth]);

  const filtered =
    statusFilter === "all"
      ? warehouses
      : warehouses.filter((w) => w.status === statusFilter);

  const counts = {
    total: warehouses.length,
    active: warehouses.filter((w) => w.status === "active").length,
    inactive: warehouses.filter((w) => w.status === "inactive").length,
  };

  const handleCreate = async () => {
    if (!form.name || !form.address) return;
    setIsSaving(true);
    try {
      const created = await withAuth((token) =>
        api.warehouses.create(token, {
          name: form.name!,
          address: form.address!,
          city: form.city ?? null,
          latitude: form.latitude ?? null,
          longitude: form.longitude ?? null,
        }),
      );
      setWarehouses((prev) => [...prev, created]);
      setIsCreateOpen(false);
      setForm({});
      toast.success("Склад добавлен");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось создать склад");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    const data: WarehouseUpdate = {};
    if (form.name !== undefined) data.name = form.name;
    if (form.address !== undefined) data.address = form.address;
    if (form.city !== undefined) data.city = form.city;
    if (form.latitude !== undefined) data.latitude = form.latitude;
    if (form.longitude !== undefined) data.longitude = form.longitude;
    if (form.status !== undefined) data.status = form.status as Warehouse["status"];
    try {
      const updated = await withAuth((token) =>
        api.warehouses.update(token, editTarget.slug, data),
      );
      setWarehouses((prev) =>
        prev.map((w) => (w.id === updated.id ? updated : w)),
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
      await withAuth((token) => api.warehouses.delete(token, deleteTarget.slug));
      setWarehouses((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Склад удалён");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось удалить склад");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditTarget(warehouse);
    setForm({
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      latitude: warehouse.latitude,
      longitude: warehouse.longitude,
      status: warehouse.status,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Склады</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isAdmin ? "Управление складами" : "Список складов"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setForm({}); setIsCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Добавить склад
            </Button>
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Всего",
              value: counts.total,
              icon: <Building2 className="w-4 h-4 text-gray-500" />,
            },
            {
              label: "Активны",
              value: counts.active,
              icon: <Building2 className="w-4 h-4 text-green-600" />,
            },
            {
              label: "Неактивны",
              value: counts.inactive,
              icon: <Building2 className="w-4 h-4 text-gray-400" />,
            },
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
                <CardTitle>Список складов</CardTitle>
                <CardDescription>
                  {filtered.length} из {warehouses.length}
                </CardDescription>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as Warehouse["status"] | "all")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
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
                {filtered.map((warehouse) => {
                  const s = STATUS_CONFIG[warehouse.status];
                  return (
                    <div
                      key={warehouse.id}
                      className="rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.07] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                            <WarehouseIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {warehouse.name}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {warehouse.city
                                ? `${warehouse.city}, ${warehouse.address}`
                                : warehouse.address}
                            </div>
                            {warehouse.latitude && warehouse.longitude && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {warehouse.latitude.toFixed(4)},{" "}
                                {warehouse.longitude.toFixed(4)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={s.className}>{s.label}</Badge>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(warehouse)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(warehouse)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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

      {/* Создание склада (только admin) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить склад</DialogTitle>
            <DialogDescription>Введите данные нового склада</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                placeholder="Главный склад"
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Адрес *</Label>
              <Input
                placeholder="ул. Складская, 12"
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Город</Label>
              <Input
                placeholder="Москва"
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value || null }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Широта</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="55.7558"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      latitude: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Долгота</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="37.6176"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      longitude: e.target.value ? parseFloat(e.target.value) : null,
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
              <Button
                onClick={handleCreate}
                disabled={isSaving || !form.name || !form.address}
              >
                {isSaving ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Редактирование склада */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать склад</DialogTitle>
            <DialogDescription>{editTarget?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Адрес</Label>
              <Input
                value={form.address ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Город</Label>
              <Input
                value={form.city ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value || null }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Широта</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      latitude: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Долгота</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.longitude ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      longitude: e.target.value ? parseFloat(e.target.value) : null,
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
                  setForm((f) => ({ ...f, status: v as Warehouse["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
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
            <DialogTitle>Удалить склад?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Склад «{deleteTarget?.name}» будет
              удалён из системы.
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

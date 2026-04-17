"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Star,
  User,
  IdCard,
  Car,
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
import type { Driver, DriverCreate, DriverUpdate } from "@/lib/api";

const STATUS_CONFIG: Record<
  Driver["status"],
  { label: string; className: string }
> = {
  available: {
    label: "Доступен",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  on_route: {
    label: "В пути",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  off_duty: {
    label: "Не на смене",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
        <Truck className="w-7 h-7" />
      </div>
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
        Водители не найдены
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Создайте первого водителя нажав кнопку выше
      </p>
    </div>
  );
}

export function DriversPage() {
  const { withAuth } = useUser();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Driver["status"] | "all">(
    "all",
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<Partial<DriverCreate & DriverUpdate>>({});

  useEffect(() => {
    withAuth((token) => api.drivers.list(token))
      .then(setDrivers)
      .catch((err) => toast.error(err.message ?? "Не удалось загрузить водителей"))
      .finally(() => setIsLoading(false));
  }, [withAuth]);

  const filtered =
    statusFilter === "all"
      ? drivers
      : drivers.filter((d) => d.status === statusFilter);

  const counts = {
    total: drivers.length,
    available: drivers.filter((d) => d.status === "available").length,
    on_route: drivers.filter((d) => d.status === "on_route").length,
    off_duty: drivers.filter((d) => d.status === "off_duty").length,
  };

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.fullName || !form.licenseNumber || !form.licenseExpiry) return;
    setIsSaving(true);
    try {
      const created = await withAuth((token) =>
        api.drivers.create(token, {
          email: form.email!,
          password: form.password!,
          fullName: form.fullName!,
          licenseNumber: form.licenseNumber!,
          licenseExpiry: form.licenseExpiry!,
          vehicleId: form.vehicleId ?? null,
        }),
      );
      setDrivers((prev) => [...prev, created]);
      setIsCreateOpen(false);
      setForm({});
      toast.success("Водитель добавлен");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось создать водителя");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    const data: DriverUpdate = {};
    if (form.licenseNumber !== undefined) data.licenseNumber = form.licenseNumber;
    if (form.licenseExpiry !== undefined) data.licenseExpiry = form.licenseExpiry;
    if (form.vehicleId !== undefined) data.vehicleId = form.vehicleId;
    if (form.status !== undefined) data.status = form.status as Driver["status"];
    try {
      const updated = await withAuth((token) =>
        api.drivers.update(token, editTarget.slug, data),
      );
      setDrivers((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
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
      await withAuth((token) => api.drivers.delete(token, deleteTarget.slug));
      setDrivers((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Водитель удалён");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось удалить водителя");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (driver: Driver) => {
    setEditTarget(driver);
    setForm({
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      vehicleId: driver.vehicleId,
      status: driver.status,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Водители</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление водителями системы
            </p>
          </div>
          <Button onClick={() => { setForm({}); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Добавить водителя
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Всего", value: counts.total, icon: <Truck className="w-4 h-4 text-gray-500" /> },
            { label: "Доступны", value: counts.available, icon: <User className="w-4 h-4 text-green-600" /> },
            { label: "В пути", value: counts.on_route, icon: <Truck className="w-4 h-4 text-blue-600" /> },
            { label: "Не на смене", value: counts.off_duty, icon: <User className="w-4 h-4 text-gray-400" /> },
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
                <CardTitle>Список водителей</CardTitle>
                <CardDescription>
                  {filtered.length} из {drivers.length}
                </CardDescription>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as Driver["status"] | "all")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="on_route">В пути</SelectItem>
                  <SelectItem value="off_duty">Не на смене</SelectItem>
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
                {filtered.map((driver) => {
                  const s = STATUS_CONFIG[driver.status];
                  return (
                    <div
                      key={driver.id}
                      className="rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.07] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              @{driver.slug}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <IdCard className="w-3 h-3" />
                                {driver.licenseNumber}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                до {driver.licenseExpiry}
                              </span>
                              {driver.vehicleId && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Car className="w-3 h-3" /> ТС привязано
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {driver.rating.toFixed(1)}
                          </span>
                          <Badge className={s.className}>{s.label}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(driver)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(driver)}
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

      {/* Создание водителя */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить водителя</DialogTitle>
            <DialogDescription>
              Создаёт пользователя с ролью driver
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="driver@example.com"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Полное имя</Label>
                <Input
                  placeholder="Иван Петров"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input
                type="password"
                placeholder="Минимум 8 символов"
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер прав</Label>
                <Input
                  placeholder="AA123456"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, licenseNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Срок действия прав</Label>
                <Input
                  type="date"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, licenseExpiry: e.target.value }))
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
                disabled={isSaving || !form.email || !form.password || !form.fullName || !form.licenseNumber || !form.licenseExpiry}
              >
                {isSaving ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Редактирование водителя */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать водителя</DialogTitle>
            <DialogDescription>@{editTarget?.slug}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер прав</Label>
                <Input
                  value={form.licenseNumber ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, licenseNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Срок действия прав</Label>
                <Input
                  type="date"
                  value={form.licenseExpiry ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, licenseExpiry: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.status ?? editTarget?.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Driver["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="on_route">В пути</SelectItem>
                  <SelectItem value="off_duty">Не на смене</SelectItem>
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
            <DialogTitle>Удалить водителя?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Водитель @{deleteTarget?.slug} будет
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

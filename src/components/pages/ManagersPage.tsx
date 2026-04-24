"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, User, Building2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/lib/UserContext";
import { api, type Manager } from "@/lib/api";

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
        <Users className="w-7 h-7" />
      </div>
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
        Менеджеры не найдены
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Добавьте первого менеджера нажав кнопку выше
      </p>
    </div>
  );
}

interface CreateForm {
  email: string;
  password: string;
  fullName: string;
  warehouseId: string;
}

export function ManagersPage() {
  const { withAuth } = useUser();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Partial<CreateForm>>({});

  useEffect(() => {
    withAuth((token) => api.managers.list(token))
      .then(setManagers)
      .catch((err: Error) => toast.error(err.message ?? "Не удалось загрузить менеджеров"))
      .finally(() => setIsLoading(false));
  }, [withAuth]);

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.fullName) return;
    setIsSaving(true);
    try {
      const created = await withAuth((token) =>
        api.managers.create(token, {
          email: form.email!,
          password: form.password!,
          fullName: form.fullName!,
          warehouseId: form.warehouseId || null,
        }),
      );
      setManagers((prev) => [...prev, created]);
      setIsCreateOpen(false);
      setForm({});
      toast.success("Менеджер добавлен");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось создать менеджера");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await withAuth((token) => api.managers.delete(token, deleteTarget.slug));
      setManagers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Менеджер удалён");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Не удалось удалить менеджера");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Менеджеры</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление менеджерами системы
            </p>
          </div>
          <Button onClick={() => { setForm({}); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Добавить менеджера
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-4">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Всего менеджеров</CardTitle>
              <Users className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? "—" : managers.length}
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Со складом</CardTitle>
              <Building2 className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? "—" : managers.filter((m) => m.warehouseId).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Список */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Список менеджеров</CardTitle>
            <CardDescription>{managers.length} записей</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Загрузка...
              </div>
            ) : managers.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {managers.map((manager) => (
                  <div
                    key={manager.id}
                    className="rounded-xl p-4 bg-white/50 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.07] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            @{manager.slug}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">
                              ID: #{shortId(manager.id)}
                            </span>
                            {manager.warehouseId ? (
                              <span className="flex items-center gap-1 text-xs text-blue-500">
                                <Building2 className="w-3 h-3" />
                                Склад привязан
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Без склада</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(manager)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Создание менеджера */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить менеджера</DialogTitle>
            <DialogDescription>
              Создаёт пользователя с ролью manager
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="manager@example.com"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Полное имя</Label>
                <Input
                  placeholder="Иван Петров"
                  value={form.fullName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input
                type="password"
                placeholder="Минимум 8 символов"
                value={form.password ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ID склада (необязательно)</Label>
              <Input
                placeholder="UUID склада"
                value={form.warehouseId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
              />
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
                disabled={isSaving || !form.email || !form.password || !form.fullName}
              >
                {isSaving ? "Создание..." : "Создать"}
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
            <DialogTitle>Удалить менеджера?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Менеджер @{deleteTarget?.slug} будет
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

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUser } from "@/lib/UserContext";
import { api, type Notification } from "@/lib/api";
import { errorMessage } from "@/lib/api-errors";
import { saveBlob } from "@/lib/documents";
import { toast } from "sonner";

export function NotificationPanel() {
  const { withAuth } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const loading = useRef(false), openingLock = useRef(false);

  const load = useCallback(() => {
    if (loading.current) return;
    loading.current = true; setIsLoading(true);
    withAuth((token) => api.notifications.list(token))
      .then(value => { setNotifications(value); setError(""); })
      .catch(err => setError(errorMessage(err)))
      .finally(() => { loading.current = false; setIsLoading(false); });
  }, [withAuth]);

  useEffect(() => {
    load();
    const tick = () => { if (!document.hidden) load(); };
    const timer = window.setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick); window.addEventListener("logiflow:changed", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); window.removeEventListener("logiflow:changed", tick); };
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function markRead(id: string) {
    return withAuth((token) => api.notifications.markRead(token, id))
      .then(() =>
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        ),
      )
      .catch(err => toast.error(errorMessage(err)));
  }

  function markAllRead() {
    const unread = notifications.filter((n) => !n.isRead);
    unread.forEach((n) => markRead(n.id));
  }

  async function openNotification(notification: Notification) {
    if (!notification.isRead) markRead(notification.id);
    if (!notification.documentId) return;
    if (openingLock.current) return;
    openingLock.current = true; setOpening(true);
    try {
      saveBlob(await withAuth(token => api.documents.download(token, notification.documentId!)), `document-${notification.documentId}.pdf`);
    } catch (err) { toast.error(errorMessage(err)); }
    finally { openingLock.current = false; setOpening(false); }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative inline-flex cursor-pointer">
          <Button variant="glass_outline" size="default" aria-label="Уведомления">
            <Bell className="w-5 h-5" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center leading-none pointer-events-none">
              {unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 rounded-2xl border-0 shadow-2xl"
      >
        <div className="glass-card-outline rounded-2xl overflow-hidden">
          {/* Хедер */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Уведомления
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400">
                  {unreadCount} новых
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs px-2 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* Список */}
          <div className="max-h-[380px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.15)_transparent] dark:[scrollbar-color:rgba(255,255,255,0.1)_transparent]">
            {error && <p role="alert" className="p-4 text-sm text-red-600">{error} <button className="underline" onClick={load}>Повторить</button></p>}
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                Загрузка...
              </div>
            ) : !error && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Нет уведомлений</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  disabled={opening}
                  onClick={() => openNotification(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 ${
                    !n.isRead ? "bg-blue-50/50 dark:bg-blue-500/[0.05]" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gray-100 dark:bg-white/[0.05]">
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-300"}`}
                      >
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    {n.documentId && <p className="text-xs text-blue-600 mt-1">Скачать PDF</p>}
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(n.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Футер */}
          <div className="px-4 py-2.5 border-t border-black/[0.06] dark:border-white/[0.06]">
            <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
              Уведомления загружаются с сервера
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

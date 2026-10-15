'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  api,
  ApiError,
  type Order,
  type Assignment,
  type Route,
  type DeliveryReceipt,
  type WarehouseOperation,
  type OrderIncident,
  type OrderReferences,
} from '@/lib/api';
import { errorMessage } from '@/lib/api-errors';
import { useUser } from '@/lib/UserContext';
type State = {
  references: OrderReferences | null;
  order: Order | null;
  assignments: Assignment[] | null;
  operations: WarehouseOperation[] | null;
  incidents: OrderIncident[] | null;
  receipt: DeliveryReceipt | null | undefined;
  route: Route | null;
  errors: Record<string, string>;
  loading: boolean;
};
const empty: State = {
  references: null,
  order: null,
  assignments: null,
  operations: null,
  incidents: null,
  receipt: undefined,
  route: null,
  errors: {},
  loading: true,
};
export function useOrderWorkspace(orderId: string) {
  const { user, withAuth } = useUser();
  const [state, setState] = useState<State>(empty),
    [busy, setBusy] = useState(false),
    [syncing, setSyncing] = useState(false);
  const lock = useRef(false),
    generation = useRef(0),
    currentOrder = useRef(orderId),
    polling = useRef(false);
  currentOrder.current = orderId;
  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const run = ++generation.current;
    setSyncing(true);
    const live = () =>
      run === generation.current && currentOrder.current === orderId;
    let order: Order;
    try {
      order = await withAuth((token) => api.orders.get(token, orderId));
      if (live())
        setState((previous) => ({
          ...previous,
          order,
          errors: { ...previous.errors, order: '' },
          loading: false,
        }));
    } catch (err) {
      if (live())
        setState((previous) => ({
          ...(err instanceof ApiError && [403, 404].includes(err.status)
            ? empty
            : previous),
          loading: false,
          errors: { ...previous.errors, order: errorMessage(err) },
        }));
      if (live()) setSyncing(false);
      return;
    }
    const requests = {
      references: () => withAuth((token) => api.orders.references(token, orderId)),
      operations: () =>
        withAuth((token) => api.warehouseOperations.list(token, orderId)),
      incidents: () => withAuth((token) => api.incidents.list(token, orderId)),
      receipt: () =>
        withAuth((token) => api.deliveryReceipts.get(token, orderId)),
      assignments: () =>
        user?.role === 'client'
          ? Promise.resolve([])
          : withAuth((token) =>
              user?.role === 'driver'
                ? api.assignments.list(token, { orderId })
                : api.orders.listAssignments(token, orderId),
            ),
      route: () => withAuth((token) => api.routes.get(token, orderId)),
    };
    const keys = Object.keys(requests) as (keyof typeof requests)[];
    const results = await Promise.allSettled(
      keys.map((key) => requests[key]()),
    );
    if (!live()) return;
    setSyncing(false);
    setState((previous) => {
      const next = { ...previous, errors: { ...previous.errors } };
      keys.forEach((key, i) => {
        const result = results[i];
        if (result.status === 'fulfilled') {
          Object.assign(next, { [key]: result.value });
          delete next.errors[key];
        } else {
          next.errors[key] = errorMessage(result.reason);
          Object.assign(next, { [key]: key === 'receipt' ? undefined : null });
        }
      });
      return next;
    });
  }, [orderId, user?.id, user?.role, withAuth]);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    setState(empty);
    refresh();
    const tick = async () => {
      if (document.hidden || polling.current || lock.current) return;
      polling.current = true;
      try {
        await refresh();
      } finally {
        polling.current = false;
      }
    };
    const timer = window.setInterval(tick, 15000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      invalidate();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh, invalidate]);
  const command = useCallback(
    async (
      execute: (token: string) => Promise<unknown>,
      success: string,
      onSuccess?: () => void,
    ): Promise<boolean> => {
      if (lock.current) return false;
      lock.current = true;
      setBusy(true);
      try {
        await withAuth(execute);
        if (currentOrder.current !== orderId) return false;
        toast.success(success);
        window.dispatchEvent(new Event('logiflow:changed'));
        if (onSuccess) {
          // Navigation replaces refresh when the command revokes access to this order.
          onSuccess();
          return true;
        }
        await refresh();
        return true;
      } catch (err) {
        if (currentOrder.current !== orderId) return false;
        toast.error(errorMessage(err));
        if (err instanceof ApiError && err.section)
          document
            .getElementById(err.section)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Never blindly replay an immutable command after a conflict or lost response.
        await refresh();
        if (!(err instanceof ApiError))
          toast.info(
            'Ответ не получен. Данные перечитаны: проверьте журнал перед повторным сохранением.',
          );
        return false;
      } finally {
        lock.current = false;
        if (currentOrder.current === orderId) setBusy(false);
      }
    },
    [orderId, withAuth, refresh],
  );
  return { ...state, busy: busy || syncing, refresh, command };
}
export type OrderCommand = ReturnType<typeof useOrderWorkspace>['command'];

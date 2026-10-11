'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, type Driver, type Manager } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { errorMessage } from '@/lib/api-errors';
interface Workspace {
  driver: Driver | null;
  manager: Manager | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, withAuth } = useUser();
  const [state, setState] = useState<Omit<Workspace, 'reload'>>({
    driver: null,
    manager: null,
    loading: true,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((v) => v + 1), []);
  useEffect(() => {
    let live = true;
    setState({ driver: null, manager: null, loading: true, error: null });
    const load = async () => {
      let driver: Driver | null = null,
        manager: Manager | null = null;
      if (user?.role === 'driver') {
        driver =
          (await withAuth((token) => api.drivers.list(token))).find(
            (item) => item.userId === user.id,
          ) ?? null;
        if (!driver)
          throw new Error(
            'Профиль водителя не найден. Обратитесь к администратору.',
          );
      }
      if (user?.role === 'manager') {
        manager =
          (await withAuth((token) => api.managers.list(token))).find(
            (item) => item.userId === user.id,
          ) ?? null;
        if (!manager?.warehouseId)
          throw new Error(
            'Профиль менеджера или его склад не найден. Обратитесь к администратору.',
          );
      }
      if (live) setState({ driver, manager, loading: false, error: null });
    };
    load().catch((error) => {
      if (live)
        setState({
          driver: null,
          manager: null,
          loading: false,
          error: errorMessage(error),
        });
    });
    return () => {
      live = false;
    };
  }, [user?.id, user?.role, withAuth, revision]);
  return (
    <Context.Provider value={{ ...state, reload }}>{children}</Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error('WorkspaceProvider is missing');
  return context;
}

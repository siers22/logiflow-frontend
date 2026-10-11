import { MultiRoleAuthGuard } from '@/components/AuthGuard';
import { CounterpartiesPage } from '@/components/pages/CounterpartiesPage';
export const metadata = { title: 'Контрагенты — LogiFlow' };
export default function Page() {
  return (
    <MultiRoleAuthGuard allowedRoles={['client', 'manager', 'admin']}>
      <CounterpartiesPage />
    </MultiRoleAuthGuard>
  );
}

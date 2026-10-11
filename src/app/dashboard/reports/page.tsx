import { MultiRoleAuthGuard } from '@/components/AuthGuard';
import { ReportsPage } from '@/components/pages/ReportsPage';
export const metadata = { title: 'Отчёты — LogiFlow' };
export default function Page() {
  return (
    <MultiRoleAuthGuard allowedRoles={['admin', 'manager']}>
      <ReportsPage />
    </MultiRoleAuthGuard>
  );
}

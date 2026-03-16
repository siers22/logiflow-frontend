import { AuthGuard } from '@/components/AuthGuard';
import { ManagerDashboard } from '@/components/dashboards/ManagerDashboard';

export const metadata = { title: 'Менеджер — LogiFlow' };

export default function ManagerPage() {
  return (
    <AuthGuard allowedRole="manager">
      <ManagerDashboard />
    </AuthGuard>
  );
}

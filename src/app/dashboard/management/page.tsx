import { AuthGuard } from '@/components/AuthGuard';
import { ManagementDashboard } from '@/components/dashboards/ManagementDashboard';

export const metadata = { title: 'Руководство — LogiFlow' };

export default function ManagementPage() {
  return (
    <AuthGuard allowedRole="management">
      <ManagementDashboard />
    </AuthGuard>
  );
}

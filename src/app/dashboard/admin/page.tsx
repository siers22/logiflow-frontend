import { AuthGuard } from '@/components/AuthGuard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';

export const metadata = { title: 'Администратор — LogiFlow' };

export default function AdminPage() {
  return (
    <AuthGuard allowedRole="admin">
      <AdminDashboard />
    </AuthGuard>
  );
}

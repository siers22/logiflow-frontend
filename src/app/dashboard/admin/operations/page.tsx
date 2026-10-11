import { AuthGuard } from '@/components/AuthGuard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';

export const metadata = { title: 'Операции — LogiFlow' };

export default function AdminOperationsPage() {
  return <AuthGuard allowedRole="admin"><AdminDashboard /></AuthGuard>;
}

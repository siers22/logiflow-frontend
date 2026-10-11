import { AuthGuard } from '@/components/AuthGuard';
import { AdminHome } from '@/components/new/AdminHome';

export const metadata = { title: 'Администратор — LogiFlow' };

export default function AdminPage() {
  return (
    <AuthGuard allowedRole="admin">
      <AdminHome />
    </AuthGuard>
  );
}

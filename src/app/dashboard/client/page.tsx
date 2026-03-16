import { AuthGuard } from '@/components/AuthGuard';
import { ClientDashboard } from '@/components/dashboards/ClientDashboard';

export const metadata = { title: 'Клиент — LogiFlow' };

export default function ClientPage() {
  return (
    <AuthGuard allowedRole="client">
      <ClientDashboard />
    </AuthGuard>
  );
}

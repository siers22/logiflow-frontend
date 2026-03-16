import { AuthGuard } from '@/components/AuthGuard';
import { DriverDashboard } from '@/components/dashboards/DriverDashboard';

export const metadata = { title: 'Водитель — LogiFlow' };

export default function DriverPage() {
  return (
    <AuthGuard allowedRole="driver">
      <DriverDashboard />
    </AuthGuard>
  );
}

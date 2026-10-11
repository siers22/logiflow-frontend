import { MultiRoleAuthGuard } from '@/components/AuthGuard';
import { DocumentsPage } from '@/components/pages/DocumentsPage';
export const metadata = { title: 'Документы — LogiFlow' };
export default function Page() {
  return (
    <MultiRoleAuthGuard allowedRoles={['admin', 'manager', 'client', 'driver']}>
      <DocumentsPage />
    </MultiRoleAuthGuard>
  );
}

import { MultiRoleAuthGuard } from '@/components/AuthGuard';
import { WarehouseQueuePage } from '@/components/pages/WarehouseQueuePage';
export const metadata = { title: 'Очередь склада — LogiFlow' };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <MultiRoleAuthGuard allowedRoles={['manager', 'admin']}>
      <WarehouseQueuePage key={id} warehouseId={id} />
    </MultiRoleAuthGuard>
  );
}

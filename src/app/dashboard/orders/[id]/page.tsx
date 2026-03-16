import { OrderDetailsPage } from '@/components/OrderDetailsPage';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Заявка ${id} — LogiFlow` };
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  return <OrderDetailsPage orderId={id} />;
}

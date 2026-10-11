'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OrderDraftForm } from './OrderDraftForm';
export function CreateOrderButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Новая заявка</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая заявка на перевозку</DialogTitle>
          <DialogDescription>
            Создайте черновик, затем сохраните реквизиты перевозки.
          </DialogDescription>
        </DialogHeader>
        <OrderDraftForm
          onSaved={(order) => {
            setOpen(false);
            router.push(`/dashboard/orders/${order.id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

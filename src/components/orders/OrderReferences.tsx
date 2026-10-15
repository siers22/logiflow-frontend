'use client';
import { createContext, useContext, type ReactNode } from 'react';
import type { OrderReferences, WarehouseOperation } from '@/lib/api';
import { referenceLabel, operationReferenceLabel } from '@/lib/order-reference-labels';

const ReferencesContext = createContext<{
  labels: OrderReferences | null;
  operations: WarehouseOperation[] | null;
}>({ labels: null, operations: null });

export function OrderReferencesProvider({ labels, operations, children }: {
  labels: OrderReferences | null;
  operations: WarehouseOperation[] | null;
  children: ReactNode;
}) {
  return <ReferencesContext.Provider value={{ labels, operations }}>{children}</ReferencesContext.Provider>;
}

export function ReferenceLabel({ kind, id }: {
  kind: keyof OrderReferences | 'operations';
  id?: string | null;
}) {
  const refs = useContext(ReferencesContext);
  return <>{kind === 'operations'
    ? operationReferenceLabel(refs.operations, id)
    : referenceLabel(refs.labels, kind, id)}</>;
}

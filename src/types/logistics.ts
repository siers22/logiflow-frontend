export type CounterpartyKind = 'organization' | 'entrepreneur' | 'individual';
export interface CounterpartyWrite {
  kind: CounterpartyKind;
  name: string;
  inn?: string;
  kpp?: string;
  address: string;
  contactName: string;
  phone?: string;
  email?: string;
  shared?: boolean;
  status?: 'active' | 'archived';
}
export interface Counterparty extends CounterpartyWrite {
  id: string;
  ownerUserId: string;
  shared: boolean;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}
export interface TransportDetailsWrite {
  senderId: string;
  recipientId: string;
  carrierId: string;
  basisType: 'contract' | 'transport_request';
  basisNumber: string;
  basisDate: string;
  packageCount: number;
  terms?: string;
}
export interface TransportDetails extends Omit<
  TransportDetailsWrite,
  'senderId' | 'recipientId' | 'carrierId'
> {
  sender: Counterparty;
  recipient: Counterparty;
  carrier: Counterparty;
  recordedByUserId: string;
  recordedAt: string;
}
export interface DeliveryReceiptCreate {
  assignmentId: string;
  recipientName: string;
  recipientRole: string;
  authorityBasis: string;
  packageCount: number;
  cargoCondition: string;
  sealNumber?: string;
  comment?: string;
  receivedAt?: string;
}
export interface DeliveryReceipt extends DeliveryReceiptCreate {
  id: string;
  orderId: string;
  receivedAt: string;
  recordedAt: string;
  recordedByUserId: string;
}
export type WarehouseOperationType =
  'receive' | 'load' | 'unload' | 'undo_load' | 'return_to_sender';
export interface WarehouseOperationCreate {
  operationType: WarehouseOperationType;
  assignmentId?: string;
  packageCount: number;
  cargoCondition: string;
  comment?: string;
  recipientName?: string;
}
export interface WarehouseOperation extends Omit<
  WarehouseOperationCreate,
  'assignmentId' | 'recipientName'
> {
  id: string;
  orderId: string;
  warehouseId: string;
  assignmentId: string | null;
  recipientName: string | null;
  createdByUserId: string;
  occurredAt: string;
}
export type WarehouseStage =
  | 'awaiting_receipt'
  | 'awaiting_assignment'
  | 'awaiting_loading'
  | 'ready_to_depart'
  | 'departed'
  | 'expected'
  | 'awaiting_unloading'
  | 'received'
  | 'awaiting_return'
  | 'returned_to_sender'
  | 'incident_open'
  | 'completed'
  | 'cancelled';
export type IncidentKind =
  | 'vehicle_breakdown'
  | 'cargo_damage'
  | 'quantity_discrepancy'
  | 'recipient_refusal'
  | 'other';
export type IncidentResolution =
  | 'accept_discrepancy'
  | 'accept_with_remarks'
  | 'remediated'
  | 'repaired'
  | 'resources_replaced'
  | 'recipient_accepted';
export interface OrderIncidentCreate {
  kind: IncidentKind;
  description: string;
  expectedPackages?: number;
  actualPackages?: number;
}
export interface OrderIncidentResolve {
  resolution: IncidentResolution;
  note: string;
  recipientName?: string;
}
export interface OrderIncident extends Omit<
  OrderIncidentCreate,
  'expectedPackages' | 'actualPackages'
> {
  id: string;
  orderId: string;
  assignmentId: string | null;
  warehouseId: string | null;
  sourceOperationId: string | null;
  expectedPackages: number | null;
  actualPackages: number | null;
  status: 'open' | 'resolved';
  reportedByUserId: string;
  reportedAt: string;
  resolution: IncidentResolution | '';
  resolutionNote: string;
  recipientName: string;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
}
export interface TripHandoverCreate {
  driverId: string;
  vehicleId: string;
  plannedTo: string;
  reason: string;
  location: string;
  cargoCondition: string;
}
export interface TripHandover extends TripHandoverCreate {
  id: string;
  orderId: string;
  previousAssignmentId: string;
  nextAssignmentId: string | null;
  createdByUserId: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt: string;
  outgoingConfirmedAt: string | null;
  completedAt: string | null;
}
export interface DispatchCandidate {
  id: string;
  driver_id: string;
  vehicle_id: string;
  score: number;
  reason: string;
}
export interface DispatchRecommendations {
  status: 'pending' | 'ready' | 'unavailable';
  createdAt: string | null;
  candidates: DispatchCandidate[];
}
export type DocumentType =
  | 'transport_order'
  | 'trip_assignment'
  | 'cargo_handover'
  | 'delivery_confirmation'
  | 'service_report'
  | 'cancellation_notice';

import type { DocumentType, InboxDocument } from './api.ts';
export const documentLabels: Record<DocumentType, string> = {
  transport_order: 'Карточка заявки на перевозку',
  trip_assignment: 'Рейсовое задание',
  cargo_handover: 'Протокол передачи груза',
  delivery_confirmation: 'Подтверждение доставки',
  service_report: 'Отчёт о выполненной перевозке',
  cancellation_notice: 'Уведомление об отмене заказа',
};
export function documentFilename(
  document: Pick<InboxDocument, 'id' | 'type'>,
): string {
  return `${document.type}-${document.id}.pdf`;
}
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

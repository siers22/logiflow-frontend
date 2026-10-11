const messages: Record<string, string> = {
  TRANSPORT_DETAILS_REQUIRED: 'Заполните и сохраните реквизиты перевозки.',
  DELIVERY_RECEIPT_REQUIRED: 'Сначала зафиксируйте фактическую приёмку груза.',
  DELIVERY_RECEIPT_CONFLICT:
    'Приёмка уже зарегистрирована. Загружена сохранённая запись.',
  COUNTERPARTY_ARCHIVED: 'Контрагент в архиве. Выберите действующую запись.',
  WAREHOUSE_OPERATION_REQUIRED:
    'Сначала подтвердите необходимую складскую операцию.',
  WAREHOUSE_OPERATION_CONFLICT:
    'Складская операция уже выполнена или назначение изменилось. Проверьте журнал.',
  WAREHOUSE_INACTIVE:
    'Склад неактивен: приёмка отправления и погрузка недоступны.',
  WAREHOUSE_IN_USE: 'Склад используется в действующих перевозках.',
  INCIDENT_OPEN:
    'Есть открытая проблема перевозки. Требуется решение ответственного менеджера.',
  INCIDENT_STALE: 'По этой проблеме уже принято решение. Обновите историю.',
  INCIDENT_RESOLUTION_INVALID:
    'Решение не соответствует виду проблемы или текущему состоянию перевозки.',
  ASSIGNMENT_STALE: 'Назначение изменилось. Проверьте актуальные данные.',
  ASSIGNMENT_EXPIRED: 'Срок предложения истёк. Требуется новое назначение.',
  RESOURCE_ALREADY_RESERVED:
    'Водитель или машина уже зарезервированы на это время.',
  FORBIDDEN_ACTOR: 'Это действие доступно другому участнику перевозки.',
  INVALID_ORDER_TRANSITION:
    'Состояние заказа изменилось или предыдущий этап ещё не завершён.',
  INVALID_ORDER_INPUT: 'Проверьте обязательные поля, количество груза и даты.',
  DRIVER_NOT_ELIGIBLE:
    'Водитель не допущен к перевозке. Проверьте его документы и доступность.',
  VEHICLE_NOT_ELIGIBLE:
    'Машина не допущена к перевозке. Проверьте документы и доступность.',
  DRIVER_LICENSE_EXPIRED: 'Срок водительского удостоверения истёк.',
  DRIVER_OUTSIDE_SHIFT: 'Плановое окно находится вне смены водителя.',
  VEHICLE_NOT_OPERATIONAL:
    'Машина недоступна для рейса. Проверьте её состояние.',
  VEHICLE_CAPACITY_EXCEEDED: 'Груз превышает вместимость выбранной машины.',
  VEHICLE_DOCUMENT_INVALID:
    'У машины нет действующей регистрации для этого рейса.',
  INVALID_TIME_WINDOW: 'Проверьте начало и конец временного окна.',
  CAPACITY_EXCEEDED: 'Груз превышает вместимость выбранной машины.',
};
export class ApiError extends Error {
  readonly userMessage: string;
  readonly section: 'transport' | 'receipt' | 'warehouse' | 'incidents' | null;
  constructor(
    readonly status: number,
    message: string,
    readonly code: string | null = null,
    readonly requestID: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.userMessage =
      messages[code ?? message] ??
      (status >= 500
        ? 'Сервис временно недоступен. Обновите данные и попробуйте позже.'
        : message);
    const key = code ?? message;
    this.section =
      key.startsWith('TRANSPORT_') || key.startsWith('COUNTERPARTY_')
        ? 'transport'
        : key.startsWith('DELIVERY_RECEIPT_')
          ? 'receipt'
          : key.startsWith('WAREHOUSE_')
            ? 'warehouse'
            : key.startsWith('INCIDENT_')
              ? 'incidents'
              : null;
  }
}
export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.userMessage
    : error instanceof Error
      ? error.message
      : 'Не удалось выполнить запрос. Обновите данные.';
}

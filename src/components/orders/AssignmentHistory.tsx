import type { Assignment, AssignmentStatus } from '@/lib/api';
const labels: Record<AssignmentStatus, string> = {
  pending_acceptance: 'Ожидают ответа',
  accepted: 'Приняты',
  active: 'Выполняются',
  rejected: 'Отклонены',
  expired: 'Срок истёк',
  released: 'Освобождены',
  completed: 'Завершены',
};
const format = (value: string) => new Date(value).toLocaleString('ru-RU');
export function AssignmentHistory({
  assignments,
}: {
  assignments: Assignment[];
}) {
  if (!assignments.length)
    return (
      <p className="text-sm text-muted-foreground">Назначений пока нет.</p>
    );
  return (
    <div className="space-y-5">
      {(Object.keys(labels) as AssignmentStatus[])
        .filter((status) => assignments.some((a) => a.status === status))
        .map((status) => (
          <section key={status} className="space-y-2">
            <h3 className="text-sm font-medium">{labels[status]}</h3>
            {assignments
              .filter((a) => a.status === status)
              .map((a) => (
                <article
                  key={a.id}
                  className="space-y-1 rounded-lg border p-3 text-sm break-words"
                >
                  <p>
                    Водитель: {a.driverId} · Машина рейса: {a.vehicleId}
                  </p>
                  <p>
                    {a.plannedFrom ? format(a.plannedFrom) : '—'} —{' '}
                    {a.plannedTo ? format(a.plannedTo) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.source === 'dispatch_recommendation'
                      ? 'По рекомендации'
                      : 'Ручное назначение'}{' '}
                    · Автор: {a.createdByUserId || '—'}
                    {a.assignedAt && ` · Предложено: ${format(a.assignedAt)}`}
                  </p>
                  {a.status === 'pending_acceptance' && (
                    <p>
                      Предложение до {format(a.offerExpiresAt)} ·{' '}
                      {Date.parse(a.offerExpiresAt) > Date.now()
                        ? `осталось ${Math.ceil((Date.parse(a.offerExpiresAt) - Date.now()) / 60000)} мин`
                        : 'срок истёк, ожидается обновление сервера'}
                    </p>
                  )}
                  {(
                    [
                      ['acceptedAt', 'Принято'],
                      ['rejectedAt', 'Отклонено'],
                      ['releasedAt', 'Освобождено'],
                      ['startedAt', 'Рейс начат'],
                      ['completedAt', 'Завершено'],
                    ] as const
                  ).map(
                    ([key, label]) =>
                      a[key] && (
                        <p key={key} className="text-xs">
                          {label}: {format(a[key])}
                        </p>
                      ),
                  )}
                  {a.rejectionReasonCode && (
                    <p>
                      Причина отказа: {a.rejectionReasonCode} ·{' '}
                      {a.rejectionComment}
                    </p>
                  )}
                  {a.releaseReasonCode && (
                    <p>Причина освобождения: {a.releaseReasonCode}</p>
                  )}
                  {a.recipientName && <p>Получатель: {a.recipientName}</p>}
                  {a.deliveryComment && <p>{a.deliveryComment}</p>}
                </article>
              ))}
          </section>
        ))}
    </div>
  );
}

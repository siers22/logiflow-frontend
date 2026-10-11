'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export function MicroservicesMonitor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Состояние сервисов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Публичный API мониторинга не подключён. Доступность сервисов здесь не
          проверяется.
        </p>
        {['Core', 'Dispatch', 'Documents', 'Routing'].map((service) => (
          <div
            key={service}
            className="flex justify-between rounded-lg border p-3 text-sm"
          >
            <strong>{service}</strong>
            <span className="text-muted-foreground">Нет данных</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

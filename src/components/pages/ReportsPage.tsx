'use client';
import { useEffect, useRef, useState } from 'react';
import { api, type DashboardReport, type OrderStatus } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { errorMessage } from '@/lib/api-errors';
import { saveBlob } from '@/lib/documents';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field, NativeSelect } from '@/components/orders/Fields';
export function ReportsPage() {
  const { withAuth } = useUser();
  const [report, setReport] = useState<DashboardReport | null>(null),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [status, setStatus] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    let live = true;
    withAuth((token) => api.reports.dashboard(token))
      .then((value) => {
        if (live) {
          setReport(value);
          setError('');
        }
      })
      .catch((err) => {
        if (live) setError(errorMessage(err));
      });
    return () => {
      live = false;
    };
  }, [withAuth, revision]);
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between">
          <h1>Отчёты</h1>
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Обновить сводку
          </Button>
        </div>
        {error && <p role="alert">{error}</p>}
        {report && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Всего заказов', report.orders.total],
              ['Завершено', report.orders.delivered],
              ['Выручка, ₽', report.revenue.total.toLocaleString('ru-RU')],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardHeader>
                  <CardTitle>{label}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl">{value}</CardContent>
              </Card>
            ))}
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Выгрузить заказы в XLSX</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (lock.current) return;
                if (from && to && Date.parse(from) >= Date.parse(to)) {
                  setError('Конец периода должен быть позже начала.');
                  return;
                }
                lock.current = true;
                setBusy(true);
                try {
                  saveBlob(
                    await withAuth((token) =>
                      api.reports.orders(token, {
                        ...(from ? { from: new Date(from).toISOString() } : {}),
                        ...(to ? { to: new Date(to).toISOString() } : {}),
                        ...(status ? { status: status as OrderStatus } : {}),
                      }),
                    ),
                    'logiflow-orders.xlsx',
                  );
                  setError('');
                } catch (err) {
                  setError(errorMessage(err));
                } finally {
                  lock.current = false;
                  setBusy(false);
                }
              }}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="С даты">
                  <Input
                    type="datetime-local"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </Field>
                <Field label="По дату">
                  <Input
                    type="datetime-local"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </Field>
                <Field label="Статус">
                  <NativeSelect
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Все</option>
                    {[
                      ['draft', 'Черновик'],
                      ['ready_for_dispatch', 'Готов к назначению'],
                      ['assigned', 'Назначен'],
                      ['in_transit', 'В пути'],
                      ['arrived', 'Прибыл'],
                      ['completed', 'Завершён'],
                      ['cancelled', 'Отменён'],
                    ].map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? 'Подготовка…' : 'Скачать XLSX'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

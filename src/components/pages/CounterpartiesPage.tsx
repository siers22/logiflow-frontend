'use client';
import { useEffect, useState } from 'react';
import { api, type Counterparty } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { errorMessage } from '@/lib/api-errors';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CounterpartyForm } from '@/components/CounterpartyForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
export function CounterpartiesPage() {
  const { user, withAuth } = useUser();
  const [parties, setParties] = useState<Counterparty[]>([]);
  const [offset, setOffset] = useState(0),
    [archived, setArchived] = useState(false),
    [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<Counterparty | null | undefined>(
    undefined,
  );
  const [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    withAuth((token) =>
      api.counterparties.list(token, {
        limit: 20,
        offset,
        includeArchived: archived,
      }),
    )
      .then((value) => {
        if (live) setParties(value);
      })
      .catch((err) => {
        if (live) setError(errorMessage(err));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [offset, archived, revision, withAuth]);
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h1>Контрагенты</h1>
          <Button onClick={() => setEditing(null)}>Добавить контрагента</Button>
        </div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => {
              setArchived(e.target.checked);
              setOffset(0);
            }}
          />{' '}
          Показывать архив
        </label>
        {error ? (
          <p role="alert">
            {error}{' '}
            <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
              Повторить
            </Button>
          </p>
        ) : loading ? (
          <p>Загрузка…</p>
        ) : parties.length ? (
          parties.map((party) => (
            <Card key={party.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
                <div>
                  <strong>{party.name}</strong>
                  <p className="text-sm text-muted-foreground">
                    {party.address}
                  </p>
                  <p className="text-xs">
                    {party.inn && `ИНН ${party.inn} · `}
                    {party.contactName} · {party.phone || party.email}
                  </p>
                  <p className="text-xs">
                    {party.shared ? 'Общий · ' : ''}
                    {party.status === 'archived' ? 'Архив' : 'Действующий'}
                  </p>
                </div>
                {(user?.role === 'admin' ||
                  (!party.shared && party.ownerUserId === user?.id)) && (
                  <Button variant="outline" onClick={() => setEditing(party)}>
                    Изменить
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p>Контрагенты пока не добавлены.</p>
        )}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            disabled={loading || !offset}
            onClick={() => setOffset((v) => Math.max(0, v - 20))}
          >
            Назад
          </Button>
          <span className="text-sm">Страница {offset / 20 + 1}</span>
          <Button
            variant="outline"
            disabled={
              loading || !!error || parties.length < 20 || offset >= 10000
            }
            onClick={() => setOffset((v) => v + 20)}
          >
            Далее
          </Button>
        </div>
        <Dialog
          open={editing !== undefined}
          onOpenChange={(open) => {
            if (!open) setEditing(undefined);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Изменить контрагента' : 'Новый контрагент'}
              </DialogTitle>
              <DialogDescription>
                Реквизиты для перевозок. Уже сохранённые снимки заказов
                сохраняются.
              </DialogDescription>
            </DialogHeader>
            {editing !== undefined && (
              <CounterpartyForm
                initial={editing ?? undefined}
                onSaved={() => {
                  setEditing(undefined);
                  setRevision((v) => v + 1);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

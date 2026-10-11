'use client';
import { useEffect, useState } from 'react';
import { api, type InboxDocument } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { errorMessage } from '@/lib/api-errors';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DocumentsList } from '@/components/orders/OrderDocumentsPanel';
import { Button } from '@/components/ui/button';
export function DocumentsPage() {
  const { withAuth } = useUser();
  const [documents, setDocuments] = useState<InboxDocument[]>([]),
    [offset, setOffset] = useState(0),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    withAuth((token) => api.documents.list(token, 20, offset))
      .then((value) => {
        if (live) {
          setDocuments(value);
          setError('');
        }
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
  }, [withAuth, offset, revision]);
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between">
          <h1>Документы</h1>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => setRevision((v) => v + 1)}
          >
            Обновить
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Доступные вам внутренние документы перевозок.
        </p>
        {error && <p role="alert">{error}</p>}
        {loading ? (
          <p>Загрузка…</p>
        ) : !error && !documents.length ? (
          <p>Документы пока не появились.</p>
        ) : (
          <DocumentsList documents={documents} />
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
              loading || !!error || documents.length < 20 || offset >= 10000
            }
            onClick={() => setOffset((v) => v + 20)}
          >
            Далее
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

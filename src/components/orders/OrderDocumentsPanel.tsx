'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, type InboxDocument } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import { documentLabels, documentFilename, saveBlob } from '@/lib/documents';
import { errorMessage } from '@/lib/api-errors';
import { Button } from '@/components/ui/button';
export function DocumentsList({ documents }: { documents: InboxDocument[] }) {
  const { withAuth } = useUser();
  const [downloading, setDownloading] = useState<string | null>(null),
    [error, setError] = useState('');
  const lock = useRef(false);
  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {documents.map((doc) => (
        <article
          key={doc.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
        >
          <div>
            <strong>{doc.title || documentLabels[doc.type]}</strong>
            <p>{documentLabels[doc.type] ?? doc.type}</p>
            <Link
              className="underline"
              href={`/dashboard/orders/${doc.order_id}`}
            >
              Заказ #{doc.order_id.slice(0, 8).toUpperCase()}
            </Link>
            <p className="text-xs text-muted-foreground">
              {new Date(doc.created_at).toLocaleString('ru-RU')} ·{' '}
              {(doc.size_bytes / 1024).toFixed(1)} КБ
            </p>
          </div>
          <Button
            variant="outline"
            disabled={!!downloading}
            onClick={async () => {
              if (lock.current) return;
              lock.current = true;
              setDownloading(doc.id);
              setError('');
              try {
                saveBlob(
                  await withAuth((token) =>
                    api.documents.download(token, doc.id),
                  ),
                  documentFilename(doc),
                );
              } catch (err) {
                setError(errorMessage(err));
              } finally {
                lock.current = false;
                setDownloading(null);
              }
            }}
          >
            {downloading === doc.id ? 'Загрузка…' : 'Скачать PDF'}
          </Button>
        </article>
      ))}
    </div>
  );
}
export function OrderDocumentsPanel({ orderId }: { orderId: string }) {
  const { withAuth } = useUser();
  const [documents, setDocuments] = useState<InboxDocument[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [limited, setLimited] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true,
      running = false;
    const load = async () => {
      if (running || document.hidden) return;
      running = true;
      setLoading(true);
      try {
        const values: InboxDocument[] = [];
        let full = true;
        for (let offset = 0; offset < 1000; offset += 100) {
          const page = await withAuth((token) =>
            api.documents.list(token, 100, offset),
          );
          values.push(...page.filter((doc) => doc.order_id === orderId));
          if (page.length < 100) {
            full = false;
            break;
          }
        }
        if (live) {
          setDocuments([...new Map(values.map((d) => [d.id, d])).values()]);
          setLimited(full);
          setError('');
        }
      } catch (err) {
        if (live) setError(errorMessage(err));
      } finally {
        running = false;
        if (live) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 30000);
    window.addEventListener('logiflow:changed', load);
    return () => {
      live = false;
      window.clearInterval(timer);
      window.removeEventListener('logiflow:changed', load);
    };
  }, [orderId, revision, withAuth]);
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => setRevision((v) => v + 1)}
      >
        Обновить документы
      </Button>
      {error && <p role="alert">{error}</p>}
      {loading && (
        <p className="text-sm">Читаем доступные страницы документов…</p>
      )}
      {limited && (
        <p className="text-sm">
          Проверены первые 1000 документов ящика. Остальные доступны в{' '}
          <Link href="/dashboard/documents" className="underline">
            ящике документов
          </Link>
          .
        </p>
      )}
      {!loading && !error && !limited && !documents.length && (
        <p className="text-sm text-muted-foreground">
          Документы пока не появились. Они формируются асинхронно; обновите
          список позже.
        </p>
      )}
      <DocumentsList documents={documents} />
    </div>
  );
}

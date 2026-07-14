'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Phone, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

type ReadFilter = 'all' | 'unread' | 'read';

export default function InquiriesPage() {
  const qc = useQueryClient();
  const [markReadErr, setMarkReadErr] = useState('');
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const inquiriesQuery = useQuery({
    queryKey: ['admin', 'inquiries'],
    queryFn: async () => {
      const res = await api.get<Inquiry[]>('/admin/contact');
      return res.data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/contact/${id}/read`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'inquiries'] }); setMarkReadErr(''); },
    onError: (e) => setMarkReadErr(extractErrorMessage(e)),
  });

  const all = inquiriesQuery.data ?? [];
  const unread = all.filter((i) => !i.isRead).length;

  const inquiries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((i) => {
      if (readFilter === 'unread' && i.isRead) return false;
      if (readFilter === 'read' && !i.isRead) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.phone.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q)
      );
    });
  }, [all, search, readFilter]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Aloqa"
        title="Murojaatlar"
        description={
          unread > 0
            ? `${unread} ta o'qilmagan murojaat — saytdan qoldirilgan.`
            : "Saytdagi 'Biz bilan bog'laning' formasidan kelgan murojaatlar."
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, telefon yoki matn bo'yicha qidirish…"
            className="pl-9"
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {([
            { key: 'all', label: 'Barchasi' },
            { key: 'unread', label: "O'qilmagan" },
            { key: 'read', label: "O'qilgan" },
          ] as const).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setReadFilter(f.key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-r last:border-r-0 border-border
                ${readFilter === f.key ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {markReadErr && (
        <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{markReadErr}</p>
      )}

      {inquiriesQuery.isLoading ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">Yuklanmoqda…</Card>
      ) : inquiriesQuery.isError ? (
        <Card className="py-16 text-center text-sm text-destructive">
          {extractErrorMessage(inquiriesQuery.error)} —{' '}
          <button className="underline" onClick={() => inquiriesQuery.refetch()}>qayta urinish</button>
        </Card>
      ) : inquiries.length === 0 ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">
          {all.length === 0 ? "Hozircha murojaat yo'q" : 'Filtrga mos murojaat topilmadi'}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {inquiries.map((i) => (
            <Card
              key={i.id}
              className={`space-y-3 p-5 ${i.isRead ? '' : 'border-primary/40 bg-primary/[0.03]'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{i.name}</p>
                  <a
                    href={`tel:${i.phone}`}
                    className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Phone className="size-3.5" />
                    {i.phone}
                  </a>
                </div>
                {i.isRead ? (
                  <Badge variant="neutral">O&apos;qilgan</Badge>
                ) : (
                  <Badge variant="success">Yangi</Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{i.message}</p>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(i.createdAt).toLocaleString('uz-UZ')}
                </span>
                {!i.isRead ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(i.id)}>
                    <Check className="size-4" />
                    O&apos;qildi
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

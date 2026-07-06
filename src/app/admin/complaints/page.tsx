'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { type AdminComplaint, ComplaintCard } from '@/components/admin/complaint-card';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface ComplaintsPage {
  items: AdminComplaint[];
  total: number;
}

type StatusFilter = '' | 'open' | 'resolved';

const PAGE_SIZE = 20;

const STATUS_BTNS: { key: StatusFilter; label: string }[] = [
  { key: '', label: 'Barchasi' },
  { key: 'open', label: 'Ochiq' },
  { key: 'resolved', label: 'Yopilgan' },
];

/**
 * Cross-shop triage queue. Distinct cache key prefix (['admin','complaints',
 * 'list', ...]) from the shop-scoped panel on the shops page (['admin',
 * 'shop-complaints', shopId]) — two different endpoints/shapes, so they must
 * not share a key (that's the exact bug fixed in 08b3c66).
 */
export default function AdminComplaintsPage() {
  const [status, setStatus] = useState<StatusFilter>('');
  const [shopIdInput, setShopIdInput] = useState('');
  const [shopIdSubmitted, setShopIdSubmitted] = useState('');
  const [page, setPage] = useState(0);

  const complaintsQ = useQuery<ComplaintsPage>({
    queryKey: ['admin', 'complaints', 'list', status, shopIdSubmitted, page],
    queryFn: async () =>
      (
        await api.get('/admin/complaints', {
          params: {
            status: status || undefined,
            shopId: shopIdSubmitted || undefined,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
          },
        })
      ).data,
  });

  const complaints = complaintsQ.data?.items ?? [];
  const total = complaintsQ.data?.total ?? 0;
  const invalidateKeys = [['admin', 'complaints', 'list']];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Nazorat"
        title="Shikoyatlar"
        description="Yetkazilgan buyurtmalar bo'yicha mijoz shikoyatlari va ularni hal qilish."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {STATUS_BTNS.map((b) => (
            <button
              key={b.key || 'all'}
              type="button"
              onClick={() => {
                setStatus(b.key);
                setPage(0);
              }}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-r last:border-r-0 border-border
                ${status === b.key ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
              {b.label}
            </button>
          ))}
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setShopIdSubmitted(shopIdInput.trim());
          }}>
          <Input
            value={shopIdInput}
            onChange={(e) => setShopIdInput(e.target.value)}
            placeholder="Do'kon ID bo'yicha filtr…"
            className="w-64 font-mono text-xs"
          />
        </form>
      </div>

      {complaintsQ.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Yuklanmoqda…</Card>
      ) : complaintsQ.isError ? (
        <Card className="p-6 text-sm text-destructive">
          {extractErrorMessage(complaintsQ.error)} —{' '}
          <button className="underline" onClick={() => complaintsQ.refetch()}>
            qayta urinish
          </button>
        </Card>
      ) : complaints.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">Shikoyat topilmadi.</Card>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} invalidateKeys={invalidateKeys} />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </div>
  );
}

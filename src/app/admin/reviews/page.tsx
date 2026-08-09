'use client';

import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

type ReviewTarget = 'product' | 'courier' | 'shop';

interface AdminReview {
  id: string;
  target: ReviewTarget;
  stars: number;
  text: string | null;
  createdAt: string;
  customerName: string | null;
  targetName: string | null;
}

interface ReviewsPage { items: AdminReview[]; total: number }

const PAGE_SIZE = 30;

const TARGET_LABEL: Record<ReviewTarget, string> = {
  product: 'Mahsulot',
  courier: 'Kuryer',
  shop: "Do'kon",
};
const TARGET_VARIANT: Record<ReviewTarget, 'neutral' | 'warning' | 'primary'> = {
  product: 'neutral',
  courier: 'warning',
  shop: 'primary',
};

const TARGET_FILTERS: { key: ReviewTarget | ''; label: string }[] = [
  { key: '', label: 'Barchasi' },
  { key: 'product', label: 'Mahsulot' },
  { key: 'courier', label: 'Kuryer' },
  { key: 'shop', label: "Do'kon" },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3.5 ${i <= value ? 'text-amber-500' : 'text-muted-foreground/30'}`}
          fill={i <= value ? 'currentColor' : 'none'}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [target, setTarget] = useState<ReviewTarget | ''>('');
  // Defaults to "muammoli" (≤2 yulduz) — this page exists specifically to
  // surface low ratings admins previously had no way to see at all.
  const [maxStars, setMaxStars] = useState<number | ''>(2);
  const [page, setPage] = useState(0);

  const reviewsQuery = useQuery<ReviewsPage>({
    queryKey: ['admin', 'reviews', target, maxStars, page],
    queryFn: async () =>
      (await api.get('/admin/reviews', {
        params: { target: target || undefined, maxStars: maxStars || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      })).data,
    placeholderData: (prev) => prev,
  });

  const items = reviewsQuery.data?.items ?? [];
  const total = reviewsQuery.data?.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Xavfsizlik"
        title="Sharhlar"
        description="Mahsulot, kuryer va do'kon sharhlari — muammoli (past baho) sharhlarni topish uchun."
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {TARGET_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setTarget(f.key); setPage(0); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                target === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 2 as const, label: '≤2 yulduz (muammoli)' },
            { key: '' as const, label: 'Barcha baholar' },
          ].map((f) => (
            <button
              key={String(f.key)}
              type="button"
              onClick={() => { setMaxStars(f.key); setPage(0); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                maxStars === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Turi</th>
              <th className="px-4 py-3 font-semibold">Baho</th>
              <th className="px-4 py-3 font-semibold">Nima/kim</th>
              <th className="px-4 py-3 font-semibold">Mijoz</th>
              <th className="px-4 py-3 font-semibold">Izoh</th>
              <th className="px-4 py-3 font-semibold">Sana</th>
            </tr>
          </thead>
          <tbody>
            {reviewsQuery.isLoading ? (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda…</td></tr>
            ) : reviewsQuery.isError ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-destructive">
                  {extractErrorMessage(reviewsQuery.error)} —{' '}
                  <button className="underline" onClick={() => reviewsQuery.refetch()}>qayta urinish</button>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Sharh topilmadi</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Badge variant={TARGET_VARIANT[r.target]}>{TARGET_LABEL[r.target]}</Badge>
                </td>
                <td className="px-4 py-3"><Stars value={r.stars} /></td>
                <td className="px-4 py-3 text-muted-foreground">{r.targetName ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.customerName ?? '—'}</td>
                <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{r.text ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString('uz-UZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </div>
  );
}

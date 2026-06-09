'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface Withdrawal {
  id: string;
  sellerId: string;
  amount: string;
  bankCardNumber: string;
  bankCardHolderName: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt: string | null;
  adminNote: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  processing: 'Jarayonda',
  completed: 'Bajarildi',
  rejected: 'Rad etildi',
};
type BadgeV = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
const STATUS_COLOR: Record<string, BadgeV> = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  rejected: 'danger',
};

const fmt = (v: string) => Number(v).toLocaleString('uz-UZ') + " so'm";

export default function WithdrawalsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('pending');
  const [note, setNote] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ['admin', 'withdrawals', filter],
    queryFn: async () => (await api.get('/admin/balance/withdrawals', { params: { status: filter } })).data,
  });

  const process = useMutation({
    mutationFn: ({ id, approve, adminNote }: { id: string; approve: boolean; adminNote?: string }) =>
      api.put(`/admin/balance/withdrawals/${id}/process`, { approve, note: adminNote }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  });

  return (
    <div className="p-6">
      <PageHeader title="Yechish so'rovlar" description="Seller mablag' yechish arizalari" />

      <div className="mt-6 flex gap-2">
        {(['pending', 'processing', 'completed', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Yuklanmoqda…</p>}

      <div className="mt-4 space-y-3">
        {(data ?? []).map((w) => (
          <Card key={w.id} className="p-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_COLOR[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                  <span className="text-lg font-bold text-green-600">{fmt(w.amount)}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{w.bankCardHolderName}</p>
                <p className="font-mono text-sm text-muted-foreground">{w.bankCardNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(w.requestedAt).toLocaleString('uz-UZ')}
                </p>
                {w.adminNote && (
                  <p className="mt-1 text-xs text-muted-foreground">Izoh: {w.adminNote}</p>
                )}
              </div>

              {w.status === 'pending' && (
                <div className="flex flex-col gap-2">
                  <input
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    placeholder="Izoh (ixtiyoriy)"
                    value={note[w.id] ?? ''}
                    onChange={(e) => setNote((p) => ({ ...p, [w.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={process.isPending}
                      onClick={() => process.mutate({ id: w.id, approve: false, adminNote: note[w.id] })}
                    >
                      <X className="size-3" />
                      Rad
                    </Button>
                    <Button
                      size="sm"
                      disabled={process.isPending}
                      onClick={() => process.mutate({ id: w.id, approve: true, adminNote: note[w.id] })}
                    >
                      <Check className="size-3" />
                      Tasdiqlash
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}

        {!isLoading && (data ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">So'rovlar yo'q</p>
        )}
      </div>

      {process.isError && (
        <p className="mt-3 text-sm text-destructive">{extractErrorMessage(process.error)}</p>
      )}
    </div>
  );
}

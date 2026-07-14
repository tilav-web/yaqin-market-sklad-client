'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Download, X } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';

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
  seller: { id: string; name: string | null; phone: string } | null;
}

interface WithdrawalsPageResp { items: Withdrawal[]; total: number }

const PAGE_SIZE = 30;

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

type PendingDecision = { withdrawal: Withdrawal; approve: boolean };

export default function WithdrawalsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('pending');
  const [page, setPage] = useState(0);
  const [note, setNote] = useState<Record<string, string>>({});
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const withdrawalsQuery = useQuery<WithdrawalsPageResp>({
    queryKey: ['admin', 'withdrawals', filter, page],
    queryFn: async () =>
      (await api.get('/admin/balance/withdrawals', {
        params: { status: filter, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      })).data,
    placeholderData: (prev) => prev,
  });
  const { isLoading, isError, error, refetch } = withdrawalsQuery;
  const items = withdrawalsQuery.data?.items ?? [];
  const total = withdrawalsQuery.data?.total ?? 0;

  const process = useMutation({
    mutationFn: ({ id, approve, adminNote }: { id: string; approve: boolean; adminNote?: string }) =>
      api.put(`/admin/balance/withdrawals/${id}/process`, { approve, note: adminNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      setPendingDecision(null);
    },
  });

  const [exportErr, setExportErr] = useState('');
  const exportXlsx = useMutation({
    mutationFn: () => downloadFile('/admin/balance/withdrawals/export', 'yechish-sorovlar.xlsx', { status: filter }),
    onError: (e) => setExportErr(extractErrorMessage(e)),
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Yechish so'rovlar"
        description="Seller mablag' yechish arizalari"
        actions={
          <Button variant="outline" size="sm" disabled={exportXlsx.isPending} onClick={() => { setExportErr(''); exportXlsx.mutate(); }}>
            <Download className="size-4" /> {exportXlsx.isPending ? 'Yuklanmoqda…' : 'Eksport'}
          </Button>
        }
      />
      {exportErr && (
        <p className="mt-4 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{exportErr}</p>
      )}

      <div className="mt-6 flex gap-2">
        {(['pending', 'processing', 'completed', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(0); }}
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
      {isError && (
        <p className="mt-4 text-sm text-destructive">
          {extractErrorMessage(error)} —{' '}
          <button className="underline" onClick={() => refetch()}>qayta urinish</button>
        </p>
      )}

      <div className="mt-4 space-y-3">
        {items.map((w) => (
          <Card key={w.id} className="p-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_COLOR[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                  <span className="text-lg font-bold text-green-600">{fmt(w.amount)}</span>
                </div>
                {w.seller && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sotuvchi: <span className="text-foreground">{w.seller.name || w.seller.phone}</span>
                  </p>
                )}
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
                      onClick={() => setPendingDecision({ withdrawal: w, approve: false })}
                    >
                      <X className="size-3" />
                      Rad
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPendingDecision({ withdrawal: w, approve: true })}
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

        {!isLoading && items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">So'rovlar yo'q</p>
        )}
      </div>

      <div className="mt-4">
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>

      <ConfirmDialog
        open={!!pendingDecision}
        title={pendingDecision?.approve ? "Yechish so'rovini tasdiqlash" : "Yechish so'rovini rad etish"}
        description={pendingDecision && (
          <div className="space-y-1">
            <p>
              Karta egasi: <span className="font-medium text-foreground">{pendingDecision.withdrawal.bankCardHolderName}</span>
            </p>
            <p className="font-mono">{pendingDecision.withdrawal.bankCardNumber}</p>
            <p>
              Summasi:{' '}
              <span className="font-semibold text-foreground">{fmt(pendingDecision.withdrawal.amount)}</span>
            </p>
            {note[pendingDecision.withdrawal.id] && (
              <p>Izoh: {note[pendingDecision.withdrawal.id]}</p>
            )}
            <p className="mt-2 text-destructive">
              {pendingDecision.approve
                ? "Tasdiqlangandan so'ng holat 'jarayonda'ga o'tadi va bank o'tkazmasi amalga oshiriladi — bekor qilib bo'lmaydi."
                : "Rad etilgan mablag' sotuvchining mavjud balansiga qaytariladi."}
            </p>
          </div>
        )}
        confirmLabel={pendingDecision?.approve ? 'Ha, tasdiqlash' : 'Ha, rad etish'}
        destructive={!pendingDecision?.approve}
        pending={process.isPending}
        error={process.isError ? extractErrorMessage(process.error) : ''}
        onConfirm={() => {
          if (!pendingDecision) return;
          process.mutate({
            id: pendingDecision.withdrawal.id,
            approve: pendingDecision.approve,
            adminNote: note[pendingDecision.withdrawal.id],
          });
        }}
        onCancel={() => setPendingDecision(null)}
      />
    </div>
  );
}

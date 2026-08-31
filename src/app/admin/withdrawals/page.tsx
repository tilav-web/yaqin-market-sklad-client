'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Hash,
  Landmark,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';

interface Withdrawal {
  id: string;
  sellerId: string;
  amount: string;
  shopId?: string | null;
  bankAccountNumber?: string | null;
  bankMfo?: string | null;
  bankName?: string | null;
  recipientName?: string | null;
  bankCardNumber?: string | null;
  bankCardHolderName?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt: string | null;
  adminNote: string | null;
  seller: { id: string; name: string | null; phone: string } | null;
}

interface WithdrawalsPageResp {
  items: Withdrawal[];
  total: number;
}

const PAGE_SIZE = 25;
const fmt = (v: string | number) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";

const STATUS_META: Record<
  Withdrawal['status'],
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: 'Kutilmoqda', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Clock },
  processing: { label: 'Jarayonda', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: RefreshCw },
  completed: { label: 'Bajarildi', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  rejected: { label: 'Rad etildi', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: XCircle },
};

const STATUS_TABS: { key: Withdrawal['status']; label: string; icon: React.ElementType }[] = [
  { key: 'pending', label: 'Kutilmoqda', icon: Clock },
  { key: 'processing', label: 'Jarayonda', icon: RefreshCw },
  { key: 'completed', label: 'Bajarilgan', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rad etilgan', icon: XCircle },
];

type PendingDecision = { withdrawal: Withdrawal; approve: boolean };

export default function WithdrawalsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Withdrawal['status']>('pending');
  const [page, setPage] = useState(0);
  const [note, setNote] = useState<Record<string, string>>({});
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const withdrawalsQuery = useQuery<WithdrawalsPageResp>({
    queryKey: ['admin', 'withdrawals', filter, page],
    queryFn: async () =>
      (
        await api.get('/admin/balance/withdrawals', {
          params: { status: filter, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
        })
      ).data,
    placeholderData: (prev) => prev,
  });

  const { isLoading, isError, error, refetch } = withdrawalsQuery;
  const items = withdrawalsQuery.data?.items ?? [];
  const total = withdrawalsQuery.data?.total ?? 0;

  const processMutation = useMutation({
    mutationFn: ({
      id,
      approve,
      adminNote,
    }: {
      id: string;
      approve: boolean;
      adminNote?: string;
    }) => api.put(`/admin/balance/withdrawals/${id}/process`, { approve, note: adminNote }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      setPendingDecision(null);
      toast.success(vars.approve ? "So'rov tasdiqlandi va bajarildi" : "So'rov rad etildi");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const [exportErr, setExportErr] = useState('');
  const exportXlsx = useMutation({
    mutationFn: () =>
      downloadFile('/admin/balance/withdrawals/export', 'yechish-sorovlar.xlsx', { status: filter }),
    onError: (e) => setExportErr(extractErrorMessage(e)),
  });

  const copyText = (val: string, label: string) => {
    navigator.clipboard.writeText(val.replace(/\s+/g, ''));
    toast.success(`${label} nusxalandi`);
  };

  const copyB2BDetails = (w: Withdrawal) => {
    const acc = w.bankAccountNumber || w.bankCardNumber || '';
    const lines = [
      `Hisob raqam: ${acc}`,
      w.bankMfo ? `MFO: ${w.bankMfo}` : null,
      w.bankName ? `Bank: ${w.bankName}` : null,
      `Qabul qiluvchi: ${w.recipientName || w.bankCardHolderName || w.seller?.name || 'Seller'}`,
      `Summa: ${fmt(w.amount)}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success('B2B to\'lov rekvizitlari nusxalandi!');
  };

  const copyCardNumber = (cardNum: string) => {
    navigator.clipboard.writeText(cardNum.replace(/\s+/g, ''));
    toast.success('Raqam nusxalandi');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pul Yechish So'rovlari"
        description="Sotuvchilar (seller) tomonidan karta orqali pul yechish arizalarini ko'rib chiqish va to'lovni tasdiqlash"
        breadcrumbs={[{ label: 'Moliya & Soliq' }, { label: 'Pul yechish' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={exportXlsx.isPending}
            onClick={() => {
              setExportErr('');
              exportXlsx.mutate();
            }}
            className="h-9 gap-1.5 rounded-xl border-border px-3.5 text-xs font-semibold">
            <Download className="size-3.5 text-primary" />
            {exportXlsx.isPending ? 'Yuklanmoqda…' : 'Excel Eksport'}
          </Button>
        }
      />

      {exportErr && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {exportErr}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setFilter(tab.key);
                setPage(0);
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}>
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Withdrawals List / Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-sm font-medium text-destructive">{extractErrorMessage(error)}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Qayta urinish
          </Button>
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed rounded-2xl">
          <CreditCard className="size-12 text-muted-foreground/40 mb-3" />
          <h4 className="text-sm font-bold text-foreground">So&apos;rovlar mavjud emas</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Ushbu bo&apos;limda arizalar topilmadi</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((w) => {
            const meta = STATUS_META[w.status];
            const isPending = w.status === 'pending';

            return (
              <Card
                key={w.id}
                className={cn(
                  'flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all shadow-xs hover:shadow-md',
                  isPending
                    ? 'border-amber-500/30 bg-card hover:border-amber-500/50'
                    : 'border-border/80 bg-card',
                )}>
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
                        <CreditCard className="size-5" />
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-extrabold text-foreground font-mono leading-tight">
                          {fmt(w.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Sotuvchi: <strong className="text-foreground">{w.seller?.name || 'Seller'}</strong>
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold border',
                        meta.color,
                      )}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Bank Account / B2B Details Box */}
                  <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5 text-xs">
                    {w.bankAccountNumber ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-semibold">Bank Hisob Raqami:</span>
                          <button
                            type="button"
                            onClick={() => copyText(w.bankAccountNumber!, 'Hisob raqam')}
                            className="flex items-center gap-1.5 font-mono font-bold text-foreground bg-card border border-border px-2.5 py-1 rounded-lg hover:border-primary/50 transition-colors">
                            <Hash className="size-3 text-primary" />
                            {w.bankAccountNumber}
                            <Copy className="size-3 text-muted-foreground" />
                          </button>
                        </div>

                        {w.bankMfo && (
                          <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                            <span>Bank MFO:</span>
                            <button
                              type="button"
                              onClick={() => copyText(w.bankMfo!, 'MFO')}
                              className="flex items-center gap-1 font-mono font-bold text-foreground hover:text-primary transition-colors">
                              <Building2 className="size-3 text-muted-foreground" />
                              {w.bankMfo}
                              <Copy className="size-2.5 text-muted-foreground" />
                            </button>
                          </div>
                        )}

                        {w.bankName && (
                          <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                            <span>Bank filiali:</span>
                            <span className="text-foreground font-medium">{w.bankName}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                          <span>Qabul qiluvchi (Tashkilot):</span>
                          <strong className="text-foreground uppercase font-semibold">
                            {w.recipientName || w.bankCardHolderName || w.seller?.name || '—'}
                          </strong>
                        </div>

                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyB2BDetails(w)}
                            className="w-full h-7 text-[0.7rem] font-bold gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10">
                            <Landmark className="size-3" />
                            Bank-Klient uchun to'liq nusxalash
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-semibold">Karta raqami:</span>
                          <button
                            type="button"
                            onClick={() => copyCardNumber(w.bankCardNumber || '')}
                            className="flex items-center gap-1.5 font-mono font-bold text-foreground bg-card border border-border px-2.5 py-1 rounded-lg hover:border-primary/50 transition-colors">
                            💳 {w.bankCardNumber || '—'}
                            <Copy className="size-3 text-muted-foreground" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                          <span>Karta egasi:</span>
                          <strong className="text-foreground uppercase font-semibold">
                            {w.bankCardHolderName || '—'}
                          </strong>
                        </div>
                      </>
                    )}

                    {w.seller?.phone && (
                      <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                        <span>Telefon:</span>
                        <span className="text-foreground font-mono">{w.seller.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                      <span>So&apos;ralgan vaqt:</span>
                      <span>{new Date(w.requestedAt).toLocaleString('uz-UZ')}</span>
                    </div>

                    {w.adminNote && (
                      <div className="rounded-lg bg-muted p-2 text-muted-foreground font-medium mt-2">
                        Izoh: {w.adminNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Actions */}
                {isPending && (
                  <div className="mt-4 pt-3 border-t border-border/60 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="text"
                      placeholder="Admin izohi (ixtiyoriy)..."
                      value={note[w.id] ?? ''}
                      onChange={(e) => setNote((p) => ({ ...p, [w.id]: e.target.value }))}
                      className="h-8.5 rounded-xl border border-border bg-background px-3 text-xs font-medium outline-none flex-1"
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingDecision({ withdrawal: w, approve: false })}
                        className="h-8.5 gap-1 rounded-xl border-destructive/30 text-xs font-bold text-destructive hover:bg-destructive/10">
                        <X className="size-3.5" />
                        Rad etish
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setPendingDecision({ withdrawal: w, approve: true })}
                        className="h-8.5 gap-1 rounded-xl px-4 text-xs font-bold">
                        <Check className="size-3.5" />
                        Tasdiqlash
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="border-t border-border p-3">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPage={setPage}
          />
        </div>
      )}

      {/* Decision Confirm Dialog */}
      {pendingDecision && (
        <ConfirmDialog
          open={true}
          title={pendingDecision.approve ? "Pul yechishni tasdiqlash" : "So'rovni rad etish"}
          description={
            pendingDecision.approve
              ? `${fmt(pendingDecision.withdrawal.amount)} miqdoridagi mablag' seller hisob raqamiga (${pendingDecision.withdrawal.bankAccountNumber || pendingDecision.withdrawal.bankCardNumber}) to'lab berilganini tasdiqlaysizmi?`
              : `${fmt(pendingDecision.withdrawal.amount)} miqdoridagi mablag' yechish so'rovini rad etmoqchimisiz? Mablag' seller balansiga qaytariladi.`
          }
          confirmLabel={pendingDecision.approve ? "Ha, tasdiqlash" : "Ha, rad etish"}
          onConfirm={() =>
            processMutation.mutate({
              id: pendingDecision.withdrawal.id,
              approve: pendingDecision.approve,
              adminNote: note[pendingDecision.withdrawal.id],
            })
          }
          onCancel={() => setPendingDecision(null)}
        />
      )}
    </div>
  );
}

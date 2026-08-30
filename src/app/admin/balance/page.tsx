'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CreditCard,
  DollarSign,
  Search,
  Store,
  Wallet,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';

interface SellerBalance {
  id: string;
  sellerId: string;
  pendingBalance: string;
  availableBalance: string;
  debtBalance: string;
  debtDueDate: string | null;
}

interface SellerTx {
  id: string;
  type: string;
  amount: string;
  status: string;
  description: string | null;
  createdAt: string;
}

interface SellerResult {
  id: string;
  name: string | null;
  phone: string;
}

interface UsersSearchPage {
  items: SellerResult[];
  total: number;
}

const fmt = (v: string | number) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";

const TX_TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  order_earning: { label: 'Buyurtma tushumi', color: 'text-emerald-600 bg-emerald-500/10', icon: ArrowDownLeft },
  withdrawal: { label: 'Pul yechish', color: 'text-blue-600 bg-blue-500/10', icon: ArrowUpRight },
  debt_payment: { label: 'Qarz to\'lovi', color: 'text-purple-600 bg-purple-500/10', icon: CreditCard },
  commission_deduction: { label: 'Komissiya ushlanmasi', color: 'text-amber-600 bg-amber-500/10', icon: DollarSign },
  refund: { label: 'Qaytarish (Refund)', color: 'text-rose-600 bg-rose-500/10', icon: ArrowUpRight },
};

type PendingAction = { tx: SellerTx; kind: 'settle' | 'refund' };

export default function AdminBalancePage() {
  const qc = useQueryClient();
  const [sellerId, setSellerId] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<SellerResult | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const sellerSearchQ = useQuery<UsersSearchPage>({
    queryKey: ['admin', 'users', 'seller-search', submittedQuery],
    queryFn: async () =>
      (
        await api.get('/admin/users', {
          params: { search: submittedQuery, sellerOnly: 'true', limit: 8 },
        })
      ).data,
    enabled: submittedQuery.trim().length > 0,
  });

  const pickSeller = (s: SellerResult) => {
    setSelectedSeller(s);
    setSellerId(s.id);
    setSubmittedQuery('');
    setQuery('');
  };

  const clearSeller = () => {
    setSelectedSeller(null);
    setSellerId('');
  };

  const balQ = useQuery<SellerBalance>({
    queryKey: ['admin', 'balance', sellerId],
    queryFn: async () => (await api.get(`/admin/balance/sellers/${sellerId}`)).data,
    enabled: Boolean(sellerId),
  });

  const txQ = useQuery<SellerTx[]>({
    queryKey: ['admin', 'txs', sellerId],
    queryFn: async () => (await api.get(`/admin/balance/sellers/${sellerId}/transactions`)).data,
    enabled: Boolean(sellerId),
  });

  const b = balQ.data;

  const forceSettle = useMutation({
    mutationFn: (txId: string) => api.post(`/admin/balance/transactions/${txId}/force-settle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'balance', sellerId] });
      qc.invalidateQueries({ queryKey: ['admin', 'txs', sellerId] });
      setPendingAction(null);
      toast.success('Tranzaksiya muvaffaqiyatli hisoblandi');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const forceRefund = useMutation({
    mutationFn: (txId: string) => api.post(`/admin/balance/transactions/${txId}/force-refund`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'balance', sellerId] });
      qc.invalidateQueries({ queryKey: ['admin', 'txs', sellerId] });
      setPendingAction(null);
      toast.success('Tranzaksiya qaytarildi (Refund)');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Balanslar & Hamyonlar"
        description="Sotuvchilarning joriy balansi, muzlatilgan settlement mablag'lari, qarzlari va tranzaksiyalar auditi"
        breadcrumbs={[{ label: 'Moliya & Soliq' }, { label: 'Balanslar' }]}
      />

      {/* Seller Search Toolbar */}
      <div className="relative rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
          Sotuvchi (Seller) ni qidirish
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Seller ismi yoki telefon raqami bo'yicha qidiring..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSubmittedQuery(e.target.value.trim());
              }}
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {selectedSeller && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearSeller}
              className="h-10 gap-1.5 rounded-xl border-border px-3 text-xs font-bold">
              <X className="size-3.5" />
              Tozalash
            </Button>
          )}
        </div>

        {/* Autocomplete Search Dropdown */}
        {submittedQuery && sellerSearchQ.data && (
          <div className="absolute left-4 right-4 top-20 z-20 rounded-2xl border border-border bg-card p-2 shadow-2xl space-y-1 animate-in fade-in duration-150 max-h-60 overflow-y-auto custom-scrollbar">
            {sellerSearchQ.data.items.length === 0 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">Seller topilmadi</p>
            ) : (
              sellerSearchQ.data.items.map((s) => (
                <div
                  key={s.id}
                  onClick={() => pickSeller(s)}
                  className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted/60 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      <Store className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{s.name || 'Seller'}</p>
                      <p className="text-[0.68rem] text-muted-foreground font-mono">{s.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">Tanlash →</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Seller Profile Header */}
      {selectedSeller && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-sm">
              <Store className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground">{selectedSeller.name || 'Seller'}</h3>
              <p className="text-xs text-muted-foreground font-mono">{selectedSeller.phone}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
            Tanlangan hisob
          </span>
        </div>
      )}

      {/* Financial Overview Cards */}
      {sellerId ? (
        balQ.isLoading ? (
          <div className="flex h-36 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !b ? (
          <p className="text-sm text-destructive">Balans ma&apos;lumotlari topilmadi</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Yechish mumkin (Available)
                </span>
                <Wallet className="size-5 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {fmt(b.availableBalance)}
              </p>
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                Seller kartasiga chiqarib olishi mumkin bo&apos;lgan sof mablag&apos;
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Muzlatilgan (Pending)
                </span>
                <Clock className="size-5 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {fmt(b.pendingBalance)}
              </p>
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                Settlement vaqtida turgan buyurtma tushumlari
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Komissiya Qarzi (Debt)
                </span>
                <AlertTriangle className="size-5 text-rose-500" />
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {fmt(b.debtBalance)}
              </p>
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                {b.debtDueDate
                  ? `To'lov muddati: ${new Date(b.debtDueDate).toLocaleDateString('uz-UZ')}`
                  : 'Naqd buyurtmalar komissiya qarzdorligi'}
              </p>
            </div>
          </div>
        )
      ) : (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed rounded-2xl">
          <Wallet className="size-12 text-muted-foreground/40 mb-3" />
          <h4 className="text-sm font-bold text-foreground">Sotuvchi tanlanmagan</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Seller hisob-kitoblarini ko&apos;rish va boshqarish uchun yuqoridagi qidiruv maydonidan sotuvchini tanlang
          </p>
        </Card>
      )}

      {/* Transactions History */}
      {sellerId && (
        <Card className="rounded-2xl border border-border/80 overflow-hidden shadow-xs">
          <div className="border-b border-border px-5 py-4 bg-muted/20">
            <h4 className="text-sm font-bold text-foreground">Tranzaksiyalar Tarixi</h4>
            <p className="text-xs text-muted-foreground">Hisobdagi barcha kirim, chiqim va komissiya oqimi</p>
          </div>

          {txQ.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !txQ.data || txQ.data.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Tranzaksiyalar topilmadi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground font-bold uppercase tracking-wider text-[0.68rem]">
                    <th className="px-4 py-3.5">Turi</th>
                    <th className="px-4 py-3.5">Izoh</th>
                    <th className="px-4 py-3.5">Holat</th>
                    <th className="px-4 py-3.5 text-right">Summa</th>
                    <th className="px-4 py-3.5">Sana</th>
                    <th className="px-4 py-3.5 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {txQ.data.map((tx) => {
                    const meta = TX_TYPE_LABELS[tx.type] || {
                      label: tx.type,
                      color: 'text-muted-foreground bg-muted',
                      icon: ArrowDownLeft,
                    };
                    const Icon = meta.icon;
                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold',
                              meta.color,
                            )}>
                            <Icon className="size-3.5" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-foreground font-medium max-w-xs truncate">
                          {tx.description || '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'text-[0.65rem] font-bold px-2 py-0.5 rounded-full border',
                              tx.status === 'completed' || tx.status === 'settled'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                            )}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                          {fmt(tx.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground font-medium">
                          {new Date(tx.createdAt).toLocaleString('uz-UZ')}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {tx.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPendingAction({ tx, kind: 'settle' })}
                                className="h-7 text-[0.68rem] font-bold rounded-lg">
                                Settle
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPendingAction({ tx, kind: 'refund' })}
                                className="h-7 text-[0.68rem] font-bold rounded-lg text-rose-500">
                                Refund
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Force Action Confirm Dialog */}
      {pendingAction && (
        <ConfirmDialog
          open={true}
          title={pendingAction.kind === 'settle' ? 'Tranzaksiyani hisoblash (Settle)' : 'Tranzaksiyani qaytarish (Refund)'}
          description={`Ushbu tranzaksiyani (${fmt(pendingAction.tx.amount)}) qo'lda majburiy ${
            pendingAction.kind === 'settle' ? 'tasdiqlashni' : 'qaytarishni'
          } xohlaysizmi?`}
          confirmLabel={pendingAction.kind === 'settle' ? 'Ha, hisoblansin' : 'Ha, qaytarilsin'}
          onConfirm={() => {
            if (pendingAction.kind === 'settle') {
              forceSettle.mutate(pendingAction.tx.id);
            } else {
              forceRefund.mutate(pendingAction.tx.id);
            }
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}

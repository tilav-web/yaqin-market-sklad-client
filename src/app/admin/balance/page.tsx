'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Search, X } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
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

const fmt = (v: string) => Number(v).toLocaleString('uz-UZ') + " so'm";

type PendingAction = { tx: SellerTx; kind: 'settle' | 'refund' };

export default function AdminBalancePage() {
  const [sellerId, setSellerId] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<SellerResult | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionErr, setActionErr] = useState('');
  const qc = useQueryClient();

  const sellerSearchQ = useQuery<UsersSearchPage>({
    queryKey: ['admin', 'users', 'seller-search', submittedQuery],
    queryFn: async () =>
      (await api.get('/admin/users', { params: { search: submittedQuery, sellerOnly: 'true', limit: 10 } })).data,
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
    enabled: !!sellerId,
  });

  const txQ = useQuery<SellerTx[]>({
    queryKey: ['admin', 'txs', sellerId],
    queryFn: async () => (await api.get(`/admin/balance/sellers/${sellerId}/transactions`)).data,
    enabled: !!sellerId,
  });

  const b = balQ.data;

  const forceSettle = useMutation({
    mutationFn: (txId: string) => api.post(`/admin/balance/transactions/${txId}/force-settle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'balance', sellerId] });
      qc.invalidateQueries({ queryKey: ['admin', 'txs', sellerId] });
      setPendingAction(null);
      setActionErr('');
      toast.success('Tranzaksiya hisoblandi');
    },
    onError: (e) => setActionErr(extractErrorMessage(e)),
  });

  const forceRefund = useMutation({
    mutationFn: (txId: string) => api.post(`/admin/balance/transactions/${txId}/force-refund`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'balance', sellerId] });
      qc.invalidateQueries({ queryKey: ['admin', 'txs', sellerId] });
      setPendingAction(null);
      setActionErr('');
      toast.success('Mablag\' qaytarildi');
    },
    onError: (e) => setActionErr(extractErrorMessage(e)),
  });

  const openConfirm = (tx: SellerTx, kind: 'settle' | 'refund') => {
    setActionErr('');
    setPendingAction({ tx, kind });
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    if (pendingAction.kind === 'settle') forceSettle.mutate(pendingAction.tx.id);
    else forceRefund.mutate(pendingAction.tx.id);
  };

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  const adjust = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/balance/sellers/${sellerId}/adjust`, {
        amount: Number(adjustAmount),
        description: adjustDesc.trim(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'balance', sellerId] });
      qc.invalidateQueries({ queryKey: ['admin', 'txs', sellerId] });
      setAdjustOpen(false);
      setAdjustAmount('');
      setAdjustDesc('');
      toast.success('Balans tuzatildi');
    },
  });

  const adjustAmountValid = adjustAmount.trim() !== '' && Number.isFinite(Number(adjustAmount)) && Number(adjustAmount) !== 0;
  const openAdjustDialog = () => {
    adjust.reset();
    setAdjustAmount('');
    setAdjustDesc('');
    setAdjustOpen(true);
  };

  return (
    <div className="p-6">
      <PageHeader title="Balanslar" description="Sotuvchi bo'yicha balans va tranzaksiyalar" />

      <div className="mt-6 max-w-md space-y-2">
        {selectedSeller ? (
          <Card className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{selectedSeller.name || '—'}</p>
              <p className="text-xs text-muted-foreground">{selectedSeller.phone}</p>
            </div>
            <button
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              onClick={clearSeller}
              title="Boshqa sotuvchini qidirish">
              <X className="size-4" />
            </button>
          </Card>
        ) : (
          <>
            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); setSubmittedQuery(query.trim()); }}>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Sotuvchi ismi yoki telefon raqami..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Qidirish
              </button>
            </form>

            {submittedQuery && (
              <Card className="divide-y overflow-hidden">
                {sellerSearchQ.isLoading ? (
                  <p className="p-3 text-sm text-muted-foreground">Qidirilmoqda…</p>
                ) : sellerSearchQ.isError ? (
                  <p className="p-3 text-sm text-destructive">
                    {extractErrorMessage(sellerSearchQ.error)} —{' '}
                    <button className="underline" onClick={() => sellerSearchQ.refetch()}>qayta urinish</button>
                  </p>
                ) : (sellerSearchQ.data?.items.length ?? 0) === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Sotuvchi topilmadi</p>
                ) : (
                  sellerSearchQ.data!.items.map((s) => (
                    <button
                      key={s.id}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => pickSeller(s)}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{s.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{s.phone}</p>
                      </div>
                    </button>
                  ))
                )}
              </Card>
            )}
          </>
        )}
      </div>

      {balQ.isLoading && <p className="mt-4 text-sm text-muted-foreground">Yuklanmoqda…</p>}
      {balQ.isError && (
        <p className="mt-4 text-sm text-destructive">
          {extractErrorMessage(balQ.error)} —{' '}
          <button className="underline" onClick={() => balQ.refetch()}>qayta urinish</button>
        </p>
      )}

      {b && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Kutilmoqda</p>
              <p className="mt-1 text-xl font-bold text-amber-600">{fmt(b.pendingBalance)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Mavjud</p>
              <p className="mt-1 text-xl font-bold text-green-600">{fmt(b.availableBalance)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Qarz</p>
              <p className="mt-1 text-xl font-bold text-destructive">{fmt(b.debtBalance)}</p>
              {b.debtDueDate && (
                <p className="text-xs text-muted-foreground">Muddat: {b.debtDueDate}</p>
              )}
            </Card>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={openAdjustDialog}>
              <Pencil className="size-3.5" /> Balansni qo&apos;lda tuzatish
            </Button>
          </div>

          <h3 className="mt-6 text-sm font-semibold">Tranzaksiyalar</h3>
          {txQ.isLoading && <p className="mt-2 text-sm text-muted-foreground">Yuklanmoqda…</p>}
          {txQ.isError && (
            <p className="mt-2 text-sm text-destructive">
              {extractErrorMessage(txQ.error)} —{' '}
              <button className="underline" onClick={() => txQ.refetch()}>qayta urinish</button>
            </p>
          )}
          <div className="mt-2 space-y-2">
            {(txQ.data ?? []).map((tx) => (
              <Card key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-muted-foreground">{tx.type}</p>
                  {tx.description && <p className="text-sm">{tx.description}</p>}
                </div>
                <Badge variant={tx.status === 'settled' ? 'success' : 'neutral'}>{tx.status}</Badge>
                <span className={`text-sm font-semibold ${Number(tx.amount) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {Number(tx.amount) >= 0 ? '+' : ''}{fmt(tx.amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString('uz-UZ')}
                </span>
                {tx.status === 'pending' && tx.type === 'online_order_pending' && (
                  <div className="flex gap-1">
                    <button
                      className="text-xs rounded px-2 py-1 bg-green-100 text-green-800 hover:bg-green-200"
                      onClick={() => openConfirm(tx, 'settle')}
                    >
                      Settle
                    </button>
                    <button
                      className="text-xs rounded px-2 py-1 bg-red-100 text-red-800 hover:bg-red-200"
                      onClick={() => openConfirm(tx, 'refund')}
                    >
                      Refund
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.kind === 'settle' ? "Tranzaksiyani majburiy hisobga qo'shish" : 'Mablag’ni majburiy qaytarish'}
        description={pendingAction && (
          <div className="space-y-1">
            <p>
              Sotuvchi: <span className="font-medium text-foreground">{selectedSeller?.name || sellerId}</span>
            </p>
            <p>
              Summasi:{' '}
              <span className="font-semibold text-foreground">{fmt(pendingAction.tx.amount)}</span>
            </p>
            {pendingAction.tx.description && <p>{pendingAction.tx.description}</p>}
            <p className="mt-2 text-destructive">
              {pendingAction.kind === 'settle'
                ? "Bu amal 24 soatlik himoya muddatini kutmasdan mablag'ni sotuvchining mavjud balansiga darhol o'tkazadi. Haqiqiy bank/hisob operatsiyasi — bekor qilib bo'lmaydi."
                : "Bu amal mablag'ni kutmasdan xaridorga qaytaradi va tranzaksiyani yopiladi. Haqiqiy pul operatsiyasi — bekor qilib bo'lmaydi."}
            </p>
          </div>
        )}
        confirmLabel={pendingAction?.kind === 'settle' ? "Ha, hisobga qo'shish" : 'Ha, qaytarish'}
        pending={forceSettle.isPending || forceRefund.isPending}
        error={actionErr}
        onConfirm={confirmAction}
        onCancel={() => { setPendingAction(null); setActionErr(''); }}
      />

      <ConfirmDialog
        open={adjustOpen}
        title="Balansni qo'lda tuzatish"
        description={
          <p>
            Sotuvchi: <span className="font-medium text-foreground">{selectedSeller?.name || sellerId}</span>.
            Musbat summa — qo&apos;shadi, manfiy summa — ayiradi. Bu haqiqiy pul operatsiyasi — ehtiyot bo&apos;ling.
          </p>
        }
        confirmLabel="Tasdiqlash"
        confirmDisabled={!adjustAmountValid || !adjustDesc.trim()}
        pending={adjust.isPending}
        error={adjust.isError ? extractErrorMessage(adjust.error) : ''}
        onConfirm={() => adjust.mutate()}
        onCancel={() => setAdjustOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Summa (so&apos;m) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="masalan: -50000 yoki 100000"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Sabab <span className="text-destructive">*</span>
            </label>
            <textarea
              value={adjustDesc}
              onChange={(e) => setAdjustDesc(e.target.value)}
              rows={2}
              placeholder="Nega bu tuzatish qilinmoqda…"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}

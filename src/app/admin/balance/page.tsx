'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

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

const fmt = (v: string) => Number(v).toLocaleString('uz-UZ') + " so'm";

export default function AdminBalancePage() {
  const [sellerId, setSellerId] = useState('');
  const [search, setSearch] = useState('');

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

  return (
    <div className="p-6">
      <PageHeader title="Balanslar" description="Seller ID bo'yicha balans va tranzaksiyalar" />

      <div className="mt-6 flex gap-2">
        <input
          className="w-80 rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Seller userId kiriting..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => setSellerId(search.trim())}
        >
          <Search className="size-4" />
          Ko'rish
        </button>
      </div>

      {balQ.isLoading && <p className="mt-4 text-sm text-muted-foreground">Yuklanmoqda…</p>}

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

          <h3 className="mt-6 text-sm font-semibold">Tranzaksiyalar</h3>
          {txQ.isLoading && <p className="mt-2 text-sm text-muted-foreground">Yuklanmoqda…</p>}
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
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

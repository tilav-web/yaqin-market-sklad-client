'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Fragment, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

type PayableCategory = 'supplier' | 'rent' | 'utility' | 'loan' | 'salary' | 'other';

const CATEGORY_LABELS: Record<PayableCategory, string> = {
  supplier: "Ta'minotchi",
  rent: 'Ijara',
  utility: 'Kommunal',
  loan: 'Kredit',
  salary: 'Ish haqi',
  other: 'Boshqa',
};

interface PayableShopSummary {
  shopId: string;
  shopName: string;
  outstanding: number;
  creditors: number;
  overdue: number;
}

interface PayableAccountSummary {
  id: string;
  name: string;
  category: PayableCategory;
  phone: string | null;
  totalCharged: number;
  totalPaid: number;
  balance: number;
  lastActivityAt: string | null;
  nearestDueDate: string | null;
}

const fmt = (n: number) => n.toLocaleString('uz-UZ') + " so'm";

/**
 * Inline per-shop creditor breakdown — mirrors shops/page.tsx's expandable
 * complaints panel, since this list has no separate shop-detail route to
 * hang a tab off.
 */
function ShopPayablesPanel({ shopId }: { shopId: string }) {
  const accountsQ = useQuery<PayableAccountSummary[]>({
    queryKey: ['admin', 'payables', 'shops', shopId],
    queryFn: async () => (await api.get(`/admin/payables/shops/${shopId}`)).data,
  });

  const accounts = accountsQ.data ?? [];

  if (accountsQ.isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Yuklanmoqda…</p>;
  }
  if (accountsQ.isError) {
    return (
      <p className="p-4 text-sm text-destructive">
        {extractErrorMessage(accountsQ.error)} —{' '}
        <button className="underline" onClick={() => accountsQ.refetch()}>qayta urinish</button>
      </p>
    );
  }
  if (accounts.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Bu do&apos;konda kreditor yo&apos;q.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-4 font-semibold">Kreditor</th>
            <th className="py-2 pr-4 font-semibold">Turkumi</th>
            <th className="py-2 pr-4 font-semibold">Telefon</th>
            <th className="py-2 pr-4 font-semibold">Jami olingan</th>
            <th className="py-2 pr-4 font-semibold">To&apos;langan</th>
            <th className="py-2 pr-4 font-semibold">Qoldiq</th>
            <th className="py-2 font-semibold">Muddat</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => {
            const overdue = a.balance > 0 && !!a.nearestDueDate && a.nearestDueDate < today;
            return (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-medium text-foreground">{a.name}</td>
                <td className="py-2 pr-4 text-muted-foreground">{CATEGORY_LABELS[a.category]}</td>
                <td className="py-2 pr-4 text-muted-foreground">{a.phone ?? '—'}</td>
                <td className="py-2 pr-4 text-muted-foreground">{fmt(a.totalCharged)}</td>
                <td className="py-2 pr-4 text-muted-foreground">{fmt(a.totalPaid)}</td>
                <td className={`py-2 pr-4 font-semibold ${a.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {fmt(a.balance)}
                </td>
                <td className="py-2">
                  {a.nearestDueDate ? (
                    <Badge variant={overdue ? 'danger' : 'neutral'}>{a.nearestDueDate}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PayablesAdminPage() {
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);

  const shopsQuery = useQuery<PayableShopSummary[]>({
    queryKey: ['admin', 'payables'],
    queryFn: async () => (await api.get('/admin/payables')).data,
  });

  const shops = shopsQuery.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Tarmoq"
        title="Do'kon majburiyatlari"
        description="Do'konlarning tashqi kreditorlarga (ta'minotchi, ijara, kommunal, kredit, ish haqi) qarzlari — faqat ko'rish uchun."
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Do&apos;kon</th>
              <th className="px-5 py-3 font-semibold">Umumiy qarz</th>
              <th className="px-5 py-3 font-semibold">Kreditorlar</th>
              <th className="px-5 py-3 font-semibold">Muddati o&apos;tgan</th>
              <th className="px-5 py-3 text-right font-semibold">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((s) => (
              <Fragment key={s.shopId}>
                <tr className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3 font-semibold text-foreground">{s.shopName || s.shopId}</td>
                  <td className="px-5 py-3 font-semibold text-destructive">{fmt(s.outstanding)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.creditors} ta</td>
                  <td className="px-5 py-3">
                    {s.overdue > 0 ? (
                      <Badge variant="danger">
                        <AlertTriangle /> {s.overdue} ta
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedShopId(expandedShopId === s.shopId ? null : s.shopId)}>
                        Kreditorlar
                        {expandedShopId === s.shopId ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
                {expandedShopId === s.shopId ? (
                  <tr className="border-b border-border bg-muted/10 last:border-0">
                    <td colSpan={5} className="p-0">
                      <ShopPayablesPanel shopId={s.shopId} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {shopsQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Yuklanmoqda…
                </td>
              </tr>
            ) : null}
            {shopsQuery.isError ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-destructive">
                  {extractErrorMessage(shopsQuery.error)} —{' '}
                  <button className="underline" onClick={() => shopsQuery.refetch()}>
                    qayta urinish
                  </button>
                </td>
              </tr>
            ) : null}
            {!shopsQuery.isLoading && !shopsQuery.isError && shops.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Hech qaysi do&apos;konda tashqi majburiyat yo&apos;q
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

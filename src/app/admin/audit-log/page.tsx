'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

type AuditAction =
  | 'user_promoted' | 'user_demoted' | 'user_blocked' | 'user_unblocked'
  | 'shop_activated' | 'shop_deactivated'
  | 'balance_adjusted' | 'transaction_force_settled' | 'transaction_force_refunded'
  | 'debt_forgiven' | 'debt_extended' | 'prime_subscription_extended';

interface AuditLogEntry {
  id: string;
  adminUserId: string;
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin: { id: string; name: string | null; phone: string } | null;
}

interface AuditLogPage { items: AuditLogEntry[]; total: number }

const PAGE_SIZE = 30;

const ACTION_LABEL: Record<AuditAction, string> = {
  user_promoted: 'Admin qilindi',
  user_demoted: 'Admindan olindi',
  user_blocked: 'Bloklandi',
  user_unblocked: 'Blokdan chiqarildi',
  shop_activated: "Do'kon faollashtirildi",
  shop_deactivated: "Do'kon o'chirildi",
  balance_adjusted: "Balans qo'lda tuzatildi",
  transaction_force_settled: 'Tranzaksiya majburiy hisoblandi',
  transaction_force_refunded: 'Tranzaksiya majburiy qaytarildi',
  debt_forgiven: 'Qarz kechirildi',
  debt_extended: 'Qarz muddati uzaytirildi',
  prime_subscription_extended: 'Prime obuna uzaytirildi',
};

const ACTION_VARIANT: Record<AuditAction, 'success' | 'danger' | 'warning' | 'neutral'> = {
  user_promoted: 'warning',
  user_demoted: 'neutral',
  user_blocked: 'danger',
  user_unblocked: 'success',
  shop_activated: 'success',
  shop_deactivated: 'danger',
  balance_adjusted: 'warning',
  transaction_force_settled: 'success',
  transaction_force_refunded: 'danger',
  debt_forgiven: 'success',
  debt_extended: 'neutral',
  prime_subscription_extended: 'neutral',
};

const ACTION_FILTERS: { key: AuditAction | ''; label: string }[] = [
  { key: '', label: 'Barchasi' },
  { key: 'user_promoted', label: 'Admin qilindi' },
  { key: 'user_demoted', label: 'Admindan olindi' },
  { key: 'user_blocked', label: 'Bloklandi' },
  { key: 'shop_activated', label: "Do'kon faollashtirildi" },
  { key: 'shop_deactivated', label: "Do'kon o'chirildi" },
  { key: 'balance_adjusted', label: "Balans tuzatildi" },
  { key: 'debt_forgiven', label: 'Qarz kechirildi' },
  { key: 'prime_subscription_extended', label: 'Prime uzaytirildi' },
];

function metadataSummary(entry: AuditLogEntry): string | null {
  if (!entry.metadata) return null;
  const parts: string[] = [];
  const m = entry.metadata;
  if (typeof m.amount === 'number') parts.push(`${m.amount.toLocaleString('uz-UZ')} so'm`);
  if (typeof m.days === 'number') parts.push(`${m.days} kun`);
  return parts.length ? parts.join(' · ') : null;
}

export default function AuditLogPage() {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [page, setPage] = useState(0);

  const logQuery = useQuery<AuditLogPage>({
    queryKey: ['admin', 'audit-log', action, page],
    queryFn: async () =>
      (await api.get('/admin/audit-log', {
        params: { action: action || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      })).data,
    placeholderData: (prev) => prev,
  });

  const items = logQuery.data?.items ?? [];
  const total = logQuery.data?.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Tizim"
        title="Amallar tarixi"
        description="Adminlar tomonidan bajarilgan muhim amallar — kim, nima, qachon va nima sababdan."
      />

      <div className="flex flex-wrap gap-2">
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => { setAction(f.key); setPage(0); }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              action === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Amal</th>
              <th className="px-4 py-3 font-semibold">Admin</th>
              <th className="px-4 py-3 font-semibold">Sabab</th>
              <th className="px-4 py-3 font-semibold">Tafsilot</th>
              <th className="px-4 py-3 font-semibold">Sana</th>
            </tr>
          </thead>
          <tbody>
            {logQuery.isLoading ? (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda…</td></tr>
            ) : logQuery.isError ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-destructive">
                  {extractErrorMessage(logQuery.error)} —{' '}
                  <button className="underline" onClick={() => logQuery.refetch()}>qayta urinish</button>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Yozuv topilmadi</td></tr>
            ) : items.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Badge variant={ACTION_VARIANT[e.action]}>{ACTION_LABEL[e.action] ?? e.action}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {e.admin ? (e.admin.name || e.admin.phone) : e.adminUserId}
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{e.reason || '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{metadataSummary(e) ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString('uz-UZ')}
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

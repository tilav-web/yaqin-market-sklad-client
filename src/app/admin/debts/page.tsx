'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface OverdueDebt {
  id: string;
  sellerId: string;
  debtBalance: string;
  debtDueDate: string;
  availableBalance: string;
}

const fmt = (v: string) => Number(v).toLocaleString('uz-UZ') + " so'm";

// Mirrors the server's ExtendDebtDto (@IsInt() @Min(1) @Max(365)) — the
// number input's min/max attrs are visual only, a user can still type/paste
// an out-of-range value, so the button must gate on the same rule.
const isValidExtendDays = (raw: string | undefined): boolean => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 365;
};

type PendingDebtAction =
  | { kind: 'forgive'; debt: OverdueDebt; reason: string }
  | { kind: 'extend'; debt: OverdueDebt; days: number };

export default function AdminDebtsPage() {
  const qc = useQueryClient();
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<PendingDebtAction | null>(null);

  const debtsQ = useQuery<OverdueDebt[]>({
    queryKey: ['admin', 'overdue-debts'],
    queryFn: async () => (await api.get('/admin/balance/overdue-debts')).data,
    refetchInterval: 30_000,
  });

  const forgive = useMutation({
    mutationFn: ({ sellerId, reason }: { sellerId: string; reason: string }) =>
      api.post(`/admin/balance/sellers/${sellerId}/forgive-debt`, { reason }),
    onSuccess: (_, { sellerId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'overdue-debts'] });
      setReasonDrafts((p) => { const next = { ...p }; delete next[sellerId]; return next; });
      setExtendDays((p) => { const next = { ...p }; delete next[sellerId]; return next; });
      setPendingAction(null);
    },
  });

  const extend = useMutation({
    mutationFn: ({ sellerId, days }: { sellerId: string; days: number }) =>
      api.post(`/admin/balance/sellers/${sellerId}/extend-debt`, { days }),
    onSuccess: (_, { sellerId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'overdue-debts'] });
      setReasonDrafts((p) => { const next = { ...p }; delete next[sellerId]; return next; });
      setExtendDays((p) => { const next = { ...p }; delete next[sellerId]; return next; });
      setPendingAction(null);
    },
  });

  const debts = debtsQ.data ?? [];
  const actionPending = forgive.isPending || extend.isPending;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Muddati o'tgan qarzlar" description="Qarz to'lanmagan sellerlar" />

      {debtsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
      ) : debtsQ.isError ? (
        <Card className="p-6 text-sm text-destructive">
          {extractErrorMessage(debtsQ.error)} —{' '}
          <button className="underline" onClick={() => debtsQ.refetch()}>qayta urinish</button>
        </Card>
      ) : debts.length === 0 ? (
        <Card className="flex items-center gap-3 p-6">
          <Check className="size-5 text-green-600" />
          <p className="text-sm text-muted-foreground">Muddati o'tgan qarzlar yo'q</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {debts.map((d) => (
            <Card key={d.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-destructive" />
                    <span className="font-mono text-xs text-muted-foreground">{d.sellerId}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Qarz</p>
                      <p className="font-bold text-destructive">{fmt(d.debtBalance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Muddat</p>
                      <p className="font-semibold text-destructive">{d.debtDueDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mavjud balans</p>
                      <p className="font-semibold text-green-600">{fmt(d.availableBalance)}</p>
                    </div>
                  </div>
                </div>
                <Badge variant="danger">Muddati o'tgan</Badge>
              </div>

              {/* Forgive debt */}
              <div className="flex gap-2 items-center pt-1 border-t">
                <input
                  className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  placeholder="Kechirish sababi..."
                  value={reasonDrafts[d.sellerId] ?? ''}
                  onChange={(e) => setReasonDrafts((p) => ({ ...p, [d.sellerId]: e.target.value }))}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionPending || !(reasonDrafts[d.sellerId]?.trim())}
                  onClick={() => setPendingAction({ kind: 'forgive', debt: d, reason: reasonDrafts[d.sellerId] ?? '' })}
                  className="text-destructive hover:bg-destructive/10 border-destructive/50"
                >
                  Kechirish
                </Button>
              </div>

              {/* Extend due date */}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={1}
                  max={365}
                  className="w-24 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  placeholder="Kun..."
                  value={extendDays[d.sellerId] ?? ''}
                  onChange={(e) => setExtendDays((p) => ({ ...p, [d.sellerId]: e.target.value }))}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionPending || !isValidExtendDays(extendDays[d.sellerId])}
                  onClick={() => setPendingAction({ kind: 'extend', debt: d, days: Number(extendDays[d.sellerId] ?? 7) })}
                >
                  Muddatni uzaytirish
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.kind === 'forgive' ? "Qarzni kechirish" : "Qarz muddatini uzaytirish"}
        description={pendingAction && (
          <div className="space-y-1">
            <p>
              Sotuvchi: <span className="font-mono text-foreground">{pendingAction.debt.sellerId}</span>
            </p>
            <p>
              Qarz: <span className="font-semibold text-foreground">{fmt(pendingAction.debt.debtBalance)}</span>
            </p>
            {pendingAction.kind === 'forgive' ? (
              <>
                <p>Sabab: {pendingAction.reason}</p>
                <p className="mt-2 text-destructive">
                  Qarz butunlay bekor qilinadi va do&apos;kon avtomatik qayta faollashtiriladi — bu amalni ortga qaytarib bo&apos;lmaydi.
                </p>
              </>
            ) : (
              <>
                <p>Qo&apos;shimcha muddat: <span className="font-semibold text-foreground">{pendingAction.days} kun</span></p>
                <p className="mt-2 text-muted-foreground">
                  Qarz muddati {pendingAction.days} kunga uzaytiriladi, do&apos;kon shu muddatgacha faol qoladi.
                </p>
              </>
            )}
          </div>
        )}
        confirmLabel={pendingAction?.kind === 'forgive' ? 'Ha, kechirish' : 'Ha, uzaytirish'}
        destructive={pendingAction?.kind === 'forgive'}
        pending={actionPending}
        error={
          (forgive.isError && extractErrorMessage(forgive.error)) ||
          (extend.isError && extractErrorMessage(extend.error)) ||
          ''
        }
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.kind === 'forgive') {
            forgive.mutate({ sellerId: pendingAction.debt.sellerId, reason: pendingAction.reason });
          } else {
            extend.mutate({ sellerId: pendingAction.debt.sellerId, days: pendingAction.days });
          }
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

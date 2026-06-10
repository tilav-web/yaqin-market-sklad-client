'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';

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

export default function AdminDebtsPage() {
  const qc = useQueryClient();
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});

  const debtsQ = useQuery<OverdueDebt[]>({
    queryKey: ['admin', 'overdue-debts'],
    queryFn: async () => (await api.get('/admin/balance/overdue-debts')).data,
    refetchInterval: 30_000,
  });

  const forgive = useMutation({
    mutationFn: ({ sellerId, reason }: { sellerId: string; reason: string }) =>
      api.post(`/admin/balance/sellers/${sellerId}/forgive-debt`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'overdue-debts'] }),
  });

  const extend = useMutation({
    mutationFn: ({ sellerId, days }: { sellerId: string; days: number }) =>
      api.post(`/admin/balance/sellers/${sellerId}/extend-debt`, { days }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'overdue-debts'] }),
  });

  const debts = debtsQ.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Muddati o'tgan qarzlar" description="Qarz to'lanmagan sellerlar" />

      {debtsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
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
                  disabled={forgive.isPending || !(reasonDrafts[d.sellerId]?.trim())}
                  onClick={() => forgive.mutate({ sellerId: d.sellerId, reason: reasonDrafts[d.sellerId] ?? '' })}
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
                  disabled={extend.isPending || !Number(extendDays[d.sellerId] ?? 0)}
                  onClick={() => extend.mutate({ sellerId: d.sellerId, days: Number(extendDays[d.sellerId] ?? 7) })}
                >
                  Muddatni uzaytirish
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

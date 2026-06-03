'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MapPin, Store, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader, StatPill } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface SellerApplication {
  id: string;
  shopName: string;
  shopAddress: string;
  shopLatitude: number;
  shopLongitude: number;
  shopPhotos: string[];
  stir: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  user: { id: string; phone: string; name: string | null };
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'approved', label: 'Tasdiqlandi' },
  { key: 'rejected', label: 'Rad etildi' },
  { key: 'all', label: 'Hammasi' },
];

const STATUS: Record<SellerApplication['status'], { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Kutilmoqda', variant: 'warning' },
  approved: { label: 'Tasdiqlandi', variant: 'success' },
  rejected: { label: 'Rad etildi', variant: 'danger' },
};

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const appsQuery = useQuery({
    queryKey: ['admin', 'applications'],
    queryFn: async () => {
      const res = await api.get<SellerApplication[]>('/sellers/admin/applications');
      return res.data;
    },
  });

  const all = useMemo(() => appsQuery.data ?? [], [appsQuery.data]);
  const counts = useMemo(
    () => ({
      pending: all.filter((a) => a.status === 'pending').length,
      approved: all.filter((a) => a.status === 'approved').length,
      rejected: all.filter((a) => a.status === 'rejected').length,
    }),
    [all],
  );
  const list = filter === 'all' ? all : all.filter((a) => a.status === filter);

  const approve = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/sellers/admin/applications/${id}/approve`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'applications'] }),
    onError: (e) => alert(extractErrorMessage(e)),
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.post(`/sellers/admin/applications/${id}/reject`, { reason });
    },
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
    },
    onError: (e) => alert(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Seller arizalari"
        description="Foydalanuvchilar sotuvchi bo'lish uchun yuborgan arizalarni ko'rib chiqing va tasdiqlang."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatPill label="Kutilmoqda" value={counts.pending} />
        <StatPill label="Tasdiqlangan" value={counts.approved} />
        <StatPill label="Rad etilgan" value={counts.rejected} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'default' : 'outline'}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      {appsQuery.isLoading ? (
        <div className="grid gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 border-dashed py-14 text-center">
          <Store className="size-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Bu bo'limda ariza yo'q</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {list.map((app) => {
            const st = STATUS[app.status];
            return (
              <Card key={app.id} className="overflow-hidden p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <Store className="size-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-foreground">{app.shopName}</p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">{app.shopAddress}</p>
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="size-4 text-primary" />
                        <span className="text-foreground">{app.user.name ?? '—'}</span>
                        <span>· {app.user.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4 text-primary" />
                        {app.shopLatitude.toFixed(4)}, {app.shopLongitude.toFixed(4)}
                      </div>
                    </div>

                    {app.stir ? (
                      <p className="mt-1 text-xs text-muted-foreground">STIR: {app.stir}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(app.createdAt).toLocaleString('uz-UZ')}
                    </p>

                    {app.status === 'rejected' && app.rejectionReason ? (
                      <p className="mt-3 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                        Sabab: {app.rejectionReason}
                      </p>
                    ) : null}

                    {app.status === 'pending' ? (
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={approve.isPending}
                          onClick={() => approve.mutate(app.id)}>
                          <Check className="size-4" />
                          Tasdiqlash
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setRejectingId(app.id)}>
                          <X className="size-4" />
                          Rad etish
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {rejectingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-foreground">Arizani rad etish</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sabab foydalanuvchiga ko'rsatiladi.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rad etish sababi"
              rows={3}
              className="mt-4 w-full rounded-lg border border-input bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!rejectReason || reject.isPending}
                onClick={() => reject.mutate({ id: rejectingId, reason: rejectReason })}>
                Rad etish
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

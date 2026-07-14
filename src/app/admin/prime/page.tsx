'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Edit2, Plus, Star, TrendingUp, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface RevenueStats {
  totalRevenue: number;
  revenue30d: number;
  activeSubscriptions: number;
  byPlan: { planId: string; planName: string; activeCount: number; monthlyRecurringValue: number }[];
}

interface PrimePlan {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string | null;
  commissionRate: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}
interface Subscription {
  id: string;
  sellerId: string;
  planId: string;
  commissionRateSnapshot: string;
  priceSnapshot: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  plan: Pick<PrimePlan, 'name'>;
  seller: { id: string; name: string | null; phone: string } | null;
}

const EMPTY_FORM = { name: '', monthlyPrice: '', yearlyPrice: '', commissionRate: '', description: '', sortOrder: '0' };

const fmt = (v: string) => Number(v).toLocaleString('uz-UZ') + " so'm";

export default function AdminPrimePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'plans' | 'subs'>('plans');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PrimePlan | null>(null);

  const plansQ = useQuery<PrimePlan[]>({
    queryKey: ['admin', 'prime', 'plans'],
    queryFn: async () => (await api.get('/admin/prime/plans', { params: { all: 'true' } })).data,
  });
  const subsQ = useQuery<Subscription[]>({
    queryKey: ['admin', 'prime', 'subs'],
    queryFn: async () => (await api.get('/admin/prime/subscriptions')).data,
    enabled: tab === 'subs',
  });
  const revenueQ = useQuery<RevenueStats>({
    queryKey: ['admin', 'prime', 'revenue-stats'],
    queryFn: async () => (await api.get('/admin/prime/revenue-stats')).data,
    refetchInterval: 60_000,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name,
        monthlyPrice: form.monthlyPrice,
        yearlyPrice: form.yearlyPrice || null,
        commissionRate: form.commissionRate,
        description: form.description || null,
        sortOrder: Number(form.sortOrder),
      };
      if (editing) return api.put(`/admin/prime/plans/${editing}`, body);
      return api.post('/admin/prime/plans', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'prime', 'plans'] });
      setForm(EMPTY_FORM);
      setEditing(null);
      setErr('');
    },
    onError: (e: unknown) => setErr(extractErrorMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: (plan: PrimePlan) =>
      api.put(`/admin/prime/plans/${plan.id}`, { isActive: !plan.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'prime', 'plans'] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/prime/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'prime', 'plans'] });
      setPendingDelete(null);
    },
  });

  const [extendingSub, setExtendingSub] = useState<Subscription | null>(null);
  const [extendDays, setExtendDays] = useState('7');

  const extend = useMutation({
    mutationFn: async () => {
      if (!extendingSub) return;
      await api.put(`/admin/prime/subscriptions/${extendingSub.id}/extend`, { days: Number(extendDays) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'prime', 'subs'] });
      setExtendingSub(null);
      setExtendDays('7');
    },
  });

  const extendDaysValid = /^\d+$/.test(extendDays) && Number(extendDays) >= 1 && Number(extendDays) <= 365;

  const startEdit = (p: PrimePlan) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      monthlyPrice: p.monthlyPrice,
      yearlyPrice: p.yearlyPrice ?? '',
      commissionRate: p.commissionRate,
      description: p.description ?? '',
      sortOrder: String(p.sortOrder),
    });
  };

  const revenue = revenueQ.data;

  return (
    <div className="p-6">
      <PageHeader title="Prime obuna" description="Tariflar va obunalar boshqaruvi" />

      {revenue && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="flex items-start gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Umumiy daromad</p>
              <p className="mt-0.5 text-xl font-bold text-foreground">{fmt(String(revenue.totalRevenue))}</p>
              <p className="text-xs text-muted-foreground">Oxirgi 30 kun: {fmt(String(revenue.revenue30d))}</p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faol obunalar</p>
              <p className="mt-0.5 text-xl font-bold text-foreground">{revenue.activeSubscriptions}</p>
            </div>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="size-3.5" /> Tarif bo&apos;yicha faol
            </p>
            <div className="mt-1.5 space-y-0.5">
              {revenue.byPlan.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : revenue.byPlan.map((p) => (
                <p key={p.planId} className="flex justify-between text-sm">
                  <span>{p.planName}</span>
                  <span className="font-medium text-foreground">{p.activeCount} ta</span>
                </p>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-border">
        {(['plans', 'subs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t === 'plans' ? 'Tariflar' : 'Faol obunalar'}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Form */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              {editing ? 'Tarifni tahrirlash' : 'Yangi tarif'}
            </h3>
            <Card className="space-y-3 p-4">
              {[
                { key: 'name', label: 'Nomi', placeholder: 'Pro, Business...' },
                { key: 'monthlyPrice', label: 'Oylik narx (so\'m)', placeholder: '50000' },
                { key: 'yearlyPrice', label: 'Yillik narx (ixtiyoriy)', placeholder: '500000' },
                { key: 'commissionRate', label: 'Komissiya (%)', placeholder: '8' },
                { key: 'description', label: 'Tavsif', placeholder: '' },
                { key: 'sortOrder', label: 'Tartib', placeholder: '0' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
              {err && <p className="text-xs text-destructive">{err}</p>}
              <div className="flex gap-2">
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}
                  >
                    Bekor
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={!form.name.trim() || !form.monthlyPrice.trim() || !form.commissionRate.trim() || save.isPending}
                  onClick={() => save.mutate()}>
                  <Plus className="size-3" />
                  {editing ? 'Saqlash' : 'Qo\'shish'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Plans list */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Barcha tariflar</h3>
            {plansQ.isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>}
            <div className="space-y-2">
              {(plansQ.data ?? []).map((p) => (
                <Card key={p.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        <Badge variant={p.isActive ? 'success' : 'neutral'}>
                          {p.isActive ? 'Faol' : 'Nofaol'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Oylik: {fmt(p.monthlyPrice)}
                        {p.yearlyPrice && ` · Yillik: ${fmt(p.yearlyPrice)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">Komissiya: {p.commissionRate}%</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(p)}>
                        <Edit2 className="size-3" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => toggle.mutate(p)}
                      >
                        {p.isActive ? '⏸' : '▶'}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => { del.reset(); setPendingDelete(p); }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'subs' && (
        <div className="mt-6">
          {subsQ.isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>}
          <div className="space-y-2">
            {(subsQ.data ?? []).map((s) => (
              <Card key={s.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.plan?.name ?? s.planId}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.seller ? (s.seller.name || s.seller.phone) : s.sellerId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{s.startDate} — {s.endDate}</p>
                  <p className="text-xs text-muted-foreground">
                    Komissiya: {s.commissionRateSnapshot}% · {fmt(s.priceSnapshot)}
                  </p>
                </div>
                <Badge variant={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Faol' : 'Tugagan'}</Badge>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Muddatni uzaytirish"
                  onClick={() => { extend.reset(); setExtendDays('7'); setExtendingSub(s); }}>
                  <CalendarPlus className="size-4" />
                </Button>
              </Card>
            ))}
            {!subsQ.isLoading && (subsQ.data ?? []).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Faol obunalar yo'q</p>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Tarifni o'chirish"
        description={pendingDelete && (
          <div className="space-y-1">
            <p>
              Tarif: <span className="font-semibold text-foreground">{pendingDelete.name}</span>
            </p>
            <p className="mt-2 text-destructive">
              Bu amalni ortga qaytarib bo&apos;lmaydi. Agar bu tarifga faol obuna bo&apos;lgan sotuvchilar bo&apos;lsa, server bu amalni rad etadi.
            </p>
          </div>
        )}
        confirmLabel="Ha, o'chirish"
        pending={del.isPending}
        error={del.isError ? extractErrorMessage(del.error) : ''}
        onConfirm={() => pendingDelete && del.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={!!extendingSub}
        title="Obuna muddatini uzaytirish"
        destructive={false}
        description={extendingSub && (
          <p>
            Sotuvchi: <span className="font-medium text-foreground">
              {extendingSub.seller ? (extendingSub.seller.name || extendingSub.seller.phone) : extendingSub.sellerId}
            </span>
            {' '}— joriy tugash sanasi: <span className="font-medium text-foreground">{extendingSub.endDate}</span>
          </p>
        )}
        confirmLabel="Uzaytirish"
        confirmDisabled={!extendDaysValid}
        pending={extend.isPending}
        error={extend.isError ? extractErrorMessage(extend.error) : ''}
        onConfirm={() => extend.mutate()}
        onCancel={() => setExtendingSub(null)}>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Necha kunga uzaytirish <span className="text-destructive">*</span>
        </label>
        <Input
          type="number"
          min={1}
          max={365}
          value={extendDays}
          onChange={(e) => setExtendDays(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}

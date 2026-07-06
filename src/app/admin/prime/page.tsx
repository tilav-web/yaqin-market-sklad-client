'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

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
}

const EMPTY_FORM = { name: '', monthlyPrice: '', yearlyPrice: '', commissionRate: '', description: '', sortOrder: '0' };

const fmt = (v: string) => Number(v).toLocaleString('uz-UZ') + " so'm";

export default function AdminPrimePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'plans' | 'subs'>('plans');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const plansQ = useQuery<PrimePlan[]>({
    queryKey: ['admin', 'prime', 'plans'],
    queryFn: async () => (await api.get('/admin/prime/plans', { params: { all: 'true' } })).data,
  });
  const subsQ = useQuery<Subscription[]>({
    queryKey: ['admin', 'prime', 'subs'],
    queryFn: async () => (await api.get('/admin/prime/subscriptions')).data,
    enabled: tab === 'subs',
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'prime', 'plans'] }),
  });

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

  return (
    <div className="p-6">
      <PageHeader title="Prime obuna" description="Tariflar va obunalar boshqaruvi" />

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
                        onClick={() => del.mutate(p.id)}
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
                  <p className="text-xs text-muted-foreground font-mono">{s.sellerId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{s.startDate} — {s.endDate}</p>
                  <p className="text-xs text-muted-foreground">
                    Komissiya: {s.commissionRateSnapshot}% · {fmt(s.priceSnapshot)}
                  </p>
                </div>
                <Badge variant={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Faol' : 'Tugagan'}</Badge>
              </Card>
            ))}
            {!subsQ.isLoading && (subsQ.data ?? []).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Faol obunalar yo'q</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

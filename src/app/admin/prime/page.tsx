'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Edit2, Star, TrendingUp, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { I18nInput, I18nValue } from '@/components/ui/i18n-input';
import { api, extractErrorMessage } from '@/lib/api';
import { latinToCyrillic, getLocalizedText } from '@/lib/transliteration';
import { toast } from '@/stores/toast';

interface RevenueStats {
  totalRevenue: number;
  revenue30d: number;
  activeSubscriptions: number;
  byPlan: { planId: string; planName: string; activeCount: number; monthlyRecurringValue: number }[];
}

interface PrimePlan {
  id: string;
  name: string | { uz?: string; kr?: string; ru?: string };
  nameUzLatn?: string;
  nameUzCyrl?: string;
  nameRu?: string;
  monthlyPrice: string;
  yearlyPrice: string | null;
  commissionRate: string;
  description: string | { uz?: string; kr?: string; ru?: string } | null;
  descriptionUzLatn?: string | null;
  descriptionUzCyrl?: string | null;
  descriptionRu?: string | null;
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

const EMPTY_FORM = {
  name: { uz: '', kr: '', ru: '' } as I18nValue,
  monthlyPrice: '',
  yearlyPrice: '',
  commissionRate: '',
  description: { uz: '', kr: '', ru: '' } as I18nValue,
  sortOrder: '0',
};

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
      const nameUzLatn = form.name.uz.trim();
      const body = {
        name: nameUzLatn,
        nameUzLatn,
        nameUzCyrl: form.name.kr?.trim() || latinToCyrillic(nameUzLatn),
        nameRu: form.name.ru?.trim() || nameUzLatn,
        monthlyPrice: form.monthlyPrice,
        yearlyPrice: form.yearlyPrice || null,
        commissionRate: form.commissionRate,
        description: form.description.uz.trim() || null,
        descriptionUzLatn: form.description.uz.trim() || null,
        descriptionUzCyrl: form.description.kr?.trim() || (form.description.uz.trim() ? latinToCyrillic(form.description.uz.trim()) : null),
        descriptionRu: form.description.ru?.trim() || form.description.uz.trim() || null,
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
      toast.success('Tarif saqlandi');
    },
    onError: (e: unknown) => setErr(extractErrorMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: (plan: PrimePlan) =>
      api.put(`/admin/prime/plans/${plan.id}`, { isActive: !plan.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'prime', 'plans'] });
      toast.success('Holat yangilandi');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/prime/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'prime', 'plans'] });
      setPendingDelete(null);
      toast.success("Tarif o'chirildi");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
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
      toast.success('Obuna muddati uzaytirildi');
    },
  });

  const extendDaysValid = /^\d+$/.test(extendDays) && Number(extendDays) >= 1 && Number(extendDays) <= 365;

  const startEdit = (p: PrimePlan) => {
    setEditing(p.id);
    const nameUz = p.nameUzLatn || getLocalizedText(p.name, 'uz');
    const nameKr = p.nameUzCyrl || getLocalizedText(p.name, 'kr') || latinToCyrillic(nameUz);
    const nameRu = p.nameRu || getLocalizedText(p.name, 'ru') || '';
    const descUz = p.descriptionUzLatn || getLocalizedText(p.description, 'uz');
    const descKr = p.descriptionUzCyrl || getLocalizedText(p.description, 'kr');
    const descRu = p.descriptionRu || getLocalizedText(p.description, 'ru');
    setForm({
      name: {
        uz: nameUz,
        kr: nameKr,
        ru: nameRu,
      },
      monthlyPrice: p.monthlyPrice,
      yearlyPrice: p.yearlyPrice ?? '',
      commissionRate: p.commissionRate,
      description: {
        uz: descUz,
        kr: descKr,
        ru: descRu,
      },
      sortOrder: String(p.sortOrder),
    });
  };

  const revenue = revenueQ.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Prime obuna" description="3 ta tildagi tariflar va obunalar boshqaruvi" />

      {revenue && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="flex items-start gap-3 p-4 bg-card border-border shadow-xs">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Umumiy daromad</p>
              <p className="mt-0.5 text-xl font-bold text-foreground">{fmt(String(revenue.totalRevenue))}</p>
              <p className="text-xs text-muted-foreground">Oxirgi 30 kun: {fmt(String(revenue.revenue30d))}</p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 p-4 bg-card border-border shadow-xs">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faol obunalar</p>
              <p className="mt-0.5 text-xl font-bold text-foreground">{revenue.activeSubscriptions}</p>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border shadow-xs">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <Star className="size-3.5 text-amber-500" /> Tarif bo&apos;yicha faol
            </p>
            <div className="mt-1.5 space-y-0.5">
              {revenue.byPlan.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                revenue.byPlan.map((p) => (
                  <p key={p.planId} className="flex justify-between text-xs">
                    <span className="text-foreground">{p.planName}</span>
                    <span className="font-semibold text-foreground">{p.activeCount} ta</span>
                  </p>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['plans', 'subs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'plans' ? 'Tariflar' : 'Faol obunalar'}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Form */}
          <div>
            <h3 className="mb-3 text-xs font-bold text-foreground">
              {editing ? 'Tarifni tahrirlash' : 'Yangi tarif qo\'shish'}
            </h3>
            <Card className="space-y-4 p-5 bg-card border-border shadow-xs rounded-xl">
              <I18nInput
                label="Tarif Nomi"
                required
                placeholder="Pro, Business, Start..."
                value={form.name}
                onChange={(val) => setForm((p) => ({ ...p, name: val }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Oylik narx (so&apos;m) *</label>
                  <Input
                    className="h-8.5 text-xs font-mono"
                    placeholder="50000"
                    value={form.monthlyPrice}
                    onChange={(e) => setForm((p) => ({ ...p, monthlyPrice: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Yillik narx (ixtiyoriy)</label>
                  <Input
                    className="h-8.5 text-xs font-mono"
                    placeholder="500000"
                    value={form.yearlyPrice}
                    onChange={(e) => setForm((p) => ({ ...p, yearlyPrice: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Komissiya (%) *</label>
                  <Input
                    className="h-8.5 text-xs font-mono"
                    placeholder="8"
                    value={form.commissionRate}
                    onChange={(e) => setForm((p) => ({ ...p, commissionRate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Tartib raqami</label>
                  <Input
                    type="number"
                    className="h-8.5 text-xs"
                    placeholder="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                  />
                </div>
              </div>

              <I18nInput
                label="Tarif Tavsifi (ixtiyoriy)"
                multiline
                rows={2}
                placeholder="Tarifning afzalliklari..."
                value={form.description}
                onChange={(val) => setForm((p) => ({ ...p, description: val }))}
              />

              {err && <p className="text-xs text-destructive font-medium">{err}</p>}

              <div className="flex gap-2 pt-2 border-t border-border justify-end">
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(null);
                      setForm(EMPTY_FORM);
                    }}>
                    Bekor qilish
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={!form.name.uz.trim() || !form.monthlyPrice || !form.commissionRate || save.isPending}
                  onClick={() => save.mutate()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  {save.isPending ? 'Saqlanmoqda…' : editing ? 'Yangilash' : 'Yaratish'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Plans List */}
          <div>
            <h3 className="mb-3 text-xs font-bold text-foreground">Mavjud tariflar</h3>
            <div className="space-y-3">
              {plansQ.isLoading && <p className="text-xs text-muted-foreground">Yuklanmoqda…</p>}
              {plansQ.data?.map((p) => (
                <Card key={p.id} className="p-4 bg-card border-border shadow-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{getLocalizedText(p.name, 'uz')}</span>
                        <button
                          type="button"
                          onClick={() => toggle.mutate(p)}
                          disabled={toggle.isPending}
                          title="Holatni o'zgartirish"
                        >
                          <Badge variant={p.isActive ? 'success' : 'neutral'} className="text-[0.65rem] cursor-pointer hover:opacity-80 transition-opacity">
                            {p.isActive ? 'Faol' : 'Nofaol'}
                          </Badge>
                        </button>
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5">{getLocalizedText(p.description, 'uz')}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(p)}>
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() => setPendingDelete(p)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span>Oylik: <strong className="text-foreground">{fmt(p.monthlyPrice)}</strong></span>
                    {p.yearlyPrice && <span>Yillik: <strong className="text-foreground">{fmt(p.yearlyPrice)}</strong></span>}
                    <span>Komissiya: <strong className="text-primary">{p.commissionRate}%</strong></span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {tab === 'subs' && (
        <Card className="p-4 bg-card border-border shadow-xs">
          <div className="divide-y divide-border">
            {subsQ.isLoading && <p className="py-4 text-center text-xs text-muted-foreground">Yuklanmoqda…</p>}
            {subsQ.data?.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Obunalar mavjud emas</p>}
            {subsQ.data?.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-semibold text-foreground">{s.seller?.name || s.seller?.phone || 'Seller'}</p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    Tarif: {getLocalizedText(s.plan?.name, 'uz')} · Komissiya: {s.commissionRateSnapshot}% · Muddat: {s.startDate} dan {s.endDate} gacha
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.isActive ? 'success' : 'neutral'} className="text-[0.65rem]">
                    {s.isActive ? 'Faol' : 'Tugagan'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[0.7rem] h-7"
                    onClick={() => setExtendingSub(s)}>
                    <CalendarPlus className="size-3 mr-1" /> Uzaytirish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Extend Modal */}
      {extendingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm space-y-4 p-5 bg-card border-border shadow-2xl rounded-xl">
            <h3 className="text-sm font-bold text-foreground">Obunani uzaytirish</h3>
            <p className="text-xs text-muted-foreground">
              {extendingSub.seller?.name || extendingSub.seller?.phone} uchun qo&apos;shimcha kunlar:
            </p>
            <Input
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              className="h-8.5 text-xs font-mono"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setExtendingSub(null)}>
                Bekor qilish
              </Button>
              <Button
                size="sm"
                disabled={!extendDaysValid || extend.isPending}
                onClick={() => extend.mutate()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {extend.isPending ? 'Uzaytirilmoqda…' : 'Uzaytirish'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Tarifni o'chirish"
        description={`"${getLocalizedText(pendingDelete?.name, 'uz')}" tarifini o'chirishni xohlaysizmi?`}
        confirmLabel="Ha, o'chirish"
        pending={del.isPending}
        onConfirm={() => pendingDelete && del.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Package, Pencil, Plus, Search } from 'lucide-react';
import { useReducer, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface GlobalProduct {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  groupName: string | null;
  defaultUnitType: string;
  defaultUnitSize: number;
  categoryId: string | null;
  photos: string[];
  isVerified: boolean;
  isActive: boolean;
  usageCount: number;
}

interface Stats {
  total: number;
  verified: number;
  active: number;
}

/* ─── Form ─── */
interface FormState {
  open: boolean;
  editing: GlobalProduct | null;
  barcode: string;
  name: string;
  brand: string;
  description: string;
  groupName: string;
  defaultUnitType: string;
  defaultUnitSize: string;
  isVerified: boolean;
  isActive: boolean;
}

const FORM_INIT: FormState = {
  open: false, editing: null, barcode: '', name: '', brand: '',
  description: '', groupName: '', defaultUnitType: 'piece', defaultUnitSize: '1',
  isVerified: false, isActive: true,
};

type FA =
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; p: GlobalProduct }
  | { type: 'CLOSE' }
  | { type: 'SET'; field: keyof Omit<FormState, 'open' | 'editing'>; value: string | boolean };

function formReducer(s: FormState, a: FA): FormState {
  switch (a.type) {
    case 'OPEN_CREATE': return { ...FORM_INIT, open: true };
    case 'OPEN_EDIT': return {
      open: true, editing: a.p, barcode: a.p.barcode ?? '',
      name: a.p.name, brand: a.p.brand ?? '', description: a.p.description ?? '',
      groupName: a.p.groupName ?? '', defaultUnitType: a.p.defaultUnitType,
      defaultUnitSize: String(a.p.defaultUnitSize),
      isVerified: a.p.isVerified, isActive: a.p.isActive,
    };
    case 'CLOSE': return FORM_INIT;
    case 'SET': return { ...s, [a.field]: a.value };
    default: return s;
  }
}

const UNIT_TYPES = ['piece', 'kg', 'liter', 'gram', 'pack'];
const UNIT_LABELS: Record<string, string> = { piece: 'dona', kg: 'kg', liter: 'litr', gram: 'g', pack: 'paket' };

export default function CatalogPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, dispatch] = useReducer(formReducer, FORM_INIT);
  const [formError, setFormError] = useState('');

  const catalogQuery = useQuery<GlobalProduct[]>({
    queryKey: ['admin', 'catalog', search],
    queryFn: async () => (await api.get('/admin/catalog', { params: { q: search || undefined, limit: 100 } })).data,
    staleTime: 60_000,
  });

  const statsQuery = useQuery<Stats>({
    queryKey: ['admin', 'catalog-stats'],
    queryFn: async () => (await api.get('/admin/catalog/stats')).data,
    staleTime: 5 * 60_000,
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        barcode: form.barcode || null,
        name: form.name,
        brand: form.brand || null,
        description: form.description || null,
        groupName: form.groupName || null,
        defaultUnitType: form.defaultUnitType,
        defaultUnitSize: parseFloat(form.defaultUnitSize) || 1,
        isVerified: form.isVerified,
        isActive: form.isActive,
      };
      if (form.editing) {
        await api.patch(`/admin/catalog/${form.editing.id}`, payload);
      } else {
        await api.post('/admin/catalog', payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'catalog'] });
      qc.invalidateQueries({ queryKey: ['admin', 'catalog-stats'] });
      dispatch({ type: 'CLOSE' });
    },
    onError: (e) => setFormError(extractErrorMessage(e)),
  });

  const products = catalogQuery.data ?? [];
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Katalog"
        description="Barcha do'konlar uchun umumiy mahsulot bazasi"
        action={<Button onClick={() => dispatch({ type: 'OPEN_CREATE' })}><Plus className="w-4 h-4 mr-2" />Mahsulot qo'shish</Button>}
      />

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Jami mahsulot" value={stats.total} />
          <StatCard label="Tasdiqlangan" value={stats.verified} />
          <StatCard label="Aktiv" value={stats.active} />
        </div>
      )}

      <Card>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Qidirish (nom, barkod, brend)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {catalogQuery.isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Package className="w-8 h-8" />
            <p>{search ? 'Topilmadi' : "Hali mahsulot yo'q"}</p>
          </div>
        ) : (
          <div className="divide-y">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {p.photos[0] ? (
                    <img src={p.photos[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{p.name}</span>
                    {p.isVerified && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                    {!p.isActive && <Badge variant="secondary">Nofaol</Badge>}
                  </div>
                  {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                  <p className="text-xs text-muted-foreground">
                    {p.defaultUnitSize} {UNIT_LABELS[p.defaultUnitType] ?? p.defaultUnitType}
                    {p.barcode ? ` · ${p.barcode}` : ''}
                    {p.groupName ? ` · ${p.groupName}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{p.usageCount} do'kon</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'OPEN_EDIT', p })}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {form.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold">
                {form.editing ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"}
              </h2>

              <Field label="Nomi *">
                <Input value={form.name} onChange={(e) => dispatch({ type: 'SET', field: 'name', value: e.target.value })} placeholder="Coca-Cola" />
              </Field>
              <Field label="Brend">
                <Input value={form.brand} onChange={(e) => dispatch({ type: 'SET', field: 'brand', value: e.target.value })} placeholder="Coca-Cola Company" />
              </Field>
              <Field label="Barkod">
                <Input value={form.barcode} onChange={(e) => dispatch({ type: 'SET', field: 'barcode', value: e.target.value })} placeholder="5449000000996" />
              </Field>
              <Field label="Guruh nomi">
                <Input value={form.groupName} onChange={(e) => dispatch({ type: 'SET', field: 'groupName', value: e.target.value })} placeholder="Gazli ichimliklar" />
              </Field>
              <Field label="Tavsif">
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm resize-none h-20"
                  value={form.description}
                  onChange={(e) => dispatch({ type: 'SET', field: 'description', value: e.target.value })}
                  placeholder="Qisqacha tavsif..."
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Birlik turi">
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.defaultUnitType}
                    onChange={(e) => dispatch({ type: 'SET', field: 'defaultUnitType', value: e.target.value })}>
                    {UNIT_TYPES.map((t) => <option key={t} value={t}>{UNIT_LABELS[t]}</option>)}
                  </select>
                </Field>
                <Field label="Miqdor">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.defaultUnitSize}
                    onChange={(e) => dispatch({ type: 'SET', field: 'defaultUnitSize', value: e.target.value })}
                  />
                </Field>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => dispatch({ type: 'SET', field: 'isVerified', value: e.target.checked })}
                  />
                  Tasdiqlangan
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => dispatch({ type: 'SET', field: 'isActive', value: e.target.checked })}
                  />
                  Aktiv
                </label>
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => dispatch({ type: 'CLOSE' })}>Bekor</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
                  {save.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

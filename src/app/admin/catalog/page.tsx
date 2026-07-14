'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, ChevronLeft, ChevronRight, Download, Eye, Package, Pencil, Plus, Search, Store, Upload, X } from 'lucide-react';
import { useReducer, useState } from 'react';

import { CatalogImportModal } from '@/components/admin/catalog-import-modal';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';
import { useEscapeKey } from '@/lib/use-escape-key';
import { toast } from '@/stores/toast';

interface CatalogUsageRow {
  variantId: string;
  shopId: string;
  shopName: string;
  price: number;
  discountPrice: number | null;
  stock: number;
}

function UsageModal({ product, onClose }: { product: GlobalProduct; onClose: () => void }) {
  useEscapeKey(true, onClose);
  const usageQ = useQuery<CatalogUsageRow[]>({
    queryKey: ['admin', 'catalog', 'usage', product.id],
    queryFn: async () => (await api.get(`/admin/catalog/${product.id}/usage`)).data,
  });
  const rows = usageQ.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{product.name}</h2>
            <p className="text-xs text-muted-foreground">Bu mahsulotni sotayotgan do&apos;konlar</p>
          </div>
          <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        {usageQ.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Yuklanmoqda…</p>
        ) : usageQ.isError ? (
          <p className="mt-4 text-sm text-destructive">
            {extractErrorMessage(usageQ.error)} —{' '}
            <button className="underline" onClick={() => usageQ.refetch()}>qayta urinish</button>
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Hech qaysi do&apos;kon bu mahsulotni sotmayapti.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {rows.map((r) => (
              <div key={r.variantId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Store className="size-3.5 shrink-0 text-muted-foreground" />
                  {r.shopName}
                </span>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-foreground">
                    {r.discountPrice ? (
                      <>
                        <span className="text-destructive">{r.discountPrice.toLocaleString()}</span>{' '}
                        <span className="text-xs text-muted-foreground line-through">{r.price.toLocaleString()}</span>
                      </>
                    ) : (
                      r.price.toLocaleString()
                    )}
                    {" so'm"}
                  </p>
                  <p className="text-xs text-muted-foreground">Qoldiq: {r.stock}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

interface GlobalProduct {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  parentGlobalProductId: string | null;
  unitType: string;
  unitSize: number;
  categoryId: string | null;
  photos: string[];
  isVerified: boolean;
  isActive: boolean;
  usageCount: number;
}

interface Category {
  id: string;
  slug: string;
  nameUzLatn: string;
  children?: Category[];
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
  parentGlobalProductId: string;
  unitType: string;
  unitSize: string;
  categoryId: string;
  isVerified: boolean;
  isActive: boolean;
}

const FORM_INIT: FormState = {
  open: false, editing: null, barcode: '', name: '', brand: '',
  description: '', parentGlobalProductId: '', unitType: 'piece', unitSize: '1',
  categoryId: '', isVerified: false, isActive: true,
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
      parentGlobalProductId: a.p.parentGlobalProductId ?? '',
      unitType: a.p.unitType, unitSize: String(a.p.unitSize),
      categoryId: a.p.categoryId ?? '',
      isVerified: a.p.isVerified, isActive: a.p.isActive,
    };
    case 'CLOSE': return FORM_INIT;
    case 'SET': return { ...s, [a.field]: a.value };
    default: return s;
  }
}

const UNIT_TYPES = ['piece', 'kg', 'liter', 'gram', 'pack'];
const UNIT_LABELS: Record<string, string> = { piece: 'dona', kg: 'kg', liter: 'litr', gram: 'g', pack: 'paket' };
const PAGE_SIZE = 50;

export default function CatalogPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [page, setPage] = useState(0);
  const [form, dispatch] = useReducer(formReducer, FORM_INIT);
  useEscapeKey(form.open, () => dispatch({ type: 'CLOSE' }));
  const [formError, setFormError] = useState('');
  const [verifyErr, setVerifyErr] = useState('');
  const [usageProduct, setUsageProduct] = useState<GlobalProduct | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportErr, setExportErr] = useState('');
  const exportXlsx = useMutation({
    mutationFn: () =>
      downloadFile('/admin/catalog/export', 'katalog.xlsx', {
        q: search || undefined,
        categoryId: filterCat || undefined,
      }),
    onError: (e) => setExportErr(extractErrorMessage(e)),
  });

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ['admin', 'categories', 'active'],
    queryFn: async () => (await api.get('/categories')).data,
    staleTime: 5 * 60_000,
  });

  const leafCats = (categoriesQuery.data ?? []).flatMap((r) =>
    r.children?.length ? r.children : [r],
  );

  const catalogQuery = useQuery<{ items: GlobalProduct[]; total: number }>({
    queryKey: ['admin', 'catalog', search, page, filterCat],
    queryFn: async () =>
      (await api.get('/admin/catalog', {
        params: {
          q: search || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          categoryId: filterCat || undefined,
        },
      })).data,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
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
        parentGlobalProductId: form.parentGlobalProductId || null,
        unitType: form.unitType,
        unitSize: parseFloat(form.unitSize) || 1,
        categoryId: form.categoryId || null,
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
      setFormError('');
      toast.success('Mahsulot saqlandi');
    },
    onError: (e) => setFormError(extractErrorMessage(e)),
  });

  const toggleVerify = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      await api.patch(`/admin/catalog/${id}`, { isVerified });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'catalog'] });
      qc.invalidateQueries({ queryKey: ['admin', 'catalog-stats'] });
      setVerifyErr('');
    },
    onError: (e) => setVerifyErr(extractErrorMessage(e)),
  });

  const items = catalogQuery.data?.items ?? [];
  const total = catalogQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Katalog"
        description="Barcha do'konlar uchun umumiy mahsulot bazasi"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" disabled={exportXlsx.isPending} onClick={() => { setExportErr(''); exportXlsx.mutate(); }}>
              <Download className="w-4 h-4 mr-2" />{exportXlsx.isPending ? 'Yuklanmoqda…' : 'Eksport'}
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />Ommaviy import
            </Button>
            <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
              <Plus className="w-4 h-4 mr-2" />Mahsulot qo'shish
            </Button>
          </div>
        }
      />
      {exportErr && (
        <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{exportErr}</p>
      )}

      {verifyErr && (
        <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{verifyErr}</p>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Jami mahsulot" value={stats.total} />
          <StatCard label="Tasdiqlangan" value={stats.verified} />
          <StatCard label="Aktiv" value={stats.active} />
        </div>
      )}

      <Card>
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Qidirish (nom, barkod, brend)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          {leafCats.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${!filterCat ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                onClick={() => { setFilterCat(''); setPage(0); }}>
                Barchasi
              </button>
              {leafCats.map((c) => (
                <button
                  key={c.id}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterCat === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                  onClick={() => { setFilterCat(c.id); setPage(0); }}>
                  {c.nameUzLatn}
                </button>
              ))}
            </div>
          )}
        </div>

        {catalogQuery.isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Package className="w-8 h-8" />
            <p>{search ? 'Topilmadi' : "Hali mahsulot yo'q"}</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {items.map((p) => (
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
                      {!p.isActive && <Badge variant="neutral">Nofaol</Badge>}
                    </div>
                    {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                    <p className="text-xs text-muted-foreground">
                      {p.unitSize} {UNIT_LABELS[p.unitType] ?? p.unitType}
                      {p.barcode ? ` · ${p.barcode}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <button
                      title="Do'konlar bo'yicha ko'rish"
                      onClick={() => setUsageProduct(p)}
                      className="flex items-center gap-1 text-xs text-muted-foreground rounded px-1.5 py-1 hover:bg-muted transition-colors">
                      <Eye className="w-3.5 h-3.5" /> {p.usageCount} do&apos;kon
                    </button>
                    <button
                      title={p.isVerified ? 'Tasdiqlandi — bekor qilish' : 'Tasdiqlash'}
                      onClick={() => toggleVerify.mutate({ id: p.id, isVerified: !p.isVerified })}
                      className="p-1 rounded hover:bg-muted transition-colors">
                      <BadgeCheck
                        className={`w-5 h-5 ${p.isVerified ? 'text-green-600' : 'text-muted-foreground'}`}
                      />
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'OPEN_EDIT', p })}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
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
                <Input
                  value={form.name}
                  onChange={(e) => dispatch({ type: 'SET', field: 'name', value: e.target.value })}
                  placeholder="Coca-Cola"
                />
              </Field>
              <Field label="Brend">
                <Input
                  value={form.brand}
                  onChange={(e) => dispatch({ type: 'SET', field: 'brand', value: e.target.value })}
                  placeholder="Coca-Cola Company"
                />
              </Field>
              <Field label="Barkod">
                <Input
                  value={form.barcode}
                  onChange={(e) => dispatch({ type: 'SET', field: 'barcode', value: e.target.value })}
                  placeholder="5449000000996"
                />
              </Field>
              <Field label="Kategoriya">
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.categoryId}
                  onChange={(e) => dispatch({ type: 'SET', field: 'categoryId', value: e.target.value })}>
                  <option value="">— tanlang —</option>
                  {leafCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameUzLatn}</option>
                  ))}
                </select>
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
                    value={form.unitType}
                    onChange={(e) => dispatch({ type: 'SET', field: 'unitType', value: e.target.value })}>
                    {UNIT_TYPES.map((t) => <option key={t} value={t}>{UNIT_LABELS[t]}</option>)}
                  </select>
                </Field>
                <Field label="Miqdor">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.unitSize}
                    onChange={(e) => dispatch({ type: 'SET', field: 'unitSize', value: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="O'lcham guruh (parentGlobalProductId)">
                <Input
                  value={form.parentGlobalProductId}
                  onChange={(e) => dispatch({ type: 'SET', field: 'parentGlobalProductId', value: e.target.value })}
                  placeholder="Ota-mahsulot UUID (ixtiyoriy)"
                />
              </Field>
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
                <Button variant="outline" onClick={() => { dispatch({ type: 'CLOSE' }); setFormError(''); }}>
                  Bekor
                </Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
                  {save.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {usageProduct && <UsageModal product={usageProduct} onClose={() => setUsageProduct(null)} />}
      {importOpen && <CatalogImportModal onClose={() => setImportOpen(false)} />}
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

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FolderPlus,
  Globe,
  Pencil,
  Plus,
  Search,
  Store,
  Upload,
  X,
} from 'lucide-react';
import { useReducer, useState } from 'react';

import { CatalogImportModal } from '@/components/admin/catalog-import-modal';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { I18nInput, I18nValue } from '@/components/ui/i18n-input';
import { SearchSelect, SearchSelectOption } from '@/components/ui/search-select';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';
import { latinToCyrillic, getLocalizedText } from '@/lib/transliteration';
import { slugify } from '@/lib/slug';
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
    queryKey: ['admin', 'catalog-usage', product.id],
    queryFn: async () => (await api.get(`/admin/catalog/${product.id}/usage`)).data,
  });
  const rows = usageQ.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto p-6 bg-card border-border shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">{product.nameUzLatn || getLocalizedText(product.name, 'uz')}</h2>
            <p className="text-xs text-muted-foreground">Bu mahsulotni sotayotgan do&apos;konlar</p>
          </div>
          <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        {usageQ.isLoading ? (
          <p className="mt-4 text-xs text-muted-foreground">Yuklanmoqda…</p>
        ) : usageQ.isError ? (
          <p className="mt-4 text-xs text-destructive">
            {extractErrorMessage(usageQ.error)} —{' '}
            <button className="underline" onClick={() => usageQ.refetch()}>qayta urinish</button>
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">Hech qaysi do&apos;kon bu mahsulotni sotmayapti.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {rows.map((r) => (
              <div key={r.variantId} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Store className="size-3.5 shrink-0 text-muted-foreground" />
                  {r.shopName}
                </span>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-foreground">
                    {r.discountPrice ? (
                      <>
                        <span className="text-destructive font-semibold">{r.discountPrice.toLocaleString()}</span>{' '}
                        <span className="text-[0.65rem] text-muted-foreground line-through">{r.price.toLocaleString()}</span>
                      </>
                    ) : (
                      r.price.toLocaleString()
                    )}
                    {" so'm"}
                  </p>
                  <p className="text-[0.65rem] text-muted-foreground">Qoldiq: {r.stock}</p>
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
  slug?: string;
  barcode: string | null;
  name: string | { uz?: string; kr?: string; ru?: string };
  nameUzLatn?: string;
  nameUzCyrl?: string;
  nameRu?: string;
  brand: string | null;
  description: string | { uz?: string; kr?: string; ru?: string } | null;
  descriptionUzLatn?: string | null;
  descriptionUzCyrl?: string | null;
  descriptionRu?: string | null;
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
  name?: string | { uz?: string; kr?: string; ru?: string };
  nameUzLatn: string;
  nameUzCyrl: string;
  nameRu: string;
  children?: Category[];
}

const UNIT_OPTIONS: SearchSelectOption[] = [
  { value: 'piece', label: 'dona', sublabel: 'shtuk (шт)' },
  { value: 'kg', label: 'kg', sublabel: 'kilogramm (кг)' },
  { value: 'gram', label: 'gramm', sublabel: 'gramm (г)' },
  { value: 'liter', label: 'litr', sublabel: 'litr (л)' },
  { value: 'pack', label: 'quti / pachka', sublabel: 'korobka (пачка)' },
  { value: 'block', label: 'blok', sublabel: 'blok (блок)' },
  { value: 'meter', label: 'metr', sublabel: 'metr (м)' },
];

const UNIT_LABELS: Record<string, string> = {
  piece: 'dona',
  kg: 'kg',
  liter: 'litr',
  gram: 'g',
  pack: 'quti',
  block: 'blok',
  meter: 'm',
};

interface FormState {
  open: boolean;
  editing: GlobalProduct | null;
  slug: string;
  slugEdited: boolean;
  nameUzLatn: string;
  nameUzCyrl: string;
  nameRu: string;
  descriptionUzLatn: string;
  descriptionUzCyrl: string;
  descriptionRu: string;
  barcode: string;
  brand: string;
  categoryId: string | null;
  unitType: string;
  unitSize: string;
  parentGlobalProductId: string | null;
  isVerified: boolean;
  isActive: boolean;
}

type FormAction =
  | { type: 'OPEN_NEW' }
  | { type: 'OPEN_EDIT'; p: GlobalProduct }
  | { type: 'CLOSE' }
  | { type: 'SET'; field: keyof Omit<FormState, 'open' | 'editing'>; value: unknown };

const FORM_INIT: FormState = {
  open: false,
  editing: null,
  slug: '',
  slugEdited: false,
  nameUzLatn: '',
  nameUzCyrl: '',
  nameRu: '',
  descriptionUzLatn: '',
  descriptionUzCyrl: '',
  descriptionRu: '',
  barcode: '',
  brand: '',
  categoryId: null,
  unitType: 'piece',
  unitSize: '1',
  parentGlobalProductId: null,
  isVerified: true,
  isActive: true,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'OPEN_NEW':
      return { ...FORM_INIT, open: true };
    case 'OPEN_EDIT': {
      const nameUz = action.p.nameUzLatn || getLocalizedText(action.p.name, 'uz');
      const nameKr = action.p.nameUzCyrl || getLocalizedText(action.p.name, 'kr') || latinToCyrillic(nameUz);
      const nameRu = action.p.nameRu || getLocalizedText(action.p.name, 'ru') || '';
      const descUz = action.p.descriptionUzLatn || getLocalizedText(action.p.description, 'uz');
      const descKr = action.p.descriptionUzCyrl || getLocalizedText(action.p.description, 'kr');
      const descRu = action.p.descriptionRu || getLocalizedText(action.p.description, 'ru');
      return {
        open: true,
        editing: action.p,
        slug: action.p.slug || slugify(nameUz),
        slugEdited: !!action.p.slug,
        nameUzLatn: nameUz,
        nameUzCyrl: nameKr,
        nameRu: nameRu,
        descriptionUzLatn: descUz,
        descriptionUzCyrl: descKr,
        descriptionRu: descRu,
        barcode: action.p.barcode ?? '',
        brand: action.p.brand ?? '',
        categoryId: action.p.categoryId,
        unitType: action.p.unitType,
        unitSize: String(action.p.unitSize),
        parentGlobalProductId: action.p.parentGlobalProductId,
        isVerified: action.p.isVerified,
        isActive: action.p.isActive,
      };
    }
    case 'CLOSE':
      return FORM_INIT;
    case 'SET':
      return { ...state, [action.field]: action.value };
  }
}

const PAGE_SIZE = 50;

export default function CatalogPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [form, dispatch] = useReducer(formReducer, FORM_INIT);
  const [formError, setFormError] = useState('');
  const [usageProduct, setUsageProduct] = useState<GlobalProduct | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Quick Category creation modal state
  const [quickCatOpen, setQuickCatOpen] = useState(false);
  const [quickCatName, setQuickCatName] = useState<I18nValue>({ uz: '', kr: '', ru: '' });

  useEscapeKey(form.open, () => dispatch({ type: 'CLOSE' }));

  const stats = useQuery<{ total: number; verified: number; active: number }>({
    queryKey: ['admin', 'catalog', 'stats'],
    queryFn: async () => (await api.get('/admin/catalog/stats')).data,
  });

  const list = useQuery<{ items: GlobalProduct[]; total: number }>({
    queryKey: ['admin', 'catalog', { page, q, activeOnly, selectedCatId }],
    queryFn: async () => {
      const p = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (q.trim()) p.set('q', q.trim());
      if (activeOnly) p.set('activeOnly', 'true');
      if (selectedCatId) p.set('categoryId', selectedCatId);
      return (await api.get(`/admin/catalog?${p.toString()}`)).data;
    },
  });

  const categories = useQuery<Category[]>({
    queryKey: ['admin', 'categories', 'all'],
    queryFn: async () => (await api.get('/categories/admin/all')).data,
  });

  // Flatten leaf categories for search
  const flattenLeaves = (cats: Category[]): Category[] =>
    cats.flatMap((c) => (c.children && c.children.length > 0 ? flattenLeaves(c.children) : [c]));
  const leafCats = categories.data ? flattenLeaves(categories.data) : [];

  const categoryOptions: SearchSelectOption[] = leafCats.map((c) => ({
    value: c.id,
    label: c.nameUzLatn || getLocalizedText(c.name, 'uz'),
    sublabel: c.nameRu || c.nameUzCyrl || getLocalizedText(c.name, 'ru'),
  }));

  // Parent products options for size group
  const parentProductOptions: SearchSelectOption[] = (list.data?.items ?? [])
    .filter((p) => !form.editing || p.id !== form.editing.id)
    .map((p) => ({
      value: p.id,
      label: p.nameUzLatn || getLocalizedText(p.name, 'uz'),
      sublabel: p.barcode ? `Barkod: ${p.barcode}` : p.brand || undefined,
      badge: `${p.unitSize} ${UNIT_LABELS[p.unitType] ?? p.unitType}`,
    }));

  // Quick category creation mutation
  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const slug = (quickCatName.uz || quickCatName.ru || 'cat')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const res = await api.post('/categories', {
        nameUzLatn: quickCatName.uz,
        nameUzCyrl: quickCatName.kr || latinToCyrillic(quickCatName.uz),
        nameRu: quickCatName.ru || quickCatName.uz,
        slug: `${slug}-${Date.now().toString(36)}`,
        sortOrder: 0,
      });
      return res.data;
    },
    onSuccess: (newCat) => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      dispatch({ type: 'SET', field: 'categoryId', value: newCat.id });
      setQuickCatOpen(false);
      setQuickCatName({ uz: '', kr: '', ru: '' });
      toast.success('Yangi kategoriya qo\'shildi va tanlandi');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const toggleVerify = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      await api.patch(`/admin/catalog/${id}`, { isVerified });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'catalog'] });
      toast.success('Holat yangilandi');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const save = useMutation({
    mutationFn: async () => {
      const nameUzLatn = form.nameUzLatn.trim();
      const payload = {
        name: nameUzLatn,
        nameUzLatn,
        nameUzCyrl: form.nameUzCyrl.trim() || latinToCyrillic(nameUzLatn),
        nameRu: form.nameRu.trim() || nameUzLatn,
        slug: form.slug.trim() || undefined,
        description: form.descriptionUzLatn.trim() || undefined,
        descriptionUzLatn: form.descriptionUzLatn.trim() || undefined,
        descriptionUzCyrl: form.descriptionUzCyrl.trim() || undefined,
        descriptionRu: form.descriptionRu.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        brand: form.brand.trim() || undefined,
        categoryId: form.categoryId || undefined,
        unitType: form.unitType,
        unitSize: Number(form.unitSize) || 1,
        parentGlobalProductId: form.parentGlobalProductId || null,
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
      dispatch({ type: 'CLOSE' });
      setFormError('');
      toast.success(form.editing ? 'Mahsulot yangilandi' : 'Yangi mahsulot yaratildi');
    },
    onError: (e) => setFormError(extractErrorMessage(e)),
  });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Katalog"
        description="Barcha do'konlar uchun umumiy mahsulotlar bazasi va ko'p tilli nomlar"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const p = new URLSearchParams();
                if (q.trim()) p.set('q', q.trim());
                if (activeOnly) p.set('activeOnly', 'true');
                if (selectedCatId) p.set('categoryId', selectedCatId);
                downloadFile(`/admin/catalog/export?${p.toString()}`, 'katalog.xlsx');
              }}
              className="text-xs h-9">
              <Download className="w-4 h-4 mr-1.5" /> Eksport
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="text-xs h-9">
              <Upload className="w-4 h-4 mr-1.5" /> Ommaviy import
            </Button>
            <Button
              size="sm"
              onClick={() => {
                dispatch({ type: 'OPEN_NEW' });
                setFormError('');
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 font-semibold">
              <Plus className="w-4 h-4 mr-1.5" /> Mahsulot qo&apos;shish
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Jami mahsulot" value={stats.data?.total ?? 0} />
        <StatCard label="Tasdiqlangan" value={stats.data?.verified ?? 0} />
        <StatCard label="Aktiv" value={stats.data?.active ?? 0} />
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-3 bg-card border-border shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-xs"
              placeholder="Qidirish (nomi lotin/kirill/rus, barkod, brend)…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div className="w-full sm:w-64">
            <SearchSelect
              options={categoryOptions}
              value={selectedCatId}
              onChange={(val) => {
                setSelectedCatId(val);
                setPage(0);
              }}
              placeholder="Barcha kategoriyalar"
              searchPlaceholder="Kategoriya qidirish…"
            />
          </div>

          <Button
            variant={activeOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveOnly((v) => !v);
              setPage(0);
            }}
            className={activeOnly ? 'bg-primary text-xs h-9' : 'text-xs h-9'}>
            Faqat aktivlar
          </Button>
        </div>
      </Card>

      {/* Product List */}
      <Card className="bg-card border-border shadow-xs overflow-hidden">
        {list.isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Yuklanmoqda…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Mahsulot topilmadi</div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {items.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {p.nameUzLatn || getLocalizedText(p.name, 'uz')}
                      </p>
                      {(p.nameRu || getLocalizedText(p.name, 'ru')) &&
                        (p.nameRu || getLocalizedText(p.name, 'ru')) !== (p.nameUzLatn || getLocalizedText(p.name, 'uz')) && (
                          <span className="text-[0.7rem] text-muted-foreground font-normal">
                            ({p.nameRu || getLocalizedText(p.name, 'ru')})
                          </span>
                        )}
                      {p.isVerified && (
                        <Badge variant="success" className="gap-1 text-[0.65rem]">
                          <BadgeCheck className="w-3 h-3" /> Tasdiqlangan
                        </Badge>
                      )}
                      {!p.isActive && <Badge variant="neutral" className="text-[0.65rem]">Nofaol</Badge>}
                    </div>
                    {p.brand && <p className="text-xs text-muted-foreground font-medium">{p.brand}</p>}
                    <p className="text-[0.7rem] text-muted-foreground">
                      {p.unitSize} {UNIT_LABELS[p.unitType] ?? p.unitType}
                      {p.barcode ? ` · Barkod: ${p.barcode}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    {p.slug && (
                      <a
                        href={`/product/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Veb-saytdagi sahifani ochish"
                        className="flex items-center gap-1 text-[0.7rem] text-muted-foreground hover:text-primary rounded px-1.5 py-1 hover:bg-muted transition-colors">
                        <Globe className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">SEO sahifa</span>
                      </a>
                    )}
                    <button
                      title="Do'konlar bo'yicha ko'rish"
                      onClick={() => setUsageProduct(p)}
                      className="flex items-center gap-1 text-xs text-muted-foreground rounded px-2 py-1 hover:bg-muted transition-colors">
                      <Eye className="w-3.5 h-3.5" /> {p.usageCount} do&apos;kon
                    </button>
                    <button
                      title={p.isVerified ? 'Tasdiqlandi — bekor qilish' : 'Tasdiqlash'}
                      onClick={() => toggleVerify.mutate({ id: p.id, isVerified: !p.isVerified })}
                      className="p-1 rounded hover:bg-muted transition-colors">
                      <BadgeCheck
                        className={`w-5 h-5 ${p.isVerified ? 'text-emerald-500' : 'text-muted-foreground'}`}
                      />
                    </button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => dispatch({ type: 'OPEN_EDIT', p })}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      {form.open && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-card border-border shadow-2xl rounded-xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {form.editing ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    3 ta tilda nomlar, avtomatik Kirill transliteratsiyasi va bog&apos;lanishlar
                  </p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'CLOSE' })}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                  <X className="size-4" />
                </button>
              </div>

              {/* 3-Language Product Name (I18nInput) */}
              <I18nInput
                label="Mahsulot Nomi"
                required
                placeholder="Masalan: Coca-Cola 1L"
                value={{
                  uz: form.nameUzLatn,
                  kr: form.nameUzCyrl,
                  ru: form.nameRu,
                }}
                onChange={(val) => {
                  dispatch({ type: 'SET', field: 'nameUzLatn', value: val.uz });
                  dispatch({ type: 'SET', field: 'nameUzCyrl', value: val.kr });
                  dispatch({ type: 'SET', field: 'nameRu', value: val.ru });
                  if (!form.slugEdited) {
                    dispatch({ type: 'SET', field: 'slug', value: slugify(val.uz) });
                  }
                }}
              />

              {/* SEO Friendly URL / Slug */}
              <div className="space-y-1 rounded-xl border border-border/80 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="size-3.5 text-primary" /> SEO URL (Slug)
                  </label>
                  <span className="text-[0.65rem] text-muted-foreground font-mono">
                    https://yaqin-market.uz/product/{form.slug || 'nomi'}
                  </span>
                </div>
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    dispatch({ type: 'SET', field: 'slugEdited', value: true });
                    dispatch({ type: 'SET', field: 'slug', value: slugify(e.target.value) });
                  }}
                  placeholder="masalan: coca-cola-1-5l"
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[0.65rem] text-muted-foreground">
                  Google va Yandex qidiruvida chiqish uchun toza lotin harflari va defislardan iborat manzil.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Brend">
                  <Input
                    value={form.brand}
                    onChange={(e) => dispatch({ type: 'SET', field: 'brand', value: e.target.value })}
                    placeholder="Coca-Cola Company"
                    className="h-8.5 text-xs"
                  />
                </Field>
                <Field label="Barkod">
                  <Input
                    value={form.barcode}
                    onChange={(e) => dispatch({ type: 'SET', field: 'barcode', value: e.target.value })}
                    placeholder="5449000000996"
                    className="h-8.5 text-xs font-mono"
                  />
                </Field>
              </div>

              {/* Category Search-Select with Quick Create */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Kategoriya</label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCatName({ uz: '', kr: '', ru: '' });
                      setQuickCatOpen(true);
                    }}
                    className="text-[0.65rem] text-primary hover:underline font-semibold flex items-center gap-1">
                    <FolderPlus className="size-3" /> + Yangi kategoriya ochish
                  </button>
                </div>
                <SearchSelect
                  options={categoryOptions}
                  value={form.categoryId}
                  onChange={(val) => dispatch({ type: 'SET', field: 'categoryId', value: val })}
                  placeholder="Kategoriyani tanlang yoki qidiring…"
                  searchPlaceholder="Kategoriya nomi bo'yicha qidirish…"
                  onCreateNew={(query) => {
                    setQuickCatName({ uz: query, kr: latinToCyrillic(query), ru: '' });
                    setQuickCatOpen(true);
                  }}
                  createNewLabel="Yangi kategoriya yaratish"
                />
              </div>

              {/* 3-Language Description (I18nInput multiline) */}
              <I18nInput
                label="Mahsulot Tavsifi (ixtiyoriy)"
                multiline
                rows={2}
                placeholder="Mahsulot haqida qisqacha ma'lumot…"
                value={{
                  uz: form.descriptionUzLatn,
                  kr: form.descriptionUzCyrl,
                  ru: form.descriptionRu,
                }}
                onChange={(val) => {
                  dispatch({ type: 'SET', field: 'descriptionUzLatn', value: val.uz });
                  dispatch({ type: 'SET', field: 'descriptionUzCyrl', value: val.kr });
                  dispatch({ type: 'SET', field: 'descriptionRu', value: val.ru });
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Birlik turi</label>
                  <SearchSelect
                    options={UNIT_OPTIONS}
                    value={form.unitType}
                    onChange={(val) => dispatch({ type: 'SET', field: 'unitType', value: val || 'piece' })}
                    placeholder="Birlikni tanlang…"
                    allowClear={false}
                  />
                </div>
                <Field label="Miqdor / Hajm">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.unitSize}
                    onChange={(e) => dispatch({ type: 'SET', field: 'unitSize', value: e.target.value })}
                    className="h-8.5 text-xs"
                  />
                </Field>
              </div>

              {/* Parent Product / Size Group Search-Select (Replaced UUID input!) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    O&apos;lcham guruhi (Ota-mahsulot)
                  </label>
                  <span className="text-[0.65rem] text-muted-foreground">
                    Agar boshqa hajm varianti bo&apos;lsa
                  </span>
                </div>
                <SearchSelect
                  options={parentProductOptions}
                  value={form.parentGlobalProductId}
                  onChange={(val) => dispatch({ type: 'SET', field: 'parentGlobalProductId', value: val })}
                  placeholder="Ota-mahsulotni qidiring (masalan: Coca-Cola 1L)…"
                  searchPlaceholder="Nomi yoki barkod bo'yicha qidirish…"
                  emptyText="Mahsulot topilmadi"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => dispatch({ type: 'SET', field: 'isVerified', value: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  Tasdiqlangan (Katalogda ishonchli ko&apos;rinadi)
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => dispatch({ type: 'SET', field: 'isActive', value: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  Aktiv
                </label>
              </div>

              {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}

              <div className="flex gap-2 justify-end pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: 'CLOSE' });
                    setFormError('');
                  }}>
                  Bekor qilish
                </Button>
                <Button
                  size="sm"
                  onClick={() => save.mutate()}
                  disabled={save.isPending || !form.nameUzLatn.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* QUICK CREATE CATEGORY MODAL */}
      {quickCatOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-5 bg-card border-border shadow-2xl rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FolderPlus className="size-4 text-primary" />
                <span>Yangi Kategoriya Yaratish</span>
              </h3>
              <button onClick={() => setQuickCatOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <I18nInput
              label="Kategoriya Nomi"
              required
              placeholder="Masalan: Gazli ichimliklar"
              value={quickCatName}
              onChange={setQuickCatName}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickCatOpen(false)}
                disabled={createCategoryMutation.isPending}>
                Bekor qilish
              </Button>
              <Button
                size="sm"
                onClick={() => createCategoryMutation.mutate()}
                disabled={!quickCatName.uz.trim() || createCategoryMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {createCategoryMutation.isPending ? 'Yaratilmoqda…' : 'Yaratish va tanlash'}
              </Button>
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
    <Card className="p-4 bg-card border-border shadow-xs">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

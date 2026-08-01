'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Pencil, Plus, RefreshCw, ReceiptText, Sparkles, Tags, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useState } from 'react';

import { PageHeader, StatPill } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useEscapeKey } from '@/lib/use-escape-key';
import { toast } from '@/stores/toast';

/* ─── DTO ─── */

interface FiscalReceiptLine {
  orderItemId: string;
  productName: string;
  mxikCode: string | null;
  packageCode: string | null;
  markingRequired: boolean;
  markingCodes: string[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vatRate: number;
  vatAmount: number;
}

interface FiscalReceipt {
  id: string;
  orderId: string;
  type: 'sale' | 'refund';
  status: 'incomplete' | 'pending' | 'sent' | 'confirmed' | 'failed';
  sellerStir: string | null;
  sellerName: string | null;
  sellerVatPayer: boolean;
  lines: FiscalReceiptLine[];
  totalAmount: number;
  totalVatAmount: number;
  missingFields: string[];
  fiscalReceiptNumber: string | null;
  lastError: string | null;
  createdAt: string;
}

interface TaxCategory {
  id: string;
  title: string;
  mxikCode: string;
  packageCode: string | null;
  unitCode: string | null;
  markingRequired: boolean;
  isActive: boolean;
}

interface MissingProduct {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  usageCount: number;
}

const PAGE_SIZE = 30;

const RECEIPT_STATUS: Record<FiscalReceipt['status'], { label: string; variant: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  incomplete: { label: "Ma'lumot yetishmaydi", variant: 'warning' },
  pending: { label: 'Kutilmoqda', variant: 'neutral' },
  sent: { label: 'Yuborildi', variant: 'primary' },
  confirmed: { label: 'Tasdiqlandi', variant: 'success' },
  failed: { label: 'Xato', variant: 'danger' },
};

const fmt = (n: number) => n.toLocaleString('uz-UZ');

/* ─── Cheklar bo'limi ─── */

function ReceiptsSection() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [openId, setOpenId] = useState<string | null>(null);

  const statsQ = useQuery<Record<string, number>>({
    queryKey: ['admin', 'fiscal-stats'],
    queryFn: async () => (await api.get('/admin/fiscal/receipts/stats')).data,
  });

  const listQ = useQuery<{ items: FiscalReceipt[]; total: number }>({
    queryKey: ['admin', 'fiscal-receipts', page, status],
    queryFn: async () =>
      (await api.get('/admin/fiscal/receipts', {
        params: { page: page - 1, limit: PAGE_SIZE, ...(status ? { status } : {}) },
      })).data,
  });

  const rebuild = useMutation({
    mutationFn: (id: string) => api.post(`/admin/fiscal/receipts/${id}/rebuild`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'fiscal-receipts'] });
      qc.invalidateQueries({ queryKey: ['admin', 'fiscal-stats'] });
      toast.success('Chek qayta qurildi');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const s = statsQ.data ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatPill label="Tasdiqlangan" value={s.confirmed ?? 0} />
        <StatPill label="Kutilmoqda" value={s.pending ?? 0} />
        <StatPill label="Ma'lumot yetishmaydi" value={s.incomplete ?? 0} />
        <StatPill label="Xato" value={s.failed ?? 0} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['', 'incomplete', 'pending', 'sent', 'confirmed', 'failed'].map((st) => (
          <button
            key={st || 'all'}
            onClick={() => { setStatus(st); setPage(1); }}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              status === st ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {st === '' ? 'Hammasi' : RECEIPT_STATUS[st as FiscalReceipt['status']].label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {listQ.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Yuklanmoqda…</p>
        ) : listQ.isError ? (
          <p className="p-4 text-sm text-destructive">{extractErrorMessage(listQ.error)}</p>
        ) : !listQ.data?.items.length ? (
          <p className="p-4 text-sm text-muted-foreground">Cheklar yo&apos;q</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Sana</th>
                <th className="px-4 py-2 text-left">Turi</th>
                <th className="px-4 py-2 text-left">Sotuvchi (STIR)</th>
                <th className="px-4 py-2 text-right">Summa</th>
                <th className="px-4 py-2 text-left">Holat</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {listQ.data.items.map((r) => (
                <ReceiptRow
                  key={r.id}
                  r={r}
                  open={openId === r.id}
                  onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                  onRebuild={() => rebuild.mutate(r.id)}
                  rebuilding={rebuild.isPending}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {listQ.data && (
        <Pagination page={page} total={listQ.data.total} pageSize={PAGE_SIZE} onPage={setPage} />
      )}
    </div>
  );
}

function ReceiptRow({
  r, open, onToggle, onRebuild, rebuilding,
}: {
  r: FiscalReceipt;
  open: boolean;
  onToggle: () => void;
  onRebuild: () => void;
  rebuilding: boolean;
}) {
  const st = RECEIPT_STATUS[r.status];
  return (
    <>
      <tr className="border-t hover:bg-muted/30">
        <td className="px-4 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('uz-UZ')}</td>
        <td className="px-4 py-2">
          <Badge variant={r.type === 'sale' ? 'primary' : 'warning'}>
            {r.type === 'sale' ? 'Sotuv' : 'Qaytarish'}
          </Badge>
        </td>
        <td className="px-4 py-2">
          {r.sellerName ?? '—'}
          {r.sellerStir && <span className="ml-1 text-xs text-muted-foreground">({r.sellerStir})</span>}
        </td>
        <td className="px-4 py-2 text-right font-medium whitespace-nowrap">{fmt(r.totalAmount)} so&apos;m</td>
        <td className="px-4 py-2"><Badge variant={st.variant}>{st.label}</Badge></td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          {(r.status === 'incomplete' || r.status === 'failed') && (
            <Button variant="ghost" size="sm" disabled={rebuilding} onClick={onRebuild} title="Qayta qurish">
              <RefreshCw className="size-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </td>
      </tr>
      {open && (
        <tr className="border-t bg-muted/20">
          <td colSpan={6} className="px-4 py-3">
            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                Buyurtma:{' '}
                <Link href={`/admin/orders?order=${r.orderId}`} className="font-mono text-primary underline">
                  {r.orderId}
                </Link>
                {r.fiscalReceiptNumber && <> · Fiskal raqam: {r.fiscalReceiptNumber}</>}
                {r.sellerVatPayer && <> · QQS to&apos;lovchi</>}
              </p>
              {r.missingFields.length > 0 && (
                <p className="flex items-center gap-1 text-amber-600">
                  <TriangleAlert className="size-3.5" />
                  Yetishmaydi: {r.missingFields.join(', ')}
                </p>
              )}
              {r.lastError && <p className="text-destructive">Xato: {r.lastError}</p>}
              <table className="w-full">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left">Mahsulot</th>
                    <th className="py-1 text-left">MXIK</th>
                    <th className="py-1 text-right">Miqdor</th>
                    <th className="py-1 text-right">Narx</th>
                    <th className="py-1 text-right">Jami</th>
                    <th className="py-1 text-right">QQS</th>
                  </tr>
                </thead>
                <tbody>
                  {r.lines.map((l) => (
                    <tr key={l.orderItemId} className="border-t border-border/50">
                      <td className="py-1">
                        {l.productName}
                        {l.markingRequired && (
                          <Badge
                            variant={(l.markingCodes?.length ?? 0) >= l.quantity ? 'success' : 'warning'}
                            className="ml-1"
                          >
                            markirovka {l.markingCodes?.length ?? 0}/{l.quantity}
                          </Badge>
                        )}
                      </td>
                      <td className="py-1 font-mono">{l.mxikCode ?? <span className="text-amber-600">yo&apos;q</span>}</td>
                      <td className="py-1 text-right">{l.quantity}</td>
                      <td className="py-1 text-right">{fmt(l.unitPrice)}</td>
                      <td className="py-1 text-right">{fmt(l.lineTotal)}</td>
                      <td className="py-1 text-right">{l.vatRate > 0 ? `${fmt(l.vatAmount)} (${l.vatRate}%)` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Soliq toifalari bo'limi ─── */

interface CategoryForm {
  title: string;
  mxikCode: string;
  packageCode: string;
  unitCode: string;
  markingRequired: boolean;
}

const EMPTY_CATEGORY: CategoryForm = { title: '', mxikCode: '', packageCode: '', unitCode: '', markingRequired: false };

function TaxCategoriesSection() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ id: string | null; form: CategoryForm } | null>(null);
  const [err, setErr] = useState('');
  useEscapeKey(!!modal, () => { setModal(null); setErr(''); });

  const listQ = useQuery<TaxCategory[]>({
    queryKey: ['admin', 'tax-categories'],
    queryFn: async () => (await api.get('/admin/fiscal/tax-categories')).data,
  });

  const save = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: CategoryForm }) => {
      const body = {
        title: form.title,
        mxikCode: form.mxikCode,
        packageCode: form.packageCode || undefined,
        unitCode: form.unitCode || undefined,
        markingRequired: form.markingRequired,
      };
      if (id) await api.patch(`/admin/fiscal/tax-categories/${id}`, body);
      else await api.post('/admin/fiscal/tax-categories', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tax-categories'] });
      setModal(null);
      setErr('');
      toast.success('Soliq toifasi saqlandi');
    },
    onError: (e) => setErr(extractErrorMessage(e)),
  });

  const toggleActive = useMutation({
    mutationFn: (c: TaxCategory) =>
      api.patch(`/admin/fiscal/tax-categories/${c.id}`, { isActive: !c.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tax-categories'] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModal({ id: null, form: EMPTY_CATEGORY })}>
          <Plus className="size-4" /> Yangi toifa
        </Button>
      </div>

      <Card className="overflow-hidden">
        {listQ.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Yuklanmoqda…</p>
        ) : !listQ.data?.length ? (
          <p className="p-4 text-sm text-muted-foreground">
            Toifalar hali yo&apos;q. MXIK kodlarni tasnif.soliq.uz dan oling — masalan &quot;Gazlangan ichimliklar&quot; uchun bitta toifa yaratib, barcha shu turdagi mahsulotlarga biriktiring.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Nomi</th>
                <th className="px-4 py-2 text-left">MXIK</th>
                <th className="px-4 py-2 text-left">Qadoq</th>
                <th className="px-4 py-2 text-left">Markirovka</th>
                <th className="px-4 py-2 text-left">Holat</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {listQ.data.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2">{c.title}</td>
                  <td className="px-4 py-2 font-mono text-xs">{c.mxikCode}</td>
                  <td className="px-4 py-2 text-xs">{c.packageCode ?? '—'}</td>
                  <td className="px-4 py-2">
                    {c.markingRequired ? <Badge variant="warning">Asl belgisi</Badge> : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => toggleActive.mutate(c)}>
                      <Badge variant={c.isActive ? 'success' : 'neutral'}>
                        {c.isActive ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setModal({
                          id: c.id,
                          form: {
                            title: c.title,
                            mxikCode: c.mxikCode,
                            packageCode: c.packageCode ?? '',
                            unitCode: c.unitCode ?? '',
                            markingRequired: c.markingRequired,
                          },
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md space-y-3 p-5">
            <h3 className="text-sm font-semibold">{modal.id ? 'Toifani tahrirlash' : 'Yangi soliq toifasi'}</h3>
            <div>
              <label className="mb-0.5 block text-xs font-medium text-muted-foreground">Nomi</label>
              <Input
                value={modal.form.title}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, title: e.target.value } })}
                placeholder="Gazlangan ichimliklar (PET)"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium text-muted-foreground">MXIK kodi (17 raqam, tasnif.soliq.uz)</label>
              <Input
                value={modal.form.mxikCode}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, mxikCode: e.target.value.replace(/\D/g, '') } })}
                placeholder="02202001001000000"
                maxLength={17}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-0.5 block text-xs font-medium text-muted-foreground">Qadoq kodi</label>
                <Input
                  value={modal.form.packageCode}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, packageCode: e.target.value } })}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-muted-foreground">O&apos;lchov birligi kodi</label>
                <Input
                  value={modal.form.unitCode}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, unitCode: e.target.value } })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={modal.form.markingRequired}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, markingRequired: e.target.checked } })}
              />
              Asl belgisi (Data Matrix) majburiy markirovka ostida
            </label>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setModal(null); setErr(''); }}>
                Bekor qilish
              </Button>
              <Button
                size="sm"
                disabled={!modal.form.title || modal.form.mxikCode.length !== 17 || save.isPending}
                onClick={() => save.mutate({ id: modal.id, form: modal.form })}
              >
                Saqlash
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─── MXIK biriktirilmagan mahsulotlar ─── */

interface TasnifEntry {
  mxikCode: string;
  name: string;
  groupName: string | null;
  internationalCode: string | null;
  unitCode: string | null;
}

function MissingProductsSection() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<
    Record<string, { loading: boolean; matchedBy?: 'barcode' | 'name'; entries: TasnifEntry[] }>
  >({});

  // tasnif.soliq.uz dan taklif: barcode bo'yicha aniq moslik, bo'lmasa nom bo'yicha.
  const loadSuggestion = async (productId: string) => {
    setSuggestions((prev) => ({ ...prev, [productId]: { loading: true, entries: [] } }));
    try {
      const { data } = await api.get<{ matchedBy: 'barcode' | 'name'; entries: TasnifEntry[] }>(
        `/admin/fiscal/products/${productId}/tasnif-suggest`,
      );
      setSuggestions((prev) => ({
        ...prev,
        [productId]: { loading: false, matchedBy: data.matchedBy, entries: data.entries.slice(0, 3) },
      }));
    } catch (e) {
      setSuggestions((prev) => { const next = { ...prev }; delete next[productId]; return next; });
      toast.error(extractErrorMessage(e));
    }
  };

  const applyTasnif = useMutation({
    mutationFn: ({ productId, entry }: { productId: string; entry: TasnifEntry }) =>
      api.post(`/admin/fiscal/products/${productId}/apply-tasnif`, {
        mxikCode: entry.mxikCode,
        name: entry.name,
        unitCode: entry.unitCode ?? undefined,
      }),
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'fiscal-missing-products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tax-categories'] });
      setSuggestions((prev) => { const next = { ...prev }; delete next[productId]; return next; });
      toast.success('MXIK biriktirildi (toifa avtomatik yaratildi)');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const listQ = useQuery<{ items: MissingProduct[]; total: number }>({
    queryKey: ['admin', 'fiscal-missing-products', page],
    queryFn: async () =>
      (await api.get('/admin/fiscal/products-missing-tax-info', {
        params: { page: page - 1, limit: PAGE_SIZE },
      })).data,
  });

  const categoriesQ = useQuery<TaxCategory[]>({
    queryKey: ['admin', 'tax-categories'],
    queryFn: async () => (await api.get('/admin/fiscal/tax-categories')).data,
  });

  const assign = useMutation({
    mutationFn: ({ productId, taxCategoryId }: { productId: string; taxCategoryId: string }) =>
      api.patch(`/admin/fiscal/products/${productId}/tax-category`, { taxCategoryId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'fiscal-missing-products'] });
      toast.success('MXIK toifasi biriktirildi');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const activeCategories = (categoriesQ.data ?? []).filter((c) => c.isActive);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {listQ.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Yuklanmoqda…</p>
        ) : !listQ.data?.items.length ? (
          <p className="p-4 text-sm text-muted-foreground">
            Hamma faol mahsulotlarga MXIK biriktirilgan ✅
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Mahsulot</th>
                <th className="px-4 py-2 text-left">Barcode</th>
                <th className="px-4 py-2 text-right">Do&apos;konlar</th>
                <th className="px-4 py-2 text-left">Toifa tanlash</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {listQ.data.items.map((p) => {
                const sug = suggestions[p.id];
                return (
                  <Fragment key={p.id}>
                    <tr className="border-t hover:bg-muted/30">
                      <td className="px-4 py-2">
                        {p.name}
                        {p.brand && <span className="ml-1 text-xs text-muted-foreground">({p.brand})</span>}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{p.barcode ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{p.usageCount}</td>
                      <td className="px-4 py-2">
                        <select
                          className="w-full max-w-64 rounded-md border border-border bg-background px-2 py-1 text-sm"
                          value={selected[p.id] ?? ''}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        >
                          <option value="">— tanlang —</option>
                          {activeCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title} ({c.mxikCode})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sug?.loading}
                          onClick={() => loadSuggestion(p.id)}
                          title="tasnif.soliq.uz dan barcode/nom bo'yicha MXIK taklifi"
                        >
                          <Sparkles className="size-3.5" />
                          {sug?.loading ? '…' : 'Taklif'}
                        </Button>{' '}
                        <Button
                          size="sm"
                          disabled={!selected[p.id] || assign.isPending}
                          onClick={() => assign.mutate({ productId: p.id, taxCategoryId: selected[p.id] })}
                        >
                          Biriktirish
                        </Button>
                      </td>
                    </tr>
                    {sug && !sug.loading && (
                      <tr className="border-t bg-muted/20">
                        <td colSpan={5} className="px-4 py-2">
                          {sug.entries.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Tasnifdan taklif topilmadi — qo&apos;lda tanlang.</p>
                          ) : (
                            <div className="space-y-1.5">
                              <p className="text-xs text-muted-foreground">
                                {sug.matchedBy === 'barcode'
                                  ? 'Barcode bo\'yicha ANIQ moslik:'
                                  : 'Nomi bo\'yicha takliflar (tekshirib tanlang):'}
                              </p>
                              {sug.entries.map((e) => (
                                <div key={e.mxikCode} className="flex items-center gap-2 text-xs">
                                  <span className="font-mono">{e.mxikCode}</span>
                                  <span className="min-w-0 flex-1 truncate">{e.name}{e.groupName ? ` · ${e.groupName}` : ''}</span>
                                  <Button
                                    size="sm"
                                    variant={sug.matchedBy === 'barcode' ? 'default' : 'outline'}
                                    disabled={applyTasnif.isPending}
                                    onClick={() => applyTasnif.mutate({ productId: p.id, entry: e })}
                                  >
                                    Qo&apos;llash
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {listQ.data && (
        <Pagination page={page} total={listQ.data.total} pageSize={PAGE_SIZE} onPage={setPage} />
      )}
    </div>
  );
}

/* ─── Sahifa ─── */

type Tab = 'receipts' | 'categories' | 'missing';

const TABS: { key: Tab; label: string; icon: typeof ReceiptText }[] = [
  { key: 'receipts', label: 'Cheklar', icon: ReceiptText },
  { key: 'categories', label: 'Soliq toifalari (MXIK)', icon: Tags },
  { key: 'missing', label: 'MXIK biriktirilmagan', icon: TriangleAlert },
];

export default function FiscalPage() {
  const [tab, setTab] = useState<Tab>('receipts');

  const missingQ = useQuery<{ total: number }>({
    queryKey: ['admin', 'fiscal-missing-products', 1],
    queryFn: async () =>
      (await api.get('/admin/fiscal/products-missing-tax-info', { params: { page: 0, limit: PAGE_SIZE } })).data,
  });

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Soliq / Fiskal cheklar"
        description="Komissioner modelida sotuvchi nomidan chiqariladigan cheklar, MXIK katalogi va biriktirish"
      />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
            {t.key === 'missing' && (missingQ.data?.total ?? 0) > 0 && (
              <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 text-[0.65rem] font-bold text-white">
                {missingQ.data!.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'receipts' && <ReceiptsSection />}
      {tab === 'categories' && <TaxCategoriesSection />}
      {tab === 'missing' && <MissingProductsSection />}
    </div>
  );
}

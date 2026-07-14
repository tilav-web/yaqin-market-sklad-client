'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MapPin, Package, Phone, ShieldOff, Search, Store, X } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

type OrderStatus = 'new' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
type PaymentMethod = 'cash' | 'click_online';
type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'failed';
type Channel = 'delivery' | 'in_store';

interface OrderItemRow {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  returnedQuantity: number;
}

interface TimelineEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

/** Fields present in both the list (GET /admin/orders) and detail (GET /admin/orders/:id) response. */
interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: Channel;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  commissionExempt: boolean;
  shop: { id: string; name: string; address: string } | null;
  user: { id: string; name: string | null; phone: string } | null;
}

/** GET /admin/orders/:id also joins items/deliveryAddress — the list endpoint does not. */
interface AdminOrderDetail extends AdminOrderSummary {
  subTotal: number;
  deliveryFee: number;
  distanceKm: number;
  cancellationReason: string | null;
  returnReason: string | null;
  timeline: TimelineEvent[];
  items: OrderItemRow[];
  deliveryAddress: { address: string; latitude: number; longitude: number } | null;
}

interface OrdersPageResp { items: AdminOrderSummary[]; total: number }

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Yangi',
  accepted: 'Qabul qilingan',
  preparing: 'Tayyorlanmoqda',
  delivering: 'Yetkazilmoqda',
  delivered: 'Yetkazib berilgan',
  cancelled: 'Bekor qilingan',
};
const STATUS_VARIANT: Record<OrderStatus, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
  new: 'neutral',
  accepted: 'primary',
  preparing: 'warning',
  delivering: 'warning',
  delivered: 'success',
  cancelled: 'danger',
};
const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  not_required: 'Naqd',
  pending: "Kutilmoqda",
  paid: "To'langan",
  failed: 'Xatolik',
};
const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  not_required: 'neutral',
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
};

const STATUS_FILTERS: { key: OrderStatus | ''; label: string }[] = [
  { key: '', label: 'Barchasi' },
  { key: 'new', label: 'Yangi' },
  { key: 'accepted', label: 'Qabul qilingan' },
  { key: 'preparing', label: 'Tayyorlanmoqda' },
  { key: 'delivering', label: 'Yetkazilmoqda' },
  { key: 'delivered', label: 'Yetkazilgan' },
  { key: 'cancelled', label: 'Bekor qilingan' },
];

const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";

function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery<AdminOrderDetail>({
    queryKey: ['admin', 'orders', 'detail', orderId],
    queryFn: async () => (await api.get(`/admin/orders/${orderId}`)).data,
  });
  const o = q.data;

  const setExempt = useMutation({
    mutationFn: async (exempt: boolean) => {
      await api.patch(`/admin/orders/${orderId}/exempt`, { exempt });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders', 'detail', orderId] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
  const exemptLocked = o ? (o.status === 'delivered' || o.status === 'cancelled') : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">
            {o ? `#${o.orderNumber}` : 'Buyurtma'}
          </h2>
          <button
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        {q.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Yuklanmoqda…</p>
        ) : q.isError ? (
          <p className="mt-4 text-sm text-destructive">
            {extractErrorMessage(q.error)} —{' '}
            <button className="underline" onClick={() => q.refetch()}>qayta urinish</button>
          </p>
        ) : !o ? null : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge>
              <Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus]}>
                {PAYMENT_STATUS_LABEL[o.paymentStatus]}
                {o.paymentMethod === 'click_online' ? ' · Click' : ''}
              </Badge>
              {o.channel === 'in_store' && <Badge variant="neutral">Do&apos;konda sotuv</Badge>}
              {o.commissionExempt && <Badge variant="warning">Komissiyasiz</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(o.createdAt).toLocaleString('uz-UZ')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Komissiyasiz buyurtma</p>
                <p className="text-xs text-muted-foreground">
                  {exemptLocked
                    ? "Buyurtma allaqachon yetkazilgan/bekor qilingan — bu belgi endi ta'sir qilmaydi."
                    : "Yoqilsa, bu buyurtma yetkazilganda 0% komissiya bilan hisoblanadi."}
                </p>
              </div>
              <Button
                variant={o.commissionExempt ? 'destructive' : 'outline'}
                size="sm"
                disabled={exemptLocked || setExempt.isPending}
                onClick={() => setExempt.mutate(!o.commissionExempt)}>
                <ShieldOff className="size-4" />
                {o.commissionExempt ? 'Bekor qilish' : 'Komissiyasiz qilish'}
              </Button>
            </div>
            {setExempt.isError && (
              <p className="text-sm text-destructive">{extractErrorMessage(setExempt.error)}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Store className="size-3.5" /> Do&apos;kon
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{o.shop?.name ?? "O'chirilgan"}</p>
                {o.shop?.address && <p className="text-xs text-muted-foreground">{o.shop.address}</p>}
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Phone className="size-3.5" /> Mijoz
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {o.user?.name || o.user?.phone || 'Do\'kon mijozi'}
                </p>
                {o.user?.phone && <p className="text-xs text-muted-foreground">{o.user.phone}</p>}
              </div>
            </div>

            {o.deliveryAddress && (
              <div className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="size-3.5" /> Yetkazish manzili
                </p>
                <p className="mt-1 text-sm text-foreground">{o.deliveryAddress.address}</p>
                <p className="text-xs text-muted-foreground">{o.distanceKm.toFixed(1)} km</p>
              </div>
            )}

            <div className="rounded-lg border border-border">
              <p className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Package className="size-3.5" /> Mahsulotlar
              </p>
              <div className="divide-y divide-border">
                {o.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">
                      {it.productName} × {it.quantity}
                      {it.returnedQuantity > 0 && (
                        <span className="text-destructive"> ({it.returnedQuantity} qaytarilgan)</span>
                      )}
                    </span>
                    <span className="shrink-0 font-medium text-foreground">{money(it.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 border-t border-border px-3 py-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Mahsulotlar</span><span>{money(o.subTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Yetkazish</span><span>{money(o.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Jami</span><span>{money(o.total)}</span>
                </div>
              </div>
            </div>

            {(o.cancellationReason || o.returnReason) && (
              <div className="space-y-2">
                {o.cancellationReason && (
                  <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                    Bekor qilish sababi: {o.cancellationReason}
                  </p>
                )}
                {o.returnReason && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Qaytarish sababi: {o.returnReason}
                  </p>
                )}
              </div>
            )}

            {o.timeline?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Holat tarixi
                </p>
                <div className="space-y-1.5">
                  {o.timeline.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                      <span>{new Date(t.at).toLocaleString('uz-UZ')}</span>
                      {t.note && <span className="truncate">— {t.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);

  const ordersQuery = useQuery<OrdersPageResp>({
    queryKey: ['admin', 'orders', submitted, status, dateFrom, dateTo, page],
    queryFn: async () =>
      (await api.get('/admin/orders', {
        params: {
          search: submitted || undefined,
          status: status || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
      })).data,
    placeholderData: (prev) => prev,
  });

  const orders = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Tarmoq"
        title="Buyurtmalar"
        description="Platforma bo'ylab barcha buyurtmalarni qidirish, filtrlash va ko'rish."
      />

      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); setPage(0); setSubmitted(search.trim()); }}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buyurtma raqami, mijoz yoki do'kon…"
              className="w-72 pl-9"
            />
          </div>
          <Button type="submit" variant="outline">Qidirish</Button>
        </form>

        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground">Sana:</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            className="w-36"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            className="w-36"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => { setStatus(f.key); setPage(0); }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              status === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Buyurtma</th>
              <th className="px-4 py-3 font-semibold">Do&apos;kon</th>
              <th className="px-4 py-3 font-semibold">Mijoz</th>
              <th className="px-4 py-3 font-semibold">Holat</th>
              <th className="px-4 py-3 font-semibold">To&apos;lov</th>
              <th className="px-4 py-3 font-semibold">Summa</th>
              <th className="px-4 py-3 font-semibold">Sana</th>
              <th className="px-4 py-3 text-right font-semibold">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {ordersQuery.isLoading ? (
              <tr><td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda…</td></tr>
            ) : ordersQuery.isError ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-destructive">
                  {extractErrorMessage(ordersQuery.error)} —{' '}
                  <button className="underline" onClick={() => ordersQuery.refetch()}>qayta urinish</button>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Buyurtma topilmadi</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">#{o.orderNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.shop?.name ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.user?.name || o.user?.phone || <span className="italic">Do&apos;kon mijozi</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                    {o.commissionExempt && <Badge variant="warning">Komissiyasiz</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus]}>
                    {PAYMENT_STATUS_LABEL[o.paymentStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{money(o.total)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString('uz-UZ')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDetailId(o.id)}>
                    <Eye className="size-4" /> Batafsil
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      {detailId && <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

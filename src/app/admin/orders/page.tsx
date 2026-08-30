'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  Store,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useEscapeKey } from '@/lib/use-escape-key';
import { toast } from '@/stores/toast';

type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'seller_no_response'
  | 'seller_rejected';

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

interface LocationEvidence {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string | null;
  mocked: boolean | null;
  source: 'foreground' | 'background' | 'last_known' | 'map_pick';
  deviceId: string | null;
  receivedAt: string;
  skewMs: number | null;
  actorUserId: string;
  actorRole: 'customer' | 'shop';
}

interface AdminOrderDetail extends AdminOrderSummary {
  subTotal: number;
  deliveryFee: number;
  distanceKm: number;
  cancellationReason: string | null;
  returnReason: string | null;
  timeline: TimelineEvent[];
  items: OrderItemRow[];
  deliveryAddress: { address: string; latitude: number; longitude: number } | null;
  orderEvidence: LocationEvidence | null;
  dispatchedEvidence: LocationEvidence | null;
  deliveredEvidence: LocationEvidence | null;
  providerFeeAmount: number;
  providerFeePercentSnapshot: number | null;
}

interface OrdersPageResp {
  items: AdminOrderSummary[];
  total: number;
}

const PAGE_SIZE = 25;
const fmt = (n: number) => n.toLocaleString('uz-UZ');
const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";

const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  new: { label: 'Yangi', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: Clock },
  accepted: { label: 'Qabul qilindi', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', icon: CheckCircle2 },
  preparing: { label: 'Tayyorlanmoqda', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Package },
  delivering: { label: 'Yetkazilmoqda', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: Truck },
  delivered: { label: 'Yetkazildi', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Bekor qilindi', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: XCircle },
  seller_no_response: { label: 'Seller javob bermadi', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  seller_rejected: { label: 'Seller rad etdi', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: XCircle },
};

const STATUS_TABS: { key: OrderStatus | ''; label: string; icon: React.ElementType }[] = [
  { key: '', label: 'Barchasi', icon: ShoppingBag },
  { key: 'new', label: 'Yangi', icon: Clock },
  { key: 'preparing', label: 'Tayyorlanmoqda', icon: Package },
  { key: 'delivering', label: 'Kuryerda', icon: Truck },
  { key: 'delivered', label: 'Yetkazilgan', icon: CheckCircle2 },
  { key: 'cancelled', label: 'Bekor qilingan', icon: XCircle },
];

function OrderDetailModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  useEscapeKey(true, onClose);

  const detailQ = useQuery<AdminOrderDetail>({
    queryKey: ['admin', 'orders', orderId],
    queryFn: async () => (await api.get(`/admin/orders/${orderId}`)).data,
  });

  const toggleCommissionExempt = useMutation({
    mutationFn: (exempt: boolean) =>
      api.patch(`/admin/orders/${orderId}/commission-exempt`, { exempt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      toast.success('Komissiya imtiyozi yangilandi');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const o = detailQ.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-foreground">
                  Buyurtma #{o?.orderNumber || '...'}
                </h3>
                {o && (
                  <span
                    className={cn(
                      'text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full border',
                      STATUS_META[o.status]?.color,
                    )}>
                    {STATUS_META[o.status]?.label || o.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {o?.createdAt ? new Date(o.createdAt).toLocaleString('uz-UZ') : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {detailQ.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !o ? (
            <p className="text-center text-sm text-destructive">Buyurtma ma&apos;lumotlari topilmadi</p>
          ) : (
            <>
              {/* Customer & Shop Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1 text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <User className="size-3.5 text-primary" /> Xaridor
                  </span>
                  <p className="font-extrabold text-foreground text-sm">
                    {o.user?.name || 'Mijoz'}
                  </p>
                  <p className="text-muted-foreground font-mono">{o.user?.phone || '—'}</p>
                  {o.deliveryAddress && (
                    <p className="text-muted-foreground pt-1 border-t border-border/40 flex items-start gap-1">
                      <MapPin className="size-3 text-primary shrink-0 mt-0.5" />
                      {o.deliveryAddress.address}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1 text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Store className="size-3.5 text-primary" /> Do&apos;kon (Seller)
                  </span>
                  <p className="font-extrabold text-foreground text-sm">
                    {o.shop?.name || 'Do\'kon'}
                  </p>
                  <p className="text-muted-foreground">{o.shop?.address || '—'}</p>
                  <div className="pt-1 border-t border-border/40 flex items-center justify-between text-muted-foreground">
                    <span>To&apos;lov turi:</span>
                    <strong className="text-foreground font-bold">
                      {o.paymentMethod === 'click_online' ? '💳 Click (Onlayn)' : '💵 Naqd'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Buyurtma tarkibi ({o.items?.length || 0} ta mahsulot)
                </h4>
                <div className="rounded-xl border border-border/80 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground font-semibold">
                        <th className="p-3">Mahsulot</th>
                        <th className="p-3 text-center">Miqdor</th>
                        <th className="p-3 text-right">Narx</th>
                        <th className="p-3 text-right">Jami</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(o.items || []).map((it) => (
                        <tr key={it.id} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold text-foreground">{it.productName}</td>
                          <td className="p-3 text-center font-bold">{it.quantity} dona</td>
                          <td className="p-3 text-right font-mono text-muted-foreground">
                            {fmt(it.unitPrice)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-foreground">
                            {fmt(it.lineTotal)} so&apos;m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Breakdown */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Mahsulotlar summasi:</span>
                  <span className="font-mono">{money(o.subTotal || o.total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Yetkazib berish haqi:</span>
                  <span className="font-mono">{money(o.deliveryFee || 0)}</span>
                </div>
                {o.providerFeeAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Ekvayring xarajati:</span>
                    <span className="font-mono text-rose-500">-{money(o.providerFeeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border/60 text-sm font-extrabold text-foreground">
                  <span>Jami to&apos;lov:</span>
                  <span className="text-primary font-mono">{money(o.total)}</span>
                </div>
              </div>

              {/* Commission Exempt Switch */}
              <div className="flex items-center justify-between rounded-xl border border-border/80 p-3.5 bg-card">
                <div>
                  <p className="text-xs font-bold text-foreground">Komissiyadan ozod qilish</p>
                  <p className="text-[0.68rem] text-muted-foreground">
                    Platforma bu buyurtmadan 0% komissiya oladi
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={o.commissionExempt ? 'default' : 'outline'}
                  disabled={toggleCommissionExempt.isPending}
                  onClick={() => toggleCommissionExempt.mutate(!o.commissionExempt)}
                  className="h-8 rounded-xl text-xs font-semibold">
                  {o.commissionExempt ? 'Imtiyoz faol (0%)' : 'Standart komissiya'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
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
  const [detailId, setDetailId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('order');
    }
    return null;
  });

  const ordersQuery = useQuery<OrdersPageResp>({
    queryKey: ['admin', 'orders', submitted, status, dateFrom, dateTo, page],
    queryFn: async () =>
      (
        await api.get('/admin/orders', {
          params: {
            search: submitted || undefined,
            status: status || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
          },
        })
      ).data,
    placeholderData: (prev) => prev,
  });

  const orders = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.total ?? 0;

  const [exportErr, setExportErr] = useState('');
  const exportXlsx = useMutation({
    mutationFn: () =>
      downloadFile('/admin/orders/export', 'buyurtmalar.xlsx', {
        search: submitted || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    onError: (e) => setExportErr(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {detailId && (
        <OrderDetailModal
          orderId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      {/* Page Header */}
      <PageHeader
        title="Buyurtmalar Oqimi"
        description="Platformadagi barcha onlayn va naqd buyurtmalar, kuryerlar va to'lovlar holati"
        breadcrumbs={[{ label: 'Savdo & Do\'konlar' }, { label: 'Buyurtmalar' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={exportXlsx.isPending}
            onClick={() => {
              setExportErr('');
              exportXlsx.mutate();
            }}
            className="h-9 gap-1.5 rounded-xl border-border px-3.5 text-xs font-semibold">
            <Download className="size-3.5 text-primary" />
            {exportXlsx.isPending ? 'Yuklanmoqda…' : 'Excel Eksport'}
          </Button>
        }
      />

      {exportErr && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {exportErr}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs">
        <form
          className="flex items-center gap-2 flex-1 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setSubmitted(search.trim());
          }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buyurtma #, mijoz yoki do'kon nomi..."
              className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 rounded-xl px-4 text-xs font-bold">
            Qidirish
          </Button>
        </form>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="size-4 text-muted-foreground" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium outline-none"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium outline-none"
          />
        </div>
      </div>

      {/* Status Filter Pipeline */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {STATUS_TABS.map((f) => {
          const Icon = f.icon;
          const isActive = status === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatus(f.key);
                setPage(0);
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}>
              <Icon className="size-3.5" />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <Card className="rounded-2xl border border-border/80 overflow-hidden shadow-xs">
        {ordersQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="size-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-bold text-foreground">Buyurtmalar topilmadi</p>
            <p className="text-xs text-muted-foreground mt-0.5">Filtrlarni o&apos;zgartirib ko&apos;ring</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground font-bold uppercase tracking-wider text-[0.68rem]">
                  <th className="px-4 py-3.5">Buyurtma #</th>
                  <th className="px-4 py-3.5">Do&apos;kon</th>
                  <th className="px-4 py-3.5">Mijoz</th>
                  <th className="px-4 py-3.5">Holat</th>
                  <th className="px-4 py-3.5">To&apos;lov</th>
                  <th className="px-4 py-3.5 text-right">Summa</th>
                  <th className="px-4 py-3.5">Sana</th>
                  <th className="px-4 py-3.5 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => {
                  const meta = STATUS_META[o.status] || { label: o.status, color: 'bg-muted text-muted-foreground' };
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setDetailId(o.id)}
                      className="cursor-pointer hover:bg-muted/40 transition-colors group">
                      <td className="px-4 py-3.5 font-bold font-mono text-foreground">
                        #{o.orderNumber}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {o.shop?.name || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-foreground">{o.user?.name || 'Mijoz'}</p>
                        <p className="text-[0.68rem] text-muted-foreground font-mono">{o.user?.phone}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold border', meta.color)}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-foreground">
                          {o.paymentMethod === 'click_online' ? '💳 Click' : '💵 Naqd'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold font-mono text-foreground">
                        {money(o.total)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground font-medium">
                        {new Date(o.createdAt).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Eye className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="border-t border-border p-3">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPage={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  List,
  MapPin,
  MessageSquareWarning,
  Phone,
  Power,
  PowerOff,
  Search,
  Star,
  Store,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';

import { type AdminComplaint, ComplaintCard } from '@/components/admin/complaint-card';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';

const ShopsMap = dynamic(() => import('@/components/admin/shops-map'), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full animate-pulse rounded-2xl bg-muted/40" />,
});

interface ShopOwner {
  id: string;
  name: string | null;
  phone: string;
}

interface AdminShop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  isOpenManual: boolean;
  ratingAverage: number;
  ratingCount: number;
  owner: ShopOwner | null;
  createdAt: string;
}

interface ShopsPage {
  items: AdminShop[];
  total: number;
}

const PAGE_SIZE = 25;
const MAP_LIMIT = 500;
type ViewMode = 'table' | 'map';

function ShopComplaintsPanel({ shopId }: { shopId: string }) {
  const complaintsQ = useQuery<AdminComplaint[]>({
    queryKey: ['admin', 'shop-complaints', shopId],
    queryFn: async () => (await api.get(`/admin/shops/${shopId}/complaints`)).data,
  });

  const complaints = complaintsQ.data ?? [];
  const invalidateKeys = [['admin', 'shop-complaints', shopId]];

  if (complaintsQ.isLoading) {
    return <p className="p-4 text-xs text-muted-foreground">Shikoyatlar yuklanmoqda…</p>;
  }
  if (complaintsQ.isError) {
    return (
      <p className="p-4 text-xs text-destructive">
        {extractErrorMessage(complaintsQ.error)} —{' '}
        <button className="underline" onClick={() => complaintsQ.refetch()}>
          qayta urinish
        </button>
      </p>
    );
  }
  if (complaints.length === 0) {
    return <p className="p-4 text-xs text-muted-foreground">Bu do&apos;konda hozircha shikoyat yo&apos;q.</p>;
  }
  return (
    <div className="space-y-2 p-4 bg-muted/20 rounded-xl border border-border/60">
      {complaints.map((c) => (
        <ComplaintCard
          key={c.id}
          complaint={c}
          showShopId={false}
          invalidateKeys={invalidateKeys}
        />
      ))}
    </div>
  );
}

export default function ShopsAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(0);
  const [view, setView] = useState<ViewMode>('table');
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ shop: AdminShop; next: boolean } | null>(null);

  const queryKey = view === 'table'
    ? ['admin', 'shops', 'list', submitted, page]
    : ['admin', 'shops', 'map', submitted];

  const shopsQuery = useQuery<ShopsPage>({
    queryKey,
    queryFn: async () =>
      (
        await api.get('/admin/shops', {
          params: {
            search: submitted || undefined,
            limit: view === 'table' ? PAGE_SIZE : MAP_LIMIT,
            offset: view === 'table' ? page * PAGE_SIZE : 0,
          },
        })
      ).data,
    placeholderData: (prev) => prev,
  });

  const shops = shopsQuery.data?.items ?? [];
  const total = shopsQuery.data?.total ?? 0;

  const toggleStatus = useMutation({
    mutationFn: ({ shopId, isActive }: { shopId: string; isActive: boolean }) =>
      api.patch(`/admin/shops/${shopId}/status`, { isActive }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'shops'] });
      setPendingToggle(null);
      toast.success(vars.isActive ? "Do'kon faollashtirildi" : "Do'kon to'xtatildi");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const [exportErr, setExportErr] = useState('');
  const exportXlsx = useMutation({
    mutationFn: () =>
      downloadFile('/admin/shops/export', 'dokonlar.xlsx', { search: submitted || undefined }),
    onError: (e) => setExportErr(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Do'konlar Tarmog'i"
        description="Platformadagi barcha faol, ochiq va to'xtatilgan sotuvchilar tarmog'i"
        breadcrumbs={[{ label: 'Savdo & Do\'konlar' }, { label: 'Do\'konlar' }]}
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setView('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all',
                  view === 'table'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                <List className="size-3.5" />
                Ro&apos;yxat
              </button>
              <button
                type="button"
                onClick={() => setView('map')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all',
                  view === 'map'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                <MapPin className="size-3.5" />
                Xarita
              </button>
            </div>

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
              {exportXlsx.isPending ? 'Yuklanmoqda…' : 'Eksport'}
            </Button>
          </div>
        }
      />

      {exportErr && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {exportErr}
        </div>
      )}

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs">
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
              placeholder="Do'kon nomi, manzil yoki telefon..."
              className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 rounded-xl px-4 text-xs font-bold">
            Qidirish
          </Button>
        </form>

        <span className="text-xs font-bold text-muted-foreground">
          Jami: <strong className="text-foreground">{total}</strong> ta do&apos;kon
        </span>
      </div>

      {/* Map or Table View */}
      {view === 'map' ? (
        <Card className="overflow-hidden rounded-2xl border border-border/80 p-2 shadow-xs">
          <ShopsMap
            shops={shops.map((s) => ({
              id: s.id,
              name: s.name,
              address: s.address,
              latitude: s.latitude,
              longitude: s.longitude,
              isActive: s.isActive,
              isOpenManual: s.isOpenManual,
              ownerName: s.owner?.name ?? null,
              ownerPhone: s.owner?.phone ?? '',
            }))}
          />
        </Card>
      ) : (
        <Card className="rounded-2xl border border-border/80 overflow-hidden shadow-xs">
          {shopsQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : shops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Store className="size-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-bold text-foreground">Do&apos;konlar topilmadi</p>
              <p className="text-xs text-muted-foreground mt-0.5">Qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground font-bold uppercase tracking-wider text-[0.68rem]">
                    <th className="px-4 py-3.5">Do&apos;kon nomi</th>
                    <th className="px-4 py-3.5">Egasi (Seller)</th>
                    <th className="px-4 py-3.5">Manzil</th>
                    <th className="px-4 py-3.5 text-center">Reyting</th>
                    <th className="px-4 py-3.5 text-center">Holat</th>
                    <th className="px-4 py-3.5 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {shops.map((s) => {
                    const isExpanded = expandedShopId === s.id;
                    return (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                                <Store className="size-4" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-sm leading-tight">{s.name}</p>
                                <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                                  {s.isOpenManual ? '🟢 Ochiq' : '⚪ Yopiq'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-foreground">{s.owner?.name || '—'}</p>
                            <p className="text-[0.68rem] text-muted-foreground font-mono">{s.owner?.phone}</p>
                          </td>

                          <td className="px-4 py-3.5 text-muted-foreground max-w-xs truncate">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 text-primary shrink-0" />
                              {s.address}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Star className="size-3 fill-amber-500 text-amber-500" />
                              {s.ratingAverage ? s.ratingAverage.toFixed(1) : '5.0'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold border',
                                s.isActive
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                              )}>
                              {s.isActive ? 'Faol' : 'To\'xtatilgan'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedShopId(isExpanded ? null : s.id)}
                                className="h-8 gap-1 rounded-xl text-xs font-semibold">
                                <MessageSquareWarning className="size-3.5 text-muted-foreground" />
                                {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                              </Button>

                              <Button
                                variant={s.isActive ? 'outline' : 'default'}
                                size="sm"
                                onClick={() => setPendingToggle({ shop: s, next: !s.isActive })}
                                className="h-8 gap-1 rounded-xl px-2.5 text-xs font-bold">
                                {s.isActive ? (
                                  <>
                                    <PowerOff className="size-3 text-destructive" /> To&apos;xtatish
                                  </>
                                ) : (
                                  <>
                                    <Power className="size-3" /> Faollashtirish
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="p-4 bg-muted/10 border-t border-border">
                              <ShopComplaintsPanel shopId={s.id} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {view === 'table' && total > PAGE_SIZE && (
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
      )}

      {/* Status Toggle Confirm Dialog */}
      {pendingToggle && (
        <ConfirmDialog
          open={true}
          title={pendingToggle.next ? "Do'konni faollashtirish" : "Do'konni to'xtatish"}
          description={
            pendingToggle.next
              ? `"${pendingToggle.shop.name}" do'konini qayta faollashtirmoqchimisiz? Do'kon mahsulotlari ilovada yana ko'rina boshlaydi.`
              : `"${pendingToggle.shop.name}" do'koni faoliyatini vaqtincha to'xtatmoqchimisiz? Xaridorlar bu do'kondan buyurtma bera olmaydi.`
          }
          confirmLabel={pendingToggle.next ? 'Ha, faollashtirish' : 'Ha, to\'xtatish'}
          onConfirm={() =>
            toggleStatus.mutate({
              shopId: pendingToggle.shop.id,
              isActive: pendingToggle.next,
            })
          }
          onCancel={() => setPendingToggle(null)}
        />
      )}
    </div>
  );
}

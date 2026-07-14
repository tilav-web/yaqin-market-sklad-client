'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Download, List, MapPin, MessageSquareWarning, Power, PowerOff, Search, Star } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Fragment, useState } from 'react';

import { type AdminComplaint, ComplaintCard } from '@/components/admin/complaint-card';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import type { ShopPin } from '@/components/admin/shops-map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast';

const ShopsMap = dynamic(() => import('@/components/admin/shops-map'), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full animate-pulse rounded-xl bg-muted/30" />,
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

const PAGE_SIZE = 20;
// Map view isn't paginated — pull a large-but-bounded batch so the map shows
// the whole network at once instead of just the current table page.
const MAP_LIMIT = 500;

type View = 'table' | 'map';

/**
 * Inline "Shikoyatlar" panel for one shop row — the shops page has no
 * separate shop-detail route to hang a tab off, so this slots in as an
 * expandable row instead of a second navigation path. Uses the dedicated
 * per-shop endpoint (unpaginated — shop-level complaint volume is small)
 * rather than the cross-shop queue's paginated list, so its cache key must
 * stay distinct: ['admin','shop-complaints', shopId].
 */
function ShopComplaintsPanel({ shopId }: { shopId: string }) {
  const complaintsQ = useQuery<AdminComplaint[]>({
    queryKey: ['admin', 'shop-complaints', shopId],
    queryFn: async () => (await api.get(`/admin/shops/${shopId}/complaints`)).data,
  });

  const complaints = complaintsQ.data ?? [];
  const invalidateKeys = [['admin', 'shop-complaints', shopId]];

  if (complaintsQ.isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Yuklanmoqda…</p>;
  }
  if (complaintsQ.isError) {
    return (
      <p className="p-4 text-sm text-destructive">
        {extractErrorMessage(complaintsQ.error)} —{' '}
        <button className="underline" onClick={() => complaintsQ.refetch()}>qayta urinish</button>
      </p>
    );
  }
  if (complaints.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Bu do&apos;konda shikoyat yo&apos;q.</p>;
  }
  return (
    <div className="space-y-2 p-4">
      {complaints.map((c) => (
        <ComplaintCard key={c.id} complaint={c} showShopId={false} invalidateKeys={invalidateKeys} />
      ))}
    </div>
  );
}

export default function ShopsAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(0);
  const [view, setView] = useState<View>('table');
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);

  const shopsQuery = useQuery({
    queryKey: ['admin', 'shops', submitted, page],
    queryFn: async () => {
      const res = await api.get<ShopsPage>('/admin/shops', {
        params: { search: submitted || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      });
      return res.data;
    },
    enabled: view === 'table',
  });

  const mapShopsQuery = useQuery({
    queryKey: ['admin', 'shops', 'map', submitted],
    queryFn: async () => {
      const res = await api.get<ShopsPage>('/admin/shops', {
        params: { search: submitted || undefined, limit: MAP_LIMIT, offset: 0 },
      });
      return res.data;
    },
    enabled: view === 'map',
  });

  const [actionErr, setActionErr] = useState('');
  const [pendingToggle, setPendingToggle] = useState<AdminShop | null>(null);
  const [toggleReason, setToggleReason] = useState('');

  const setActive = useMutation({
    mutationFn: async ({ id, isActive, reason }: { id: string; isActive: boolean; reason?: string }) => {
      await api.patch(`/admin/shops/${id}/active`, { isActive, reason: reason || undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'shops'] });
      setActionErr('');
      setPendingToggle(null);
      setToggleReason('');
      toast.success("Do'kon holati yangilandi");
    },
    onError: (e) => setActionErr(extractErrorMessage(e)),
  });

  const shops = shopsQuery.data?.items ?? [];
  const total = shopsQuery.data?.total ?? 0;

  const [exportErr, setExportErr] = useState('');
  const exportXlsx = useMutation({
    mutationFn: () => downloadFile('/admin/shops/export', 'dokonlar.xlsx', { search: submitted || undefined }),
    onError: (e) => setExportErr(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Tarmoq"
        title="Do'konlar"
        description="Platformadagi barcha do'konlar — qidirish va moderatsiya."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={exportXlsx.isPending} onClick={() => { setExportErr(''); exportXlsx.mutate(); }}>
              <Download className="size-3.5" /> {exportXlsx.isPending ? 'Yuklanmoqda…' : 'Eksport'}
            </Button>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setView('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-r border-border
                  ${view === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
                <List className="size-3.5" /> Ro&apos;yxat
              </button>
              <button
                type="button"
                onClick={() => setView('map')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors
                  ${view === 'map' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
                <MapPin className="size-3.5" /> Xarita
              </button>
            </div>
          </div>
        }
      />
      {exportErr && (
        <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{exportErr}</p>
      )}

      <form
        className="flex max-w-md items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setSubmitted(search.trim());
        }}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Do'kon nomi yoki manzili…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Qidirish
        </Button>
      </form>

      {actionErr && (
        <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{actionErr}</p>
      )}

      {view === 'map' ? (
        <Card className="overflow-hidden p-2">
          {mapShopsQuery.isLoading ? (
            <div className="flex h-[520px] items-center justify-center text-sm text-muted-foreground">Yuklanmoqda…</div>
          ) : mapShopsQuery.isError ? (
            <div className="flex h-[520px] items-center justify-center text-sm text-destructive">
              {extractErrorMessage(mapShopsQuery.error)} —{' '}
              <button className="underline ml-1" onClick={() => mapShopsQuery.refetch()}>qayta urinish</button>
            </div>
          ) : (
            <>
              <ShopsMap
                shops={(mapShopsQuery.data?.items ?? []).map((s): ShopPin => ({
                  id: s.id, name: s.name, address: s.address,
                  latitude: s.latitude, longitude: s.longitude, isActive: s.isActive,
                }))}
              />
              <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-green-600" /> Faol
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-600" /> O&apos;chirilgan
                </span>
                <span className="ml-auto">{(mapShopsQuery.data?.items ?? []).length} ta do&apos;kon</span>
              </div>
            </>
          )}
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Nomi</th>
                  <th className="px-5 py-3 font-semibold">Egasi</th>
                  <th className="px-5 py-3 font-semibold">Reyting</th>
                  <th className="px-5 py-3 font-semibold">Holat</th>
                  <th className="px-5 py-3 text-right font-semibold">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((s) => (
                  <Fragment key={s.id}>
                  <tr className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="max-w-xs truncate text-xs text-muted-foreground">{s.address}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {s.owner ? (
                        <>
                          <p className="text-foreground">{s.owner.name || '—'}</p>
                          <p className="text-xs">{s.owner.phone}</p>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {s.ratingAverage.toFixed(1)}
                        <span className="text-muted-foreground">({s.ratingCount})</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={s.isActive ? 'success' : 'danger'}>
                          {s.isActive ? 'Faol' : "O'chirilgan"}
                        </Badge>
                        {s.isActive ? (
                          <Badge variant={s.isOpenManual ? 'neutral' : 'warning'}>
                            {s.isOpenManual ? 'Ochiq' : 'Yopiq'}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedShopId(expandedShopId === s.id ? null : s.id)}>
                          <MessageSquareWarning className="size-4" />
                          Shikoyatlar
                          {expandedShopId === s.id ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          variant={s.isActive ? 'ghost' : 'outline'}
                          size="sm"
                          disabled={setActive.isPending}
                          onClick={() => { setActionErr(''); setToggleReason(''); setPendingToggle(s); }}>
                          {s.isActive ? (
                            <PowerOff className="size-4 text-destructive" />
                          ) : (
                            <Power className="size-4 text-success" />
                          )}
                          {s.isActive ? "O'chirish" : 'Faollashtirish'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedShopId === s.id ? (
                    <tr className="border-b border-border bg-muted/10 last:border-0">
                      <td colSpan={5} className="p-0">
                        <ShopComplaintsPanel shopId={s.id} />
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                ))}
                {shopsQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Yuklanmoqda…
                    </td>
                  </tr>
                ) : null}
                {shopsQuery.isError ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-destructive">
                      {extractErrorMessage(shopsQuery.error)} —{' '}
                      <button className="underline" onClick={() => shopsQuery.refetch()}>
                        qayta urinish
                      </button>
                    </td>
                  </tr>
                ) : null}
                {!shopsQuery.isLoading && !shopsQuery.isError && shops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Do&apos;kon topilmadi
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Card>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!pendingToggle}
        title={pendingToggle?.isActive ? "Do'konni o'chirish" : "Do'konni faollashtirish"}
        destructive={!!pendingToggle?.isActive}
        description={pendingToggle && (
          <div className="space-y-1">
            <p>Do&apos;kon: <span className="font-semibold text-foreground">{pendingToggle.name}</span></p>
            {pendingToggle.isActive && (
              <p className="mt-2 text-destructive">Mijozlarga endi ko&apos;rinmaydi va yangi buyurtma qabul qila olmaydi.</p>
            )}
          </div>
        )}
        confirmLabel={pendingToggle?.isActive ? "Ha, o'chirish" : 'Ha, faollashtirish'}
        pending={setActive.isPending}
        error={actionErr}
        onCancel={() => setPendingToggle(null)}
        onConfirm={() => pendingToggle && setActive.mutate({
          id: pendingToggle.id, isActive: !pendingToggle.isActive, reason: toggleReason.trim(),
        })}>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Sabab (ixtiyoriy, ichki eslatma)
        </label>
        <textarea
          value={toggleReason}
          onChange={(e) => setToggleReason(e.target.value)}
          placeholder="Nega bu o'zgarish qilinmoqda…"
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </ConfirmDialog>
    </div>
  );
}

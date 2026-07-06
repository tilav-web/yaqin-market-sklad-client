'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Filter, MapPin, Package, Store, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import type { ShopPin } from '@/components/admin/shops-map';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

const ShopsMap = dynamic(() => import('@/components/admin/shops-map'), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-xl bg-muted/30" />,
});

const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";
const fmt = (n: number) => n.toLocaleString('uz-UZ');
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISODate(d);
};
const pct = (num: number, den: number) => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : '—');

interface TopShop { shopId: string; shopName: string; orderCount: number; gmv: number }
interface TopProduct { productName: string; shopName: string; qtySold: number; revenue: number }
interface TimelinePoint { date: string; count: number; gmv: number }
interface GeoShop { id: string; name: string; address: string; latitude: number; longitude: number; isActive: boolean }
interface ShopsPageResponse { items: GeoShop[]; total: number }
interface FunnelResponse { from: string; to: string; productViews: number; addToCart: number; orders: number }

const GEO_LIMIT = 500;
const FUNNEL_PRESETS = [
  { label: '7 kun', days: 7 },
  { label: '30 kun', days: 30 },
  { label: '90 kun', days: 90 },
];

export default function AdminAnalyticsPage() {
  const shopsQ = useQuery<TopShop[]>({
    queryKey: ['admin-top-shops'],
    queryFn: async () => (await api.get('/admin/analytics/top-shops?limit=10')).data,
    refetchInterval: 60_000,
  });

  const productsQ = useQuery<TopProduct[]>({
    queryKey: ['admin-top-products'],
    queryFn: async () => (await api.get('/admin/analytics/top-products?limit=10')).data,
    refetchInterval: 60_000,
  });

  const timelineQ = useQuery<TimelinePoint[]>({
    queryKey: ['admin-timeline'],
    queryFn: async () => (await api.get('/admin/analytics/timeline?days=30')).data,
    refetchInterval: 60_000,
  });

  // Geographic distribution — GET /admin/shops already returns lat/lng per
  // shop (see admin/shops page), so this is real data, not fabricated.
  const geoQ = useQuery<ShopsPageResponse>({
    queryKey: ['admin', 'shops', 'map', ''],
    queryFn: async () => (await api.get('/admin/shops', { params: { limit: GEO_LIMIT, offset: 0 } })).data,
  });
  const geoShops = geoQ.data?.items ?? [];

  // Conversion funnel — date range defaults to the last 30 days, same window
  // as the rest of this page's fixed stats, but is adjustable here since the
  // funnel is the one aggregate that takes an explicit from/to.
  const [funnelFrom, setFunnelFrom] = useState(() => daysAgo(30));
  const [funnelTo, setFunnelTo] = useState(() => toISODate(new Date()));

  const funnelQ = useQuery<FunnelResponse>({
    queryKey: ['admin', 'analytics', 'funnel', funnelFrom, funnelTo],
    queryFn: async () =>
      (await api.get('/admin/analytics/funnel', { params: { from: funnelFrom, to: funnelTo } })).data,
  });

  const setFunnelPreset = (days: number) => {
    setFunnelTo(toISODate(new Date()));
    setFunnelFrom(daysAgo(days));
  };

  const timeline = timelineQ.data ?? [];
  const maxCount = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Analytics" description="So'nggi 30 kun statistikasi" />

      {/* Orders Timeline */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Buyurtmalar dinamikasi (30 kun)</h2>
        </div>
        {timelineQ.isLoading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Yuklanmoqda…</div>
        ) : timelineQ.isError ? (
          <div className="h-32 flex items-center justify-center text-destructive text-sm">
            {extractErrorMessage(timelineQ.error)} —{' '}
            <button className="underline ml-1" onClick={() => timelineQ.refetch()}>qayta urinish</button>
          </div>
        ) : timeline.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Ma'lumot yo'q</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[600px] h-40">
              {timeline.map((pt) => {
                const h = Math.max(4, Math.round((pt.count / maxCount) * 128));
                return (
                  <div key={pt.date} className="flex flex-col items-center gap-1 flex-1 group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
                        style={{ height: h }}
                        title={`${pt.date}: ${fmt(pt.count)} buyurtma, ${money(pt.gmv)}`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                      {pt.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Shops */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Top 10 do'kon (30 kun)</h2>
          </div>
          {shopsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
          ) : shopsQ.isError ? (
            <p className="text-sm text-destructive">
              {extractErrorMessage(shopsQ.error)} —{' '}
              <button className="underline" onClick={() => shopsQ.refetch()}>qayta urinish</button>
            </p>
          ) : (shopsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2">
              {(shopsQ.data ?? []).map((s, i) => (
                <div key={s.shopId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <span className="font-medium text-sm truncate">{s.shopName}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm font-semibold">{fmt(s.orderCount)} buyurtma</div>
                    <div className="text-xs text-muted-foreground">{money(s.gmv)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Products */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Top 10 mahsulot (30 kun)</h2>
          </div>
          {productsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
          ) : productsQ.isError ? (
            <p className="text-sm text-destructive">
              {extractErrorMessage(productsQ.error)} —{' '}
              <button className="underline" onClick={() => productsQ.refetch()}>qayta urinish</button>
            </p>
          ) : (productsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2">
              {(productsQ.data ?? []).map((p, i) => (
                <div key={`${p.productName}-${i}`} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{p.productName}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.shopName}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm font-semibold">{fmt(p.qtySold)} dona</div>
                    <div className="text-xs text-muted-foreground">{money(p.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Geographic distribution */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Geografik tarqalish</h2>
        </div>
        {geoQ.isLoading ? (
          <div className="h-[420px] flex items-center justify-center text-muted-foreground text-sm">Yuklanmoqda…</div>
        ) : geoQ.isError ? (
          <div className="h-[420px] flex items-center justify-center text-destructive text-sm">
            {extractErrorMessage(geoQ.error)} —{' '}
            <button className="underline ml-1" onClick={() => geoQ.refetch()}>qayta urinish</button>
          </div>
        ) : geoShops.length === 0 ? (
          <div className="h-[420px] flex items-center justify-center text-muted-foreground text-sm">Ma&apos;lumot yo&apos;q</div>
        ) : (
          <>
            <ShopsMap
              shops={geoShops.map((s): ShopPin => ({
                id: s.id, name: s.name, address: s.address,
                latitude: s.latitude, longitude: s.longitude, isActive: s.isActive,
              }))}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {geoShops.length} ta do&apos;kon joylashuvi — yashil nuqta faol, qizil nuqta o&apos;chirilgan do&apos;konni bildiradi.
            </p>
          </>
        )}
      </Card>

      {/* Conversion funnel */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Konversiya: ko&apos;rilgan → savat → buyurtma</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={funnelFrom}
              max={funnelTo}
              onChange={(e) => setFunnelFrom(e.target.value)}
              className="w-auto"
            />
            <span className="text-sm text-muted-foreground">—</span>
            <Input
              type="date"
              value={funnelTo}
              min={funnelFrom}
              max={toISODate(new Date())}
              onChange={(e) => setFunnelTo(e.target.value)}
              className="w-auto"
            />
            <div className="flex rounded-lg border border-border overflow-hidden">
              {FUNNEL_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setFunnelPreset(p.days)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-background hover:bg-muted border-r last:border-r-0 border-border transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {funnelQ.isLoading ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">Yuklanmoqda…</div>
        ) : funnelQ.isError ? (
          <div className="h-24 flex items-center justify-center text-destructive text-sm">
            {extractErrorMessage(funnelQ.error)} —{' '}
            <button className="underline ml-1" onClick={() => funnelQ.refetch()}>qayta urinish</button>
          </div>
        ) : !funnelQ.data || (funnelQ.data.productViews === 0 && funnelQ.data.addToCart === 0 && funnelQ.data.orders === 0) ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            Tanlangan davr uchun ma&apos;lumot yo&apos;q
          </div>
        ) : (
          (() => {
            const { productViews, addToCart, orders } = funnelQ.data;
            const stages = [
              { label: "Ko'rilgan", value: productViews },
              { label: 'Savatga qo\'shilgan', value: addToCart },
              { label: 'Buyurtma qilingan', value: orders },
            ];
            return (
              <>
                <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
                  {stages.map((stage, i) => (
                    <div key={stage.label} className="flex items-stretch gap-2 shrink-0">
                      <div className="min-w-[140px] rounded-xl border border-border bg-muted/20 px-4 py-3 text-center">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stage.label}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{fmt(stage.value)}</p>
                      </div>
                      {i < stages.length - 1 && (
                        <div className="flex flex-col items-center justify-center px-1 text-xs shrink-0">
                          <ChevronRight className="size-4 text-primary" />
                          <span className="font-semibold text-primary whitespace-nowrap">
                            {pct(stages[i + 1].value, stage.value)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Umumiy konversiya (ko&apos;rilgan → buyurtma): <span className="font-semibold text-foreground">{pct(orders, productViews)}</span>
                </p>
              </>
            );
          })()
        )}
      </Card>
    </div>
  );
}

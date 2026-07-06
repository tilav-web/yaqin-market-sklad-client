'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, MapPin, Package, Store, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

import { PageHeader } from '@/components/admin/page-header';
import type { ShopPin } from '@/components/admin/shops-map';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

const ShopsMap = dynamic(() => import('@/components/admin/shops-map'), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-xl bg-muted/30" />,
});

const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";
const fmt = (n: number) => n.toLocaleString('uz-UZ');

interface TopShop { shopId: string; shopName: string; orderCount: number; gmv: number }
interface TopProduct { productName: string; shopName: string; qtySold: number; revenue: number }
interface TimelinePoint { date: string; count: number; gmv: number }
interface GeoShop { id: string; name: string; address: string; latitude: number; longitude: number; isActive: boolean }
interface ShopsPageResponse { items: GeoShop[]; total: number }

const GEO_LIMIT = 500;

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

      {/* Conversion funnel — backend gap, see report */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Konversiya: ko&apos;rilgan → savat → buyurtma</h2>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Backend API hozircha yo&apos;q</p>
          <p className="mt-1">
            Bu funnel uchun mahsulot ko&apos;rish (view) va savatga qo&apos;shish (add-to-cart) hodisalarini
            qayd qiluvchi hech qanday jadval yoki modul serverda mavjud emas — faqat yakuniy buyurtmalar
            saqlanadi. Funnel ko&apos;rsatish uchun avval backendda event-tracking (masalan
            &nbsp;<code className="rounded bg-muted px-1">product_view_events</code> /{' '}
            <code className="rounded bg-muted px-1">cart_add_events</code>) qo&apos;shish kerak — soxta
            raqamlar bilan to&apos;ldirish o&apos;rniga bu yerda ochiq belgilab qo&apos;yildi.
          </p>
        </div>
      </Card>
    </div>
  );
}

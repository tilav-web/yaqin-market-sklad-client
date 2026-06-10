'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, Store, TrendingUp } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";
const fmt = (n: number) => n.toLocaleString('uz-UZ');

interface TopShop { shopId: string; shopName: string; orderCount: number; gmv: number }
interface TopProduct { productName: string; shopName: string; qtySold: number; revenue: number }
interface TimelinePoint { date: string; count: number; gmv: number }

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
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Package, ShoppingBag, Store, TrendingUp, Users } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalShops: number;
  totalOrders: number;
  ordersToday: number;
  orders7d: number;
  gmvTotal: number;
  gmv7d: number;
  pendingApplications: number;
}

const fmt = (n: number) => n.toLocaleString('uz-UZ');
const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'text-primary',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8">
        <Icon className={`size-5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await api.get('/admin/analytics/dashboard')).data,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
      </div>
    );
  }

  const d = data;
  if (!d) return null;

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" description="Platforma umumiy holati" />

      {d.pendingApplications > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            ⚠️ {d.pendingApplications} ta seller arizasi ko'rib chiqilishini kutmoqda
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Jami foydalanuvchilar"
          value={fmt(d.totalUsers)}
          icon={Users}
        />
        <StatCard
          label="Sellerlar"
          value={fmt(d.totalSellers)}
          sub={`${fmt(d.totalShops)} ta do'kon`}
          icon={Store}
        />
        <StatCard
          label="Jami buyurtmalar (yetkazilgan)"
          value={fmt(d.totalOrders)}
          sub={`Bugun: ${fmt(d.ordersToday)} · 7 kun: ${fmt(d.orders7d)}`}
          icon={ShoppingBag}
        />
        <StatCard
          label="Jami GMV"
          value={money(d.gmvTotal)}
          sub="Barcha vaqt"
          icon={TrendingUp}
          color="text-green-600"
        />
        <StatCard
          label="GMV (7 kun)"
          value={money(d.gmv7d)}
          sub="Oxirgi 7 kun"
          icon={BarChart3}
          color="text-green-600"
        />
        <StatCard
          label="Kutilayotgan arizalar"
          value={fmt(d.pendingApplications)}
          sub="Seller arizalari"
          icon={Package}
          color={d.pendingApplications > 0 ? 'text-amber-600' : 'text-primary'}
        />
      </div>
    </div>
  );
}

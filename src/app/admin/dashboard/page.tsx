'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, BarChart3, Bell, ClipboardList, CreditCard, History,
  Inbox, Package, ShoppingBag, Star, Store, TrendingUp, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/admin/page-header';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

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

interface TimelinePoint { date: string; count: number; gmv: number }

const fmt = (n: number) => n.toLocaleString('uz-UZ');
const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'text-primary',
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8">
        <Icon className={`size-5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href}>
        <Card className="flex items-start gap-4 p-5 transition-colors hover:bg-muted/40">{body}</Card>
      </Link>
    );
  }
  return <Card className="flex items-start gap-4 p-5">{body}</Card>;
}

const QUICK_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin/orders', label: 'Buyurtmalar', icon: ClipboardList },
  { href: '/admin/inquiries', label: 'Murojaatlar', icon: Inbox },
  { href: '/admin/balance', label: 'Balanslar', icon: Wallet },
  { href: '/admin/withdrawals', label: "Yechish so'rovlar", icon: CreditCard },
  { href: '/admin/prime', label: 'Prime obuna', icon: Star },
  { href: '/admin/notifications', label: 'Bildirishnomalar', icon: Bell },
  { href: '/admin/audit-log', label: 'Amallar tarixi', icon: History },
  { href: '/admin/debts', label: 'Qarzlar', icon: AlertTriangle },
];

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await api.get('/admin/analytics/dashboard')).data,
    refetchInterval: 60_000,
  });

  const timelineQ = useQuery<TimelinePoint[]>({
    queryKey: ['admin', 'dashboard', 'timeline'],
    queryFn: async () => (await api.get('/admin/analytics/timeline', { params: { days: 14 } })).data,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">
          {extractErrorMessage(error)} —{' '}
          <button className="underline" onClick={() => refetch()}>qayta urinish</button>
        </p>
      </div>
    );
  }

  const d = data;
  if (!d) return null;

  const timeline = timelineQ.data ?? [];
  const maxCount = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" description="Platforma umumiy holati" />

      {d.pendingApplications > 0 && (
        <Link href="/admin/applications">
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100">
            <p className="text-sm font-medium text-amber-800">
              ⚠️ {d.pendingApplications} ta seller arizasi ko&apos;rib chiqilishini kutmoqda
            </p>
          </div>
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Jami foydalanuvchilar"
          value={fmt(d.totalUsers)}
          icon={Users}
          href="/admin/users"
        />
        <StatCard
          label="Sellerlar"
          value={fmt(d.totalSellers)}
          sub={`${fmt(d.totalShops)} ta do'kon`}
          icon={Store}
          href="/admin/shops"
        />
        <StatCard
          label="Jami buyurtmalar (yetkazilgan)"
          value={fmt(d.totalOrders)}
          sub={`Bugun: ${fmt(d.ordersToday)} · 7 kun: ${fmt(d.orders7d)}`}
          icon={ShoppingBag}
          href="/admin/orders"
        />
        <StatCard
          label="Jami GMV"
          value={money(d.gmvTotal)}
          sub="Barcha vaqt"
          icon={TrendingUp}
          color="text-green-600"
          href="/admin/analytics"
        />
        <StatCard
          label="GMV (7 kun)"
          value={money(d.gmv7d)}
          sub="Oxirgi 7 kun"
          icon={BarChart3}
          color="text-green-600"
          href="/admin/analytics"
        />
        <StatCard
          label="Kutilayotgan arizalar"
          value={fmt(d.pendingApplications)}
          sub="Seller arizalari"
          icon={Package}
          color={d.pendingApplications > 0 ? 'text-amber-600' : 'text-primary'}
          href="/admin/applications"
        />
      </div>

      <Card className="mt-6 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Buyurtmalar dinamikasi (14 kun)</h2>
          </div>
          <Link href="/admin/analytics" className="text-xs text-primary underline">
            To&apos;liq analytics
          </Link>
        </div>
        {timelineQ.isLoading ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">Yuklanmoqda…</div>
        ) : timeline.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</div>
        ) : (
          <div className="flex h-24 items-end gap-1.5">
            {timeline.map((pt) => {
              const h = Math.max(4, Math.round((pt.count / maxCount) * 80));
              return (
                <div key={pt.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-colors hover:bg-primary"
                    style={{ height: h }}
                    title={`${pt.date}: ${fmt(pt.count)} buyurtma, ${money(pt.gmv)}`}
                  />
                  <span className="text-[9px] text-muted-foreground">{pt.date.slice(8)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Tezkor havolalar</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:bg-muted/40">
              <l.icon className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{l.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

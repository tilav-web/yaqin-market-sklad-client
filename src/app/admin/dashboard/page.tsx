'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  FolderTree,
  Inbox,
  Package,
  ReceiptText,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { ExecutiveActionHub } from '@/components/admin/executive-action-hub';
import { PageHeader } from '@/components/admin/page-header';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';

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
  commissionRate?: number;
  platformRevenue?: number;
  estimatedTax?: number;
  netProfit?: number;
  platformRevenue7d?: number;
  netProfit7d?: number;
}

interface TimelinePoint {
  date: string;
  count: number;
  gmv: number;
}

const fmt = (n: number) => n.toLocaleString('uz-UZ');
const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  badge,
  badgeType = 'neutral',
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'primary' | 'neutral';
  href?: string;
}) {
  const badgeStyles = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
    neutral: 'bg-muted text-muted-foreground border-border',
  };

  const body = (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-primary/40 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs group-hover:scale-105 transition-transform">
          <Icon className="size-6" />
        </div>
        {badge && (
          <span className={cn('text-[0.68rem] font-bold px-2 py-0.5 rounded-full border', badgeStyles[badgeType])}>
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground font-medium">{sub}</p>}
      </div>

      {href && (
        <div className="mt-3 flex items-center gap-1 text-[0.75rem] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Batafsil ko&apos;rish <ArrowUpRight className="size-3.5" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{body}</Link>;
  }
  return body;
}

const CORE_HUBS = [
  {
    title: "Savdo & Do'konlar",
    desc: 'Do\'konlar, arizalar, buyurtmalar va katalog',
    icon: Store,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    links: [
      { label: 'Do\'kon arizalari', href: '/admin/applications', icon: FileText },
      { label: 'Buyurtmalar', href: '/admin/orders', icon: ClipboardList },
      { label: 'Do\'konlar', href: '/admin/shops', icon: Store },
      { label: 'Global katalog', href: '/admin/catalog', icon: BookOpen },
    ],
  },
  {
    title: 'Moliya & Soliq',
    desc: 'Balanslar, pul yechish, qarzlar va cheklar',
    icon: Wallet,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    links: [
      { label: 'Balanslar', href: '/admin/balance', icon: Wallet },
      { label: 'Pul yechish', href: '/admin/withdrawals', icon: CreditCard },
      { label: 'Qarzlar', href: '/admin/debts', icon: AlertTriangle },
      { label: 'Soliq / Cheklar', href: '/admin/fiscal', icon: ReceiptText },
    ],
  },
  {
    title: 'Mijozlar & CRM',
    desc: 'Foydalanuvchilar, murojaatlar va sharhlar',
    icon: Users,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    links: [
      { label: 'Foydalanuvchilar', href: '/admin/users', icon: Users },
      { label: 'Murojaatlar', href: '/admin/inquiries', icon: Inbox },
      { label: 'Shikoyatlar', href: '/admin/complaints', icon: AlertTriangle },
      { label: 'Sharhlar', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'Xavfsizlik & Tizim',
    desc: 'Anti-fraud, xodimlar, sozlamalar va loglar',
    icon: ShieldAlert,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    links: [
      { label: 'Xavf signallari', href: '/admin/risk', icon: ShieldAlert },
      { label: 'Xodimlar', href: '/admin/staff', icon: UserCheck },
      { label: 'Sozlamalar', href: '/admin/settings', icon: Settings },
      { label: 'Kategoriyalar', href: '/admin/categories', icon: FolderTree },
    ],
  },
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
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="size-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">Dashboard statistikasi yuklanmoqda…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-sm font-medium text-destructive">{extractErrorMessage(error)}</p>
        <button
          onClick={() => refetch()}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
          Qayta urinish
        </button>
      </div>
    );
  }

  const d = data;
  if (!d) return null;

  const timeline = timelineQ.data ?? [];
  const maxCount = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Boshqaruv Paneli"
        description="Yaqin Market platformasining jonli holati, asosiy ko'rsatkichlari va operatsion markazlari"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/analytics"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:border-primary/40 hover:bg-muted/50 transition-all">
              <BarChart3 className="size-3.5 text-primary" />
              To&apos;liq Analitika
            </Link>
          </div>
        }
      />

      {/* Executive Action & Attention Hub */}
      <ExecutiveActionHub />

      {/* Platform Financial & Net Profit Highlight Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/5 p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">
                  Operator Sof Foydasi va Moliyaviy Tushum
                </h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  AOS (4% soliq hisobi)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Soliq Kodeksining 463-moddasiga binoan faqat {d.commissionRate ?? 12}% vositachilik komissiyasidan 4% aylanma solig&apos;i chegirilgan holdagi sof tushum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/balance"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all">
              <DollarSign className="size-3.5 text-emerald-600" />
              Balans & Hisob-kitob
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-background/80 p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Sof Foyda (Net Profit)
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {money(d.netProfit ?? 0)}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Oxirgi 7 kunda: <strong className="text-foreground">{money(d.netProfit7d ?? 0)}</strong>
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/80 p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Platforma Komissiyasi ({d.commissionRate ?? 12}%)
            </span>
            <span className="text-2xl font-extrabold text-foreground mt-1 block">
              {money(d.platformRevenue ?? 0)}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Umumiy GMV aylanmadan xizmat haqi
            </span>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
              Davlatga Soliq Zaxirasi (AOS 4%)
            </span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
              {money(d.estimatedTax ?? 0)}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Komissiyadan 4% soliq to&apos;lovi uchun
            </span>
          </div>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Jami GMV Savdo"
          value={money(d.gmvTotal)}
          sub="Platforma bo'yicha jami savdo aylanmasi"
          icon={TrendingUp}
          badge="Jami Savdo"
          badgeType="success"
          href="/admin/analytics"
        />
        <StatCard
          label="7 Kunlik Savdo (GMV)"
          value={money(d.gmv7d)}
          sub={`Oxirgi 7 kunda ${fmt(d.orders7d)} ta buyurtma`}
          icon={BarChart3}
          badge="Haftalik"
          badgeType="primary"
          href="/admin/analytics"
        />
        <StatCard
          label="Jami Yetkazilgan Buyurtmalar"
          value={fmt(d.totalOrders)}
          sub={`Bugungi buyurtmalar: ${fmt(d.ordersToday)} ta`}
          icon={ShoppingBag}
          badge={`Bugun: +${fmt(d.ordersToday)}`}
          badgeType="primary"
          href="/admin/orders"
        />
        <StatCard
          label="Faol Do'konlar"
          value={fmt(d.totalShops)}
          sub={`${fmt(d.totalSellers)} ta ro'yxatdan o'tgan seller`}
          icon={Store}
          badge="Tarmoq"
          badgeType="neutral"
          href="/admin/shops"
        />
        <StatCard
          label="Foydalanuvchilar"
          value={fmt(d.totalUsers)}
          sub="Xaridorlar va platforma mijozlari"
          icon={Users}
          badge="Mijozlar"
          badgeType="neutral"
          href="/admin/users"
        />
        <StatCard
          label="Kutilayotgan Arizalar"
          value={fmt(d.pendingApplications)}
          sub="Yangi sotuvchilar arizalari"
          icon={Package}
          badge={d.pendingApplications > 0 ? 'Kutilmoqda' : 'Hammasi faol'}
          badgeType={d.pendingApplications > 0 ? 'warning' : 'success'}
          href="/admin/applications"
        />
      </div>

      {/* 14-Day Timeline Chart Card */}
      <Card className="rounded-2xl border border-border/80 p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">14 Kunlik Buyurtmalar Dinamikasi</h3>
              <p className="text-xs text-muted-foreground">Kuni bo&apos;yicha buyurtmalar soni va savdo hajmi</p>
            </div>
          </div>
          <Link
            href="/admin/analytics"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            Batafsil analitika →
          </Link>
        </div>

        {timelineQ.isLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            Grafik ma&apos;lumotlari yuklanmoqda…
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            Oxirgi 14 kunda ma&apos;lumot mavjud emas
          </div>
        ) : (
          <div className="mt-2 flex h-36 items-end gap-2 sm:gap-3 pt-4">
            {timeline.map((pt) => {
              const h = Math.max(8, Math.round((pt.count / maxCount) * 100));
              return (
                <div key={pt.date} className="group relative flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[0.65rem] font-bold text-background shadow-md">
                    {pt.date}: {fmt(pt.count)} ta ({money(pt.gmv)})
                  </div>

                  <div
                    className="w-full rounded-t-lg bg-primary/70 group-hover:bg-primary transition-all duration-200"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[0.65rem] font-medium text-muted-foreground group-hover:text-foreground">
                    {pt.date.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 4 Core Operational Hubs Grid */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Operatsion Boshqaruv Markazlari
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CORE_HUBS.map((hub) => {
            const Icon = hub.icon;
            return (
              <Card key={hub.title} className="rounded-2xl border border-border/80 p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-xl border', hub.color)}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{hub.title}</h4>
                      <p className="text-[0.68rem] text-muted-foreground truncate">{hub.desc}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    {hub.links.map((link) => {
                      const LinkIcon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors group">
                          <span className="flex items-center gap-2 truncate">
                            <LinkIcon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            {link.label}
                          </span>
                          <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

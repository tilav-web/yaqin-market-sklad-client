'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  FolderTree,
  HandCoins,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  ReceiptText,
  Search,
  Settings,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CommandPalette } from '@/components/admin/command-palette';
import { NotificationPopover } from '@/components/admin/notification-popover';
import { QuickActionsMenu } from '@/components/admin/quick-actions-menu';
import { SystemHealthModal } from '@/components/admin/system-health-modal';
import { Toaster } from '@/components/admin/toaster';
import { Button } from '@/components/ui/button';
import { api, tokenStore } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useEscapeKey } from '@/lib/use-escape-key';

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'support'
  | 'finance'
  | 'content_manager';

export interface MeAdmin {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
}

export const ROLE_LABELS: Record<AdminRole, { label: string; color: string; badge: string }> = {
  super_admin: { label: 'Super Admin', color: 'text-red-500 bg-red-500/10 border-red-500/20', badge: 'bg-red-500 text-white' },
  admin: { label: 'Administrator', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', badge: 'bg-blue-500 text-white' },
  moderator: { label: 'Moderator', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', badge: 'bg-purple-500 text-white' },
  support: { label: 'Qo\'llab-quvvatlash', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', badge: 'bg-emerald-500 text-white' },
  finance: { label: 'Buxgalter / Moliya', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500 text-white' },
  content_manager: { label: 'Kontent Menejer', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', badge: 'bg-cyan-500 text-white' },
};

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
  allowedRoles?: AdminRole[];
}

interface NavHub {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  items: NavItem[];
}

const NAV_HUBS: NavHub[] = [
  {
    id: 'overview',
    title: 'Umumiy Boshqaruv',
    icon: LayoutDashboard,
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
      { href: '/admin/analytics', label: 'Analitika & Tahlil', icon: TrendingUp, allowedRoles: ['super_admin', 'admin', 'finance'] },
    ],
  },
  {
    id: 'marketplace',
    title: 'Savdo & Do\'konlar',
    icon: Store,
    items: [
      { href: '/admin/applications', label: 'Do\'kon arizalari', icon: FileText, badgeKey: 'applicationsPending', allowedRoles: ['super_admin', 'admin', 'moderator'] },
      { href: '/admin/shops', label: 'Do\'konlar tarmog\'i', icon: Store, allowedRoles: ['super_admin', 'admin', 'moderator'] },
      { href: '/admin/orders', label: 'Buyurtmalar oqimi', icon: ClipboardList, allowedRoles: ['super_admin', 'admin', 'moderator', 'support'] },
      { href: '/admin/catalog', label: 'Global katalog', icon: BookOpen, allowedRoles: ['super_admin', 'admin', 'moderator', 'content_manager'] },
      { href: '/admin/categories', label: 'Kategoriyalar', icon: FolderTree, allowedRoles: ['super_admin', 'admin', 'moderator', 'content_manager'] },
    ],
  },
  {
    id: 'finance',
    title: 'Moliya & Soliq',
    icon: Wallet,
    items: [
      { href: '/admin/balance', label: 'Balans & Hamyonlar', icon: Wallet, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/withdrawals', label: 'Pul yechish (Payouts)', icon: CreditCard, badgeKey: 'withdrawalsPending', allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/debts', label: 'Komissiya qarzlari', icon: AlertTriangle, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/payables', label: 'Do\'kon majburiyatlari', icon: HandCoins, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/prime', label: 'Prime VIP obuna', icon: Star, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/fiscal', label: 'Soliq & Fiskal cheklar', icon: ReceiptText, allowedRoles: ['super_admin', 'admin', 'finance'] },
    ],
  },
  {
    id: 'crm',
    title: 'Mijozlar & Xizmatlar',
    icon: Users,
    items: [
      { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users, allowedRoles: ['super_admin', 'admin', 'support'] },
      { href: '/admin/inquiries', label: 'Murojaatlar', icon: Inbox, badgeKey: 'contactUnread', allowedRoles: ['super_admin', 'admin', 'support'] },
      { href: '/admin/complaints', label: 'Shikoyatlar', icon: MessageSquareWarning, badgeKey: 'complaintsOpen', allowedRoles: ['super_admin', 'admin', 'support'] },
      { href: '/admin/reviews', label: 'Sharhlar & Baholar', icon: Star, allowedRoles: ['super_admin', 'admin', 'moderator'] },
    ],
  },
  {
    id: 'system',
    title: 'Xavfsizlik & Tizim',
    icon: ShieldAlert,
    items: [
      { href: '/admin/risk', label: 'Xavf signallari', icon: ShieldAlert, badgeKey: 'riskOpen', allowedRoles: ['super_admin', 'admin', 'moderator'] },
      { href: '/admin/staff', label: 'Xodimlar & Rollar', icon: UserCheck, allowedRoles: ['super_admin', 'admin'] },
      { href: '/admin/notifications', label: 'Bildirishnomalar', icon: Bell, allowedRoles: ['super_admin', 'admin'] },
      { href: '/admin/releases', label: 'Ilova versiyalari', icon: Smartphone, allowedRoles: ['super_admin', 'admin'] },
      { href: '/admin/audit-log', label: 'Amallar tarixi', icon: History, allowedRoles: ['super_admin', 'admin'] },
      { href: '/admin/settings', label: 'Tizim sozlamalari', icon: Settings, badgeKey: 'settingsWarning', allowedRoles: ['super_admin'] },
    ],
  },
];

function NavHubsRenderer({
  pathname,
  badgeCounts,
  role,
  onNavigate,
}: {
  pathname: string;
  badgeCounts: Record<string, number>;
  role: AdminRole;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-4">
      {NAV_HUBS.map((hub) => {
        const visibleItems = hub.items.filter((item) => {
          if (role === 'super_admin') return true;
          if (!item.allowedRoles) return true;
          return item.allowedRoles.includes(role);
        });

        if (visibleItems.length === 0) return null;

        const isHubActive = visibleItems.some((item) => pathname.startsWith(item.href));

        return (
          <div key={hub.id} className="space-y-1">
            <div className="flex items-center justify-between px-3 py-1">
              <span className={cn(
                'text-[0.68rem] font-bold uppercase tracking-[0.14em]',
                isHubActive ? 'text-primary' : 'text-muted-foreground/80',
              )}>
                {hub.title}
              </span>
            </div>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-bold'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                    )}>
                    <Icon className={cn(
                      'size-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary',
                    )} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badgeKey === 'settingsWarning' && badge > 0 ? (
                      <span className="flex size-4.5 items-center justify-center rounded-full bg-amber-500 text-white text-[0.65rem] font-bold shadow-xs animate-pulse">
                        !
                      </span>
                    ) : badge > 0 ? (
                      <span className={cn(
                        'flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[0.62rem] font-bold',
                        isActive ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground',
                      )}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [systemHealthOpen, setSystemHealthOpen] = useState(false);

  useEffect(() => {
    // Keyboard shortcut for Ctrl+K or Cmd+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEscapeKey(mobileNavOpen, () => setMobileNavOpen(false));

  const meQuery = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const res = await api.get<MeAdmin>('/admin/auth/me');
      return res.data;
    },
    enabled: Boolean(tokenStore.access),
    retry: false,
  });

  const admin = meQuery.data;

  const contactUnreadQuery = useQuery({
    queryKey: ['admin', 'contact-unread'],
    queryFn: async () => (await api.get<number>('/admin/contact/unread-count')).data,
    enabled: Boolean(tokenStore.access && admin),
    refetchInterval: 60_000,
  });

  const complaintsOpenQuery = useQuery({
    queryKey: ['admin', 'complaints-open-count'],
    queryFn: async () => (await api.get<number>('/admin/complaints/open-count')).data,
    enabled: Boolean(tokenStore.access && admin),
    refetchInterval: 60_000,
  });

  const riskOpenQuery = useQuery({
    queryKey: ['admin', 'risk', 'open-count'],
    queryFn: async () => (await api.get<number>('/admin/risk/flags/open-count')).data,
    enabled: Boolean(tokenStore.access && admin),
    refetchInterval: 60_000,
  });

  const applicationsPendingQuery = useQuery({
    queryKey: ['admin', 'applications-pending-count'],
    queryFn: async () => {
      try {
        const res = await api.get<{ total: number }>('/admin/sellers/applications', { params: { status: 'submitted', limit: 1 } });
        return res.data.total;
      } catch {
        return 0;
      }
    },
    enabled: Boolean(tokenStore.access && admin),
    refetchInterval: 60_000,
  });

  const withdrawalsPendingQuery = useQuery({
    queryKey: ['admin', 'withdrawals-pending-count'],
    queryFn: async () => {
      try {
        const res = await api.get<{ total: number }>('/admin/balance/withdrawals', { params: { status: 'pending', limit: 1 } });
        return res.data.total;
      } catch {
        return 0;
      }
    },
    enabled: Boolean(tokenStore.access && admin),
    refetchInterval: 60_000,
  });

  const settingsWarningQuery = useQuery({
    queryKey: ['admin', 'settings-warning-count'],
    queryFn: async () => {
      try {
        const res = await api.get<Array<{ key: string; value: string }>>('/admin/settings');
        const didox = res.data.find((s) => s.key === 'didox_user_key')?.value;
        const stir = res.data.find((s) => s.key === 'platform_stir')?.value;
        return !didox || !stir ? 1 : 0;
      } catch {
        return 0;
      }
    },
    enabled: Boolean(tokenStore.access && admin?.role === 'super_admin'),
    refetchInterval: 60_000,
  });

  const badgeCounts: Record<string, number> = {
    contactUnread: contactUnreadQuery.data ?? 0,
    complaintsOpen: complaintsOpenQuery.data ?? 0,
    riskOpen: riskOpenQuery.data ?? 0,
    applicationsPending: applicationsPendingQuery.data ?? 0,
    withdrawalsPending: withdrawalsPendingQuery.data ?? 0,
    settingsWarning: settingsWarningQuery.data ?? 0,
  };

  useEffect(() => {
    if (!tokenStore.access) {
      router.replace('/login');
      return;
    }
    if (meQuery.isError) {
      tokenStore.clear();
      router.replace('/login');
    }
  }, [meQuery.isError, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !tokenStore.access) return null;

  if (meQuery.isLoading || !admin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground font-medium">
        <div className="size-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p>Boshqaruv paneli yuklanmoqda…</p>
      </div>
    );
  }

  const logout = () => {
    tokenStore.clear();
    router.replace('/login');
  };

  const roleMeta = ROLE_LABELS[admin.role] || { label: admin.role, color: 'text-muted-foreground bg-muted border-border', badge: 'bg-muted text-foreground' };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <Toaster />
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <SystemHealthModal open={systemHealthOpen} onClose={() => setSystemHealthOpen(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar shrink-0 shadow-sm select-none">
        {/* Brand Header with Real Yaqin Market Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="relative size-10 rounded-xl overflow-hidden shadow-sm border border-primary/20 bg-card p-1 flex items-center justify-center group-hover:border-primary/40 transition-all">
              <Image
                src="/logo.png"
                alt="Yaqin Market Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-foreground">
                  Yaqin<span className="text-primary">Market</span>
                </span>
                <span className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                  Admin
                </span>
              </div>
              <p className="text-[0.65rem] text-muted-foreground font-medium">Boshqaruv Tizimi</p>
            </div>
          </Link>
        </div>

        {/* Navigation Hubs */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5 custom-scrollbar">
          <NavHubsRenderer pathname={pathname} badgeCounts={badgeCounts} role={admin.role} />
        </div>

        {/* User Footer with Profile Details */}
        <div className="border-t border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2.5 rounded-xl bg-card border border-border p-2.5 shadow-sm">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary font-bold text-xs text-primary-foreground shadow-sm">
              {admin.firstName?.[0] || 'A'}
              {admin.lastName?.[0] || 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground leading-tight">
                {admin.firstName} {admin.lastName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={cn('text-[0.6rem] px-1.5 py-0.2 rounded font-semibold border', roleMeta.color)}>
                  {roleMeta.label}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={logout}
              title="Chiqish">
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-150">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative flex w-72 flex-col bg-sidebar border-r border-border p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg overflow-hidden border border-primary/20 p-0.5 bg-card flex items-center justify-center">
                  <Image src="/logo.png" alt="Yaqin Market" width={28} height={28} className="object-contain" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-foreground">
                    Yaqin<span className="text-primary">Market</span>
                  </span>
                  <p className="text-[0.65rem] text-muted-foreground">Admin Panel</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setMobileNavOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <NavHubsRenderer
                pathname={pathname}
                badgeCounts={badgeCounts}
                role={admin.role}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>

            <div className="border-t border-border pt-3 mt-auto">
              <Button
                variant="outline"
                className="w-full justify-center text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={logout}>
                <LogOut className="mr-2 size-3.5" /> Chiqish
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Modern Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-4 md:px-6 shrink-0 z-10 gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-9 rounded-xl border border-border"
              onClick={() => setMobileNavOpen(true)}>
              <Menu className="size-4" />
            </Button>

            {/* Quick Command Palette Trigger Button */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 px-3 py-1.5 text-xs text-muted-foreground transition-all shadow-xs w-48 sm:w-72">
              <Search className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Tezkor qidiruv...</span>
              <kbd className="ml-auto hidden sm:inline-flex items-center rounded border border-border bg-card px-1.5 py-0.5 text-[0.65rem] font-mono font-bold text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live System Status Indicator (Clickable Health Inspector) */}
            <button
              type="button"
              onClick={() => setSystemHealthOpen(true)}
              className={cn(
                'hidden lg:flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.7rem] font-bold transition-all hover:scale-105 shadow-xs cursor-pointer',
                badgeCounts.settingsWarning > 0
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              )}>
              <span
                className={cn(
                  'size-2 rounded-full animate-pulse',
                  badgeCounts.settingsWarning > 0 ? 'bg-amber-500' : 'bg-emerald-500',
                )}
              />
              {badgeCounts.settingsWarning > 0 ? 'Sozlash zarur' : 'Tizim faol'}
            </button>

            {/* Quick Actions Menu (+ Yangi) */}
            <QuickActionsMenu />

            {/* Notification Center Popover */}
            <NotificationPopover
              counts={{
                applications: badgeCounts.applicationsPending,
                complaints: badgeCounts.complaintsOpen,
                risk: badgeCounts.riskOpen,
                inquiries: badgeCounts.contactUnread,
              }}
            />

            {/* Current Admin Role Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <div className="text-right">
                <p className="text-xs font-bold leading-tight">{admin.firstName}</p>
                <p className="text-[0.65rem] text-muted-foreground font-mono">@{admin.username}</p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                {admin.firstName?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

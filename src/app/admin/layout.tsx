'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  FolderTree,
  HandCoins,
  History,
  Inbox,
  LogOut,
  Menu,
  MessageSquareWarning,
  ReceiptText,
  Settings,
  ShieldAlert,
  Smartphone,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export const ROLE_LABELS: Record<AdminRole, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  admin: { label: 'Administrator', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  moderator: { label: 'Moderator', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  support: { label: 'Qo\'llab-quvvatlash', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  finance: { label: 'Buxgalter / Moliya', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  content_manager: { label: 'Kontent Menejer', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
};

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
  allowedRoles?: AdminRole[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Boshqaruv',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
      { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp, allowedRoles: ['super_admin', 'admin', 'finance'] },
    ],
  },
  {
    title: 'Onboarding',
    items: [
      { href: '/admin/applications', label: "Do'kon arizalari", icon: FileText, allowedRoles: ['super_admin', 'admin', 'moderator'] },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { href: '/admin/categories', label: 'Kategoriyalar', icon: FolderTree, allowedRoles: ['super_admin', 'admin', 'moderator', 'content_manager'] },
      { href: '/admin/catalog', label: 'Global katalog', icon: BookOpen, allowedRoles: ['super_admin', 'admin', 'moderator', 'content_manager'] },
    ],
  },
  {
    title: 'Tarmoq',
    items: [
      { href: '/admin/shops', label: "Do'konlar", icon: Store, allowedRoles: ['super_admin', 'admin', 'moderator'] },
      { href: '/admin/orders', label: 'Buyurtmalar', icon: ClipboardList, allowedRoles: ['super_admin', 'admin', 'moderator', 'support'] },
      { href: '/admin/complaints', label: 'Shikoyatlar', icon: MessageSquareWarning, badgeKey: 'complaintsOpen', allowedRoles: ['super_admin', 'admin', 'support'] },
    ],
  },
  {
    title: 'Moliya',
    items: [
      { href: '/admin/balance', label: 'Balanslar', icon: Wallet, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/withdrawals', label: 'Yechish so\'rovlar', icon: CreditCard, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/debts', label: 'Qarzlar', icon: AlertTriangle, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/payables', label: "Do'kon majburiyatlari", icon: HandCoins, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/prime', label: 'Prime obuna', icon: Star, allowedRoles: ['super_admin', 'admin', 'finance'] },
      { href: '/admin/fiscal', label: 'Soliq / Cheklar', icon: ReceiptText, allowedRoles: ['super_admin', 'admin', 'finance'] },
    ],
  },
  {
    title: 'Foydalanuvchilar',
    items: [
      { href: '/admin/users', label: 'Mijoz va Sellerlar', icon: Users, allowedRoles: ['super_admin', 'admin', 'support'] },
      { href: '/admin/inquiries', label: 'Murojaatlar', icon: Inbox, badgeKey: 'contactUnread', allowedRoles: ['super_admin', 'admin', 'support'] },
    ],
  },
  {
    title: 'Xavfsizlik',
    items: [
      { href: '/admin/risk', label: 'Xavf signallari', icon: ShieldAlert, badgeKey: 'riskOpen', allowedRoles: ['super_admin', 'admin', 'moderator'] },
      { href: '/admin/reviews', label: 'Sharhlar', icon: Star, allowedRoles: ['super_admin', 'admin', 'moderator'] },
    ],
  },
  {
    title: 'Xodimlar & Tizim',
    items: [
      { href: '/admin/staff', label: 'Xodimlar (Staff)', icon: UserCheck, allowedRoles: ['super_admin', 'admin'] },
      { href: '/admin/notifications', label: 'Bildirishnomalar', icon: Bell, allowedRoles: ['super_admin', 'admin'] },
      { href: '/admin/releases', label: 'Ilova versiyalari', icon: Smartphone, allowedRoles: ['super_admin', 'admin'] },
      { href: '/admin/audit-log', label: 'Amallar tarixi', icon: History, allowedRoles: ['super_admin', 'admin'] },
      { href: '/admin/settings', label: 'Sozlamalar', icon: Settings, allowedRoles: ['super_admin'] },
    ],
  },
];

function NavGroups({
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
    <>
      {NAV_GROUPS.map((group) => {
        // Filter items by role (SuperAdmin sees all, others see items where their role is included or allowedRoles is omitted)
        const visibleItems = group.items.filter((item) => {
          if (role === 'super_admin') return true;
          if (!item.allowedRoles) return true;
          return item.allowedRoles.includes(role);
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.title} className="mb-4">
            <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {group.title}
            </p>
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent',
                    )}>
                    <item.icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-bold text-primary-foreground">
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
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => setMobileNavOpen(false), [pathname]);
  useEscapeKey(mobileNavOpen, () => setMobileNavOpen(false));

  const meQuery = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const res = await api.get<MeAdmin>('/admin/auth/me');
      return res.data;
    },
    enabled: !!tokenStore.access,
    retry: false,
  });

  const admin = meQuery.data;

  const contactUnreadQuery = useQuery({
    queryKey: ['admin', 'contact-unread'],
    queryFn: async () => (await api.get<number>('/admin/contact/unread-count')).data,
    enabled: !!tokenStore.access && !!admin,
    refetchInterval: 60_000,
  });

  const complaintsOpenQuery = useQuery({
    queryKey: ['admin', 'complaints-open-count'],
    queryFn: async () => (await api.get<number>('/admin/complaints/open-count')).data,
    enabled: !!tokenStore.access && !!admin,
    refetchInterval: 60_000,
  });

  const riskOpenQuery = useQuery({
    queryKey: ['admin', 'risk', 'open-count'],
    queryFn: async () => (await api.get<number>('/admin/risk/flags/open-count')).data,
    enabled: !!tokenStore.access && !!admin,
    refetchInterval: 60_000,
  });

  const badgeCounts: Record<string, number> = {
    contactUnread: contactUnreadQuery.data ?? 0,
    complaintsOpen: complaintsOpenQuery.data ?? 0,
    riskOpen: riskOpenQuery.data ?? 0,
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

  if (!mounted || !tokenStore.access) return null;

  if (meQuery.isLoading || !admin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground font-medium">
        Xodim profili tekshirilmoqda…
      </div>
    );
  }

  const logout = () => {
    tokenStore.clear();
    router.replace('/login');
  };

  const roleMeta = ROLE_LABELS[admin.role] || { label: admin.role, color: 'bg-muted text-foreground' };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Toaster />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar shrink-0">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shadow-sm">
            Y
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Yaqin Market</h2>
            <p className="text-[0.7rem] text-muted-foreground font-medium">Boshqaruv Paneli</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
          <NavGroups pathname={pathname} badgeCounts={badgeCounts} role={admin.role} />
        </div>

        {/* User Footer in Sidebar */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs uppercase">
              {admin.firstName[0]}
              {admin.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {admin.firstName} {admin.lastName}
              </p>
              <p className="truncate text-[0.65rem] text-muted-foreground font-mono">
                @{admin.username}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={logout}
              title="Chiqish">
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative flex w-72 flex-col bg-sidebar border-r border-border p-4 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                  Y
                </div>
                <span className="font-bold text-sm">Yaqin Market</span>
              </div>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setMobileNavOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavGroups
                pathname={pathname}
                badgeCounts={badgeCounts}
                role={admin.role}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
            <div className="border-t border-border pt-3 mt-auto">
              <Button variant="outline" className="w-full justify-start text-xs font-medium" onClick={logout}>
                <LogOut className="mr-2 size-3.5" /> Chiqish
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-8"
              onClick={() => setMobileNavOpen(true)}>
              <Menu className="size-4" />
            </Button>
            <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-semibold', roleMeta.color)}>
              {roleMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold leading-none">
                {admin.firstName} {admin.lastName}
              </p>
              <p className="text-[0.65rem] text-muted-foreground font-mono mt-0.5">
                @{admin.username}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 text-muted-foreground hover:text-destructive"
              onClick={logout}>
              <LogOut className="size-3.5 mr-1.5" /> Chiqish
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}

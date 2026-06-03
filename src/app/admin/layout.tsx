'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, FileText, FolderTree, Inbox, LogOut, Smartphone, Store, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { api, tokenStore } from '@/lib/api';
import { cn } from '@/lib/cn';

interface MeUser {
  id: string;
  phone: string;
  name: string | null;
  isAdmin: boolean;
}

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin/applications', label: 'Seller arizalari', icon: FileText },
  { href: '/admin/categories', label: 'Kategoriyalar', icon: FolderTree },
  { href: '/admin/shops', label: "Do'konlar", icon: Store },
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
  { href: '/admin/notifications', label: 'Bildirishnomalar', icon: Bell },
  { href: '/admin/releases', label: 'Ilova versiyalari', icon: Smartphone },
  { href: '/admin/inquiries', label: 'Murojaatlar', icon: Inbox },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Cookies aren't available during SSR — wait for mount so the server and the
  // first client render agree (avoids a hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<MeUser>('/users/me');
      return res.data;
    },
    enabled: !!tokenStore.access,
    retry: false,
  });

  useEffect(() => {
    if (!tokenStore.access) {
      router.replace('/login');
      return;
    }
    // Session invalid (401 survived the refresh interceptor) → bounce to login.
    if (meQuery.isError) {
      tokenStore.clear();
      router.replace('/login');
      return;
    }
    if (meQuery.data && !meQuery.data.isAdmin) {
      alert('Admin huquqi kerak');
      tokenStore.clear();
      router.replace('/login');
    }
  }, [meQuery.data, meQuery.isError, router]);

  if (!mounted || !tokenStore.access) return null;
  // Don't flash the panel before we've confirmed the user is an admin.
  if (meQuery.isLoading || !meQuery.data?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Yuklanmoqda…
      </div>
    );
  }

  const active = NAV_ITEMS.find((i) => pathname.startsWith(i.href));
  const logout = () => {
    tokenStore.clear();
    router.replace('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-primary-foreground shadow-sm">
            Y
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-sidebar-foreground">Yaqin Market</p>
            <p className="text-xs text-muted-foreground">Admin panel</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2">
          <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Boshqaruv
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent',
                  )}>
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 rounded-lg bg-sidebar-accent px-3 py-2">
            <p className="text-xs font-medium text-sidebar-foreground">
              {meQuery.data?.name ?? 'Admin'}
            </p>
            <p className="text-xs text-muted-foreground">{meQuery.data?.phone}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="size-4" />
            Chiqish
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Admin
            </p>
            <h2 className="text-sm font-semibold text-foreground">{active?.label ?? 'Panel'}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
              <span className="text-foreground">{meQuery.data?.name ?? 'Admin'}</span>
              <span className="h-3 w-px bg-border" />
              <span>{meQuery.data?.phone}</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={logout} className="md:hidden">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { api, tokenStore } from '@/lib/api';

interface MeUser {
  id: string;
  phone: string;
  name: string | null;
  isAdmin: boolean;
}

const NAV_ITEMS = [
  { href: '/admin/applications', label: 'Seller arizalari', icon: '📋' },
  { href: '/admin/categories', label: 'Kategoriyalar', icon: '🗂' },
  { href: '/admin/shops', label: 'Do\'konlar', icon: '🏪' },
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: '👤' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<MeUser>('/users/me');
      return res.data;
    },
    enabled: !!tokenStore.access,
  });

  useEffect(() => {
    if (!tokenStore.access) {
      router.replace('/login');
      return;
    }
    if (meQuery.data && !meQuery.data.isAdmin) {
      alert('Admin huquqi kerak');
      tokenStore.clear();
      router.replace('/login');
    }
  }, [meQuery.data, router]);

  if (!tokenStore.access) return null;

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-[#0046AD] text-white p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-[#E1251B] flex items-center justify-center text-[#0046AD] font-extrabold">
            Y
          </div>
          <div>
            <h1 className="font-bold">Yaqin Market</h1>
            <p className="text-xs opacity-70">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                  active
                    ? 'bg-white text-[#0046AD] font-semibold'
                    : 'hover:bg-[#003687] text-white'
                }`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/20 pt-4 mt-4">
          <p className="text-xs opacity-70 mb-2 px-2">{meQuery.data?.phone}</p>
          <button
            onClick={() => {
              tokenStore.clear();
              router.replace('/login');
            }}
            className="w-full px-3 py-2 rounded-md text-sm bg-[#E1251B] hover:bg-[#B81B14]">
            Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

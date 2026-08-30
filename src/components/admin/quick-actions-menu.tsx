'use client';

import {
  Bell,
  FileSpreadsheet,
  FolderPlus,
  Plus,
  Settings,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useEscapeKey } from '@/lib/use-escape-key';

export function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  useEscapeKey(isOpen, () => setIsOpen(false));

  const actions = [
    {
      title: 'Yangi kategoriya',
      desc: 'Katalogga yangi bo\'lim yoki toifa qo\'shish',
      href: '/admin/categories',
      icon: FolderPlus,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Katalog Excel import',
      desc: 'Mahsulotlar ro\'yxatini Excel orqali yuklash',
      href: '/admin/catalog',
      icon: FileSpreadsheet,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Xodim taklif qilish',
      desc: 'Admin yoki moderator uchun yangi ruxsat berish',
      href: '/admin/staff',
      icon: UserPlus,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'SMS / Push xabarnoma',
      desc: 'Foydalanuvchilarga xabarlar yuborish',
      href: '/admin/notifications',
      icon: Bell,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      title: 'Tizim sozlamalari',
      desc: 'Didox tokeni va komissiya foizlari',
      href: '/admin/settings',
      icon: Settings,
      color: 'text-rose-500 bg-rose-500/10',
    },
  ];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 gap-1.5 rounded-xl border-border bg-card px-3 text-xs font-semibold shadow-sm hover:border-primary/50 hover:bg-primary/5">
        <Plus className="size-3.5 text-primary" />
        <span className="hidden sm:inline">Yangi</span>
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-72 sm:w-80 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              Tezkor harakatlar
            </div>
            <div className="space-y-1">
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <Link
                    key={act.title}
                    href={act.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-muted/60">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${act.color} mt-0.5`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{act.title}</p>
                      <p className="text-[0.7rem] text-muted-foreground truncate">{act.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

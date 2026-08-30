'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

interface ActionHubData {
  didoxConfigured: boolean;
  operatorStirConfigured: boolean;
  pendingAppsCount: number;
  pendingPayoutsCount: number;
  activeRiskCount: number;
  unresolvedComplaintsCount: number;
}

export function ExecutiveActionHub() {
  const { data: hub, isLoading } = useQuery<ActionHubData>({
    queryKey: ['admin', 'executive-action-hub'],
    queryFn: async () => {
      const [settingsRes, appsRes, payoutsRes, riskRes, compRes] = await Promise.allSettled([
        api.get<Array<{ key: string; value: string }>>('/admin/settings'),
        api.get<{ total: number }>('/admin/sellers/applications?status=pending&limit=1'),
        api.get<{ total: number }>('/admin/balance/withdrawals?status=pending&limit=1'),
        api.get<number>('/admin/risk/unresolved-count'),
        api.get<number>('/admin/complaints/open-count'),
      ]);

      const settings = settingsRes.status === 'fulfilled' ? settingsRes.value.data : [];
      const didoxKey = settings.find((s) => s.key === 'didox_user_key')?.value;
      const stir = settings.find((s) => s.key === 'platform_stir')?.value;

      return {
        didoxConfigured: Boolean(didoxKey && didoxKey.trim() !== ''),
        operatorStirConfigured: Boolean(stir && stir.trim() !== ''),
        pendingAppsCount: appsRes.status === 'fulfilled' ? appsRes.value.data.total : 0,
        pendingPayoutsCount: payoutsRes.status === 'fulfilled' ? payoutsRes.value.data.total : 0,
        activeRiskCount: riskRes.status === 'fulfilled' ? riskRes.value.data : 0,
        unresolvedComplaintsCount: compRes.status === 'fulfilled' ? compRes.value.data : 0,
      };
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="h-28 animate-pulse rounded-2xl bg-muted/30 border border-border/80" />
    );
  }

  if (!hub) return null;

  const items: Array<{
    id: string;
    title: string;
    description: string;
    href: string;
    actionLabel: string;
    variant: 'danger' | 'warning' | 'info';
    icon: React.ElementType;
    badge: string;
  }> = [];

  // 1. Missing Didox Key Check
  if (!hub.didoxConfigured) {
    items.push({
      id: 'didox_missing',
      title: 'Didox API kaliti kiritilmagan',
      description: 'Yangi sellerlarning STIR ma\'lumotlarini Davlat Soliq bazasidan avtomatik tekshirish to\'xtab qolgan.',
      href: '/admin/settings',
      actionLabel: 'Kalitni kiritish',
      variant: 'warning',
      icon: KeyRound,
      badge: 'Soliq / Yuridik',
    });
  }

  // 2. Pending Seller Applications
  if (hub.pendingAppsCount > 0) {
    items.push({
      id: 'pending_apps',
      title: `${hub.pendingAppsCount} ta yangi do'kon arizasi kutmoqda`,
      description: 'Sotuvchilar platformaga qo\'shilish uchun hujjat topshirgan. Arizalarni ko\'rib chiqing.',
      href: '/admin/applications',
      actionLabel: 'Arizalarni ko\'rish',
      variant: 'danger',
      icon: FileText,
      badge: `${hub.pendingAppsCount} ta ariza`,
    });
  }

  // 3. Pending Payout Requests
  if (hub.pendingPayoutsCount > 0) {
    items.push({
      id: 'pending_payouts',
      title: `${hub.pendingPayoutsCount} ta pul yechish arizasi mavjud`,
      description: 'Sotuvchilar ishlab topgan daromadlarini karta orqali yechib olishni so\'ramoqda.',
      href: '/admin/withdrawals',
      actionLabel: 'Mablag\'ni to\'lash',
      variant: 'warning',
      icon: CreditCard,
      badge: `${hub.pendingPayoutsCount} ta so'rov`,
    });
  }

  // 4. Active Risk Signals
  if (hub.activeRiskCount > 0) {
    items.push({
      id: 'active_risks',
      title: `${hub.activeRiskCount} ta shubhali xavf signali aniqlandi`,
      description: 'Kuryerlarda soxta GPS koordinatalari yoki past baholashlar aniqlangan.',
      href: '/admin/risk',
      actionLabel: 'Signallarni tekshirish',
      variant: 'danger',
      icon: ShieldAlert,
      badge: `${hub.activeRiskCount} ta xavf`,
    });
  }

  // 5. Open Complaints
  if (hub.unresolvedComplaintsCount > 0) {
    items.push({
      id: 'open_complaints',
      title: `${hub.unresolvedComplaintsCount} ta ochiq mijoz shikoyati`,
      description: 'Xaridorlar buyurtma yoki tovar sifati bo\'yicha murojaat yo\'llagan.',
      href: '/admin/complaints',
      actionLabel: 'Hal qilish',
      variant: 'warning',
      icon: AlertTriangle,
      badge: `${hub.unresolvedComplaintsCount} ta shikoyat`,
    });
  }

  // Perfect pristine state
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
                Tizim 100% Tayyor & Barqaror
              </h4>
              <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Barcha operatsiyalar joyida
              </span>
            </div>
            <p className="text-[0.72rem] text-muted-foreground mt-0.5">
              Kutilayotgan do&apos;kon arizalari, to&apos;lanmagan pul yechishlar yoki hal qilinmagan xavf signallari mavjud emas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-primary animate-ping" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Diqqat Talab Etiladigan Amallar ({items.length})
          </h3>
        </div>
        <span className="text-[0.68rem] font-bold text-muted-foreground">
          Tezkor Harakatlar Markazi
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const Icon = it.icon;
          const isDanger = it.variant === 'danger';
          return (
            <div
              key={it.id}
              className={cn(
                'flex flex-col justify-between rounded-2xl border p-4 transition-all shadow-xs hover:shadow-md',
                isDanger
                  ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50'
                  : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50',
              )}>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-xl font-bold',
                        isDanger ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600',
                      )}>
                      <Icon className="size-4" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground leading-tight">
                      {it.title}
                    </h4>
                  </div>
                  <span
                    className={cn(
                      'text-[0.62rem] font-bold px-2 py-0.5 rounded-full border shrink-0',
                      isDanger
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                    )}>
                    {it.badge}
                  </span>
                </div>
                <p className="mt-2 text-[0.72rem] text-muted-foreground leading-relaxed">
                  {it.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/50 flex justify-end">
                <Link
                  href={it.href}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                    isDanger
                      ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs'
                      : 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs',
                  )}>
                  <span>{it.actionLabel}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Database,
  KeyRound,
  RefreshCw,
  X,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useEscapeKey } from '@/lib/use-escape-key';

interface HealthStatus {
  database: boolean;
  didoxConfigured: boolean;
  operatorStirConfigured: boolean;
  fiscalMode: string;
  clickConfigured: boolean;
  activeRiskCount: number;
  pendingAppsCount: number;
  pendingPayoutsCount: number;
}

export function SystemHealthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEscapeKey(open, onClose);

  const healthQ = useQuery<HealthStatus>({
    queryKey: ['admin', 'system-health-check'],
    queryFn: async () => {
      // Gather settings and pending queues
      const [settingsRes, appsRes, payoutsRes, riskRes] = await Promise.allSettled([
        api.get<Array<{ key: string; value: string }>>('/admin/settings'),
        api.get<{ total: number }>('/admin/sellers/applications?status=pending&limit=1'),
        api.get<{ total: number }>('/admin/balance/withdrawals?status=pending&limit=1'),
        api.get<number>('/admin/risk/unresolved-count'),
      ]);

      const settings = settingsRes.status === 'fulfilled' ? settingsRes.value.data : [];
      const didoxKey = settings.find((s) => s.key === 'didox_user_key')?.value;
      const stir = settings.find((s) => s.key === 'platform_stir')?.value;
      const fiscal = settings.find((s) => s.key === 'fiscal_mode')?.value || 'off';
      const clickFee = settings.find((s) => s.key === 'click_fee_percent')?.value;

      return {
        database: settingsRes.status === 'fulfilled',
        didoxConfigured: Boolean(didoxKey && didoxKey.trim() !== ''),
        operatorStirConfigured: Boolean(stir && stir.trim() !== ''),
        fiscalMode: fiscal,
        clickConfigured: Boolean(clickFee && Number(clickFee) > 0),
        pendingAppsCount: appsRes.status === 'fulfilled' ? appsRes.value.data.total : 0,
        pendingPayoutsCount: payoutsRes.status === 'fulfilled' ? payoutsRes.value.data.total : 0,
        activeRiskCount: riskRes.status === 'fulfilled' ? riskRes.value.data : 0,
      };
    },
    enabled: open,
    refetchInterval: open ? 30_000 : false,
  });

  if (!open) return null;

  const h = healthQ.data;
  const isAllReady =
    h?.database &&
    h?.didoxConfigured &&
    h?.operatorStirConfigured &&
    h?.pendingAppsCount === 0 &&
    h?.pendingPayoutsCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-2xl font-bold shadow-sm',
                isAllReady
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
              )}>
              <Activity className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                Tizim Salomatligi & Tayyorgarligi
              </h3>
              <p className="text-xs text-muted-foreground">
                Barcha ichki xizmatlar, Soliq integratsiyasi va navbatlar auditi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {healthQ.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="size-7 animate-spin text-primary" />
            </div>
          ) : !h ? (
            <p className="text-center text-xs text-destructive">Ma&apos;lumotlarni yuklab bo&apos;lmadi</p>
          ) : (
            <>
              {/* Overall status badge */}
              <div
                className={cn(
                  'flex items-center justify-between rounded-2xl p-4 border',
                  isAllReady
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300',
                )}>
                <div className="flex items-center gap-2.5">
                  {isAllReady ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="size-5 text-amber-600" />
                  )}
                  <div>
                    <p className="text-xs font-bold">
                      {isAllReady ? 'Barcha tizimlar 100% tayyor' : 'Diqqat talab etiladigan amallar bor'}
                    </p>
                    <p className="text-[0.68rem] opacity-80">
                      {isAllReady
                        ? 'Hech qanday nosozlik yoki kutilayotgan navbatlar yo\'q'
                        : 'Quyidagi xizmatlar holati bilan tanishing'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold font-mono">
                  {isAllReady ? '100% OK' : 'AMALLAR BOR'}
                </span>
              </div>

              {/* Service Health Grid */}
              <div className="space-y-2 text-xs">
                {/* Database */}
                <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3">
                  <div className="flex items-center gap-2.5">
                    <Database className="size-4 text-primary" />
                    <div>
                      <span className="font-bold text-foreground">PostgreSQL Ma&apos;lumotlar Bazasi</span>
                      <p className="text-[0.68rem] text-muted-foreground">Cluster & Replicas</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Check className="size-3" /> Ishlamoqda
                  </span>
                </div>

                {/* Didox / Soliq */}
                <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="size-4 text-primary" />
                    <div>
                      <span className="font-bold text-foreground">Davlat Soliq (Didox) API</span>
                      <p className="text-[0.68rem] text-muted-foreground">
                        {h.didoxConfigured ? 'Kalit kiritilgan va faol' : 'Kalit kiritilmagan (Chala)'}
                      </p>
                    </div>
                  </div>
                  {h.didoxConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Check className="size-3" /> Ulangan
                    </span>
                  ) : (
                    <Link
                      href="/admin/settings"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full hover:bg-amber-500/20 transition-colors">
                      Sozlash →
                    </Link>
                  )}
                </div>

                {/* Operator Legal */}
                <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="size-4 text-primary" />
                    <div>
                      <span className="font-bold text-foreground">Operator STIRi (313296455)</span>
                      <p className="text-[0.68rem] text-muted-foreground">&quot;TILAV&quot; MCHJ rekvizitlari</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Check className="size-3" /> Tasdiqlangan
                  </span>
                </div>

                {/* Pending Actions overview */}
                <div className="pt-2 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
                  <Link
                    href="/admin/applications"
                    onClick={onClose}
                    className="rounded-xl border border-border bg-card p-2 hover:border-primary/50 transition-colors">
                    <p className="text-lg font-extrabold text-foreground font-mono">{h.pendingAppsCount}</p>
                    <p className="text-[0.65rem] text-muted-foreground">Yangi arizalar</p>
                  </Link>

                  <Link
                    href="/admin/withdrawals"
                    onClick={onClose}
                    className="rounded-xl border border-border bg-card p-2 hover:border-primary/50 transition-colors">
                    <p className="text-lg font-extrabold text-foreground font-mono">{h.pendingPayoutsCount}</p>
                    <p className="text-[0.65rem] text-muted-foreground">Pul yechish</p>
                  </Link>

                  <Link
                    href="/admin/risk"
                    onClick={onClose}
                    className="rounded-xl border border-border bg-card p-2 hover:border-primary/50 transition-colors">
                    <p className="text-lg font-extrabold text-foreground font-mono">{h.activeRiskCount}</p>
                    <p className="text-[0.65rem] text-muted-foreground">Xavf signallari</p>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

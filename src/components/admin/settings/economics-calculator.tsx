'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TriangleAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Economics } from './types';
import { fmt } from './settings-metadata';

export interface EconomicsCalculatorProps {
  commissionDraft: string | undefined;
}

export function EconomicsCalculator({ commissionDraft }: EconomicsCalculatorProps) {
  const draftValid =
    commissionDraft !== undefined &&
    commissionDraft.trim() !== '' &&
    Number.isFinite(Number(commissionDraft));

  const ecoQ = useQuery<Economics>({
    queryKey: ['admin', 'economics', draftValid ? commissionDraft : 'current'],
    queryFn: async () =>
      (
        await api.get('/admin/settings/economics', {
          params: draftValid ? { commission: commissionDraft } : {},
        })
      ).data,
  });

  const e = ecoQ.data;
  if (!e) return null;

  const isNegative = e.onlineMarginPercent < 0;

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all shadow-xs',
        isNegative
          ? 'border-destructive/40 bg-destructive/5'
          : 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10',
      )}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp
            className={cn(
              'size-5',
              isNegative ? 'text-destructive' : 'text-emerald-500',
            )}
          />
          <h3 className="text-sm font-bold text-foreground">
            Jonli Marja &amp; Foyda Kalkulyatori{' '}
            {draftValid && (
              <span className="text-xs text-muted-foreground font-normal">
                (Komissiya {commissionDraft}% bo&apos;lsa)
              </span>
            )}
          </h3>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2.5 py-0.5 rounded-full border',
            isNegative
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          )}>
          {isNegative ? 'Zarar xavfi!' : 'Foydali model'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-foreground">
              Onlayn (Click / Karta) Buyurtma
            </span>
            <span
              className={cn(
                'text-sm font-extrabold',
                isNegative ? 'text-destructive' : 'text-emerald-600',
              )}>
              {e.onlineMarginPercent}% sof marja
            </span>
          </div>
          <p className="text-[0.72rem] text-muted-foreground">
            Komissiya {e.commissionPercent}% − Click {e.clickFeePercent}% − Payout{' '}
            {e.payoutFeePercent}%
          </p>
          <div className="mt-2.5 pt-2 border-t border-border/60 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">100 000 so&apos;mda sof foyda:</span>
            <span
              className={cn(
                'font-mono font-bold',
                isNegative ? 'text-destructive' : 'text-foreground',
              )}>
              {fmt(e.examplePer100k.online.platformNet)} so&apos;m
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-foreground">
              Naqd Pul (Cash on Delivery)
            </span>
            <span className="text-sm font-extrabold text-emerald-600">
              {e.cashMarginPercent}% sof marja
            </span>
          </div>
          <p className="text-[0.72rem] text-muted-foreground">
            Bank komissiyalari yo&apos;q, to&apos;liq {e.commissionPercent}% platformada qoladi
          </p>
          <div className="mt-2.5 pt-2 border-t border-border/60 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">100 000 so&apos;mda sof foyda:</span>
            <span className="font-mono font-bold text-foreground">
              {fmt(e.examplePer100k.cash.platformNet)} so&apos;m
            </span>
          </div>
        </div>
      </div>

      {e.warnings?.length > 0 && (
        <div className="mt-3.5 space-y-1 rounded-xl bg-destructive/10 p-3">
          {e.warnings.map((w, idx) => (
            <p
              key={idx}
              className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <TriangleAlert className="size-3.5 shrink-0" /> {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

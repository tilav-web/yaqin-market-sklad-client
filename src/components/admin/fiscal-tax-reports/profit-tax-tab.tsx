'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import {
  Info,
  RotateCcw,
  Copy,
  Send,
} from 'lucide-react';
import { toast } from '@/stores/toast';
import { fmt, SalarySummary, SubmitReportPayload } from './types';

export interface ProfitTaxTabProps {
  profitQuarter: string;
  setProfitQuarter: (val: string) => void;
  profitExpenses: { server: number; banking: number; other: number };
  setProfitExpenses: (val: { server: number; banking: number; other: number }) => void;
  effectiveProfitRevenue: number;
  setProfitGrossInput: (val: number | null) => void;
  salarySummary: SalarySummary;
  submitMut: {
    mutate: (payload: SubmitReportPayload) => void;
    isPending: boolean;
  };
  handleCopyText: (text: string, label: string) => void;
}

export function ProfitTaxTab({
  profitQuarter,
  setProfitQuarter,
  profitExpenses,
  setProfitExpenses,
  effectiveProfitRevenue,
  setProfitGrossInput,
  salarySummary,
  submitMut,
  handleCopyText,
}: ProfitTaxTabProps) {
  // 3 oylik ish haqi fondi xarajati
  const quarterSalaryCost = salarySummary.totalCost * 3;
  const totalExpenses =
    quarterSalaryCost +
    profitExpenses.server +
    profitExpenses.banking +
    profitExpenses.other;
  const taxableProfit = Math.max(0, effectiveProfitRevenue - totalExpenses);
  const profitTax = Math.round(taxableProfit * 0.15);
  const netProfit = effectiveProfitRevenue - totalExpenses - profitTax;

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <div className="flex items-start gap-3">
          <Info className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <div className="space-y-1 text-xs text-indigo-900 dark:text-indigo-200">
            <strong className="font-semibold text-sm">
              Foyda Solig&apos;i (15%) — Qonuniy asos:
            </strong>
            <p>
              • <strong>Muddat:</strong> Har chorak yakunlangandan keyingi oyning 20-sanasigacha (Soliq kodeksi 339-modda).
              <br />
              • <strong>Soliq bazasi:</strong> Jami daromadlar (komissiya va realizatsiya) — Chegiriladigan xarajatlar (Oylik fondi, hosting, bank va aloqa).
              <br />
              • <strong>Stavka:</strong> 15% (O&apos;zR Soliq kodeksi 337-moddasi).
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
          <div>
            <h4 className="text-sm font-bold text-foreground">Foyda Solig&apos;i Hisob-kitob Parametrlari</h4>
            <p className="text-xs text-muted-foreground">
              Chorakni tanlang va xarajatlarni istalgancha o&apos;zgartiring
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={profitQuarter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProfitQuarter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-semibold outline-none"
            >
              <option value="2026-Q1">1-chorak (Yanvar-Mart)</option>
              <option value="2026-Q2">2-chorak (Aprel-Iyun)</option>
              <option value="2026-Q3">3-chorak (Iyul-Sentyabr)</option>
              <option value="2026-Q4">4-chorak (Oktyabr-Dekabr)</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setProfitExpenses({
                  server: 600000,
                  banking: 200000,
                  other: 200000,
                });
                setProfitGrossInput(null);
                toast.success('Standart qiymatlarga qaytarildi!');
              }}
            >
              <RotateCcw className="size-3.5" />
              Standartni tiklash
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Choraklik jami daromad
            </label>
            <div className="relative">
              <Input
                type="number"
                value={effectiveProfitRevenue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfitGrossInput(Number(e.target.value))}
                className="font-mono text-sm"
              />
              <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Server &amp; IT hosting xarajati
            </label>
            <div className="relative">
              <Input
                type="number"
                value={profitExpenses.server}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProfitExpenses({ ...profitExpenses, server: Number(e.target.value) })
                }
                className="font-mono text-sm"
              />
              <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Bank komissiyasi &amp; to&apos;lovlar
            </label>
            <div className="relative">
              <Input
                type="number"
                value={profitExpenses.banking}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProfitExpenses({ ...profitExpenses, banking: Number(e.target.value) })
                }
                className="font-mono text-sm"
              />
              <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Boshqa operatsion xarajatlar
            </label>
            <div className="relative">
              <Input
                type="number"
                value={profitExpenses.other}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProfitExpenses({ ...profitExpenses, other: Number(e.target.value) })
                }
                className="font-mono text-sm"
              />
              <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-card p-3 border border-border">
              <span className="text-[11px] text-muted-foreground block">
                Jami chegiriladigan xarajatlar:
              </span>
              <strong className="text-base font-bold text-red-600 font-mono">
                {fmt(totalExpenses)} so&apos;m
              </strong>
              <span className="text-[10px] text-muted-foreground block">
                (Oylik: {fmt(quarterSalaryCost)} so&apos;m)
              </span>
            </div>

            <div className="rounded-lg bg-card p-3 border border-border">
              <span className="text-[11px] text-muted-foreground block">
                Soliqqa tortiladigan sof foyda:
              </span>
              <strong className="text-base font-bold text-foreground font-mono">
                {fmt(taxableProfit)} so&apos;m
              </strong>
              <span className="text-[10px] text-muted-foreground block">
                Daromad — Xarajat
              </span>
            </div>

            <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
              <span className="text-[11px] text-primary block">
                Foyda solig&apos;i (15%):
              </span>
              <strong className="text-base font-bold text-primary font-mono">
                {fmt(profitTax)} so&apos;m
              </strong>
              <span className="text-[10px] text-primary/80 block">Choraklik to&apos;lov</span>
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">
                Korxonada qoladigan sof foyda:
              </span>
              <strong className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                {fmt(netProfit)} so&apos;m
              </strong>
              <span className="text-[10px] text-emerald-600/80 block">
                Soliq to&apos;langandan keyin
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Choraklik foyda solig&apos;i har kvartaldan keyingi oyning 20-sanasigacha topshiriladi.
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `Korxona: "TILAV" MCHJ (STIR: 313296455)\nFoyda solig'i hisoboti\nDavr: ${profitQuarter}\nJami daromad: ${fmt(
                    effectiveProfitRevenue,
                  )} so'm\nJami chegiriladigan xarajatlar: ${fmt(
                    totalExpenses,
                  )} so'm\nSoliqqa tortiladigan baza: ${fmt(
                    taxableProfit,
                  )} so'm\nFoyda solig'i (15%): ${fmt(profitTax)} so'm\nSof foyda: ${fmt(
                    netProfit,
                  )} so'm`;
                  handleCopyText(text, 'Foyda solig\u02BBi hisob-kitobi');
                }}
              >
                <Copy className="size-3.5" />
                Raqamlarni nusxalash
              </Button>

              <Button
                size="sm"
                disabled={submitMut.isPending}
                onClick={() => {
                  submitMut.mutate({
                    reportType: 'profit_tax',
                    period: profitQuarter,
                    dueDate: '2026-10-20',
                    data: {
                      profitQuarter,
                      profitGrossRevenue: effectiveProfitRevenue,
                      totalExpenses,
                      taxableProfit,
                      profitTax,
                      netProfit,
                    },
                    notes: `Foyda solig'i (15%): ${fmt(profitTax)} so'm (${profitQuarter})`,
                  });
                }}
              >
                <Send className="size-3.5" />
                Topshirildi deb qayd etish
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

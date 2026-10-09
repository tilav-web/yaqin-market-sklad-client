'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import {
  Info,
  ExternalLink,
  RotateCcw,
  Copy,
  Send,
} from 'lucide-react';
import { toast } from '@/stores/toast';
import { fmt, SoliqCalendarResponse, SubmitReportPayload } from './types';

export interface TurnoverTaxTabProps {
  calData?: SoliqCalendarResponse;
  turnoverOverride: number | null;
  setTurnoverOverride: (val: number | null) => void;
  effectiveTurnover: number;
  submitMut: {
    mutate: (payload: SubmitReportPayload) => void;
    isPending: boolean;
  };
  handleCopyText: (text: string, label: string) => void;
}

export function TurnoverTaxTab({
  calData,
  setTurnoverOverride,
  effectiveTurnover,
  submitMut,
  handleCopyText,
}: TurnoverTaxTabProps) {
  const turnoverTax = Math.round(effectiveTurnover * 0.04);

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <Info className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <strong className="font-semibold text-sm">
                &quot;TILAV&quot; MCHJ Asosiy Solig&apos;i: Aylanmadan olinadigan soliq (4%)
              </strong>
              <Badge variant="success" className="text-[10px]">
                Soddalashtirilgan tizim
              </Badge>
            </div>
            <p>
              • <strong>Soliq kodi:</strong> 10104_36 (Айланмадан олинадиган солиқ ҳисоб-китоби).
              <br />
              • <strong>Muddat:</strong> Har oyning 15-sanasidan kechiktirmay (Soliq kodeksi 470-modda).
              <br />
              • <strong>Afzalligi:</strong> QQS (12%) va Foyda solig&apos;i (15%) to&apos;lanmaydi! Faqat oylik aylanmaning 4% to&apos;lanadi.
              <br />
              • <strong>Soliq portali:</strong> my.soliq.uz tizimi har oy onlayn kassa cheklari va hisobvaraq-fakturalar asosida hisobot qoralamasini avtomatik shakllantiradi.
            </p>
          </div>
        </div>
      </Card>

      {/* Soliq Avtomat Qoralama Kartasi */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-foreground">
                Soliq portalida avtomatik shakllangan hisobot
              </strong>
              <Badge variant="neutral" className="font-mono text-[10px]">
                № 240491220
              </Badge>
              <Badge variant="neutral" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">
                Автомат Қоралама
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Пакет 10104_36 (Ойлик, Август 2026). my.soliq.uz ga kirib, shakllangan tushumni tekshirib tasdiqlash tugmasini bosish kifoya.
            </p>
          </div>

          <a
            href="https://oldmy.soliq.uz"
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <ExternalLink className="size-3.5" />
            my.soliq.uz da ochish
          </a>
        </div>
      </div>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h4 className="text-sm font-bold text-foreground">Aylanma Solig&apos;i Kalkulyatori</h4>
            <p className="text-xs text-muted-foreground">
              Platforma komissiyasi yoki realizatsiya aylanmasi bo&apos;yicha to&apos;lanadigan soliq
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTurnoverOverride(null);
              toast.success('Platforma tushumi tiklandi!');
            }}
          >
            <RotateCcw className="size-3.5" />
            Platforma tushumini olish
          </Button>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Oylik jami tushum (Aylanma)
          </label>
          <div className="relative max-w-md">
            <Input
              type="number"
              value={effectiveTurnover}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTurnoverOverride(Number(e.target.value))}
              className="font-mono text-sm"
            />
            <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-card p-3 border border-border">
              <span className="text-[11px] text-muted-foreground block">
                Jami aylanma tushumi:
              </span>
              <strong className="text-base font-bold text-foreground font-mono">
                {fmt(effectiveTurnover)} so&apos;m
              </strong>
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">
                Aylanmadan olinadigan soliq (4%):
              </span>
              <strong className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                {fmt(turnoverTax)} so&apos;m
              </strong>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Har oy 15-sanasigacha to&apos;lanadi.
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `Korxona: "TILAV" MCHJ (STIR: 313296455)\nAylanmadan olinadigan soliq (AOS 4%)\nJami aylanma: ${fmt(
                    effectiveTurnover,
                  )} so'm\nTo'lanadigan soliq (4%): ${fmt(turnoverTax)} so'm`;
                  handleCopyText(text, 'Aylanma solig\u02BBi');
                }}
              >
                <Copy className="size-3.5" />
                Nusxalash
              </Button>

              <Button
                size="sm"
                disabled={submitMut.isPending}
                onClick={() => {
                  submitMut.mutate({
                    reportType: 'turnover_tax',
                    period: calData?.today?.slice(0, 7) || '2026-08',
                    dueDate: '2026-09-15',
                    data: {
                      turnoverInput: effectiveTurnover,
                      turnoverTax,
                    },
                    notes: `Aylanmadan olinadigan soliq (4%): ${fmt(turnoverTax)} so'm`,
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

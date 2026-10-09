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
import { fmt, SoliqCalendarResponse, SubmitReportPayload } from './types';

export interface VatTaxTabProps {
  calData?: SoliqCalendarResponse;
  effectiveVatTurnover: number;
  setVatTurnoverInput: (val: number | null) => void;
  vatDeductibleInput: number;
  setVatDeductibleInput: (val: number) => void;
  submitMut: {
    mutate: (payload: SubmitReportPayload) => void;
    isPending: boolean;
  };
  handleCopyText: (text: string, label: string) => void;
}

export function VatTaxTab({
  calData,
  effectiveVatTurnover,
  setVatTurnoverInput,
  vatDeductibleInput,
  setVatDeductibleInput,
  submitMut,
  handleCopyText,
}: VatTaxTabProps) {
  const grossVat = Math.round((effectiveVatTurnover * 0.12) / 1.12);
  const netPayableVat = Math.max(0, grossVat - vatDeductibleInput);

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <Info className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
            <strong className="font-semibold text-sm">
              QQS (Qo&apos;shilgan qiymat solig&apos;i — 12%) — Qonuniy asos:
            </strong>
            <p>
              • <strong>Muddat:</strong> Har oyning 20-sanasidan kechiktirmay (Soliq kodeksi 273-modda).
              <br />
              • <strong>Avtomatik to&apos;lish:</strong> Didox orqali kiruvchi va chiquvchi hisobvaraq-fakturalar tasdiqlansa,
              Soliq portali QQS ilovalarini avtomatik to&apos;ldiradi.
              <br />
              • <strong>Formula:</strong> To&apos;lanadigan QQS = Chiqarilgan hisob-faktura QQS — Kiruvchi (hisobga olinadigan) QQS.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h4 className="text-sm font-bold text-foreground">QQS Hisob-kitob Parametrlari</h4>
            <p className="text-xs text-muted-foreground">
              Istalgan summani qo&apos;lda tahrirlashingiz yoki avtomatik qiymatlardan foydalanishingiz mumkin
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setVatTurnoverInput(null);
              setVatDeductibleInput(0);
              toast.success('Avtomatik hisobga qaytarildi!');
            }}
          >
            <RotateCcw className="size-3.5" />
            Avtomatik qiymatni tiklash
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Soliqqa tortiladigan realizatsiya tushumi
            </label>
            <div className="relative">
              <Input
                type="number"
                value={effectiveVatTurnover}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVatTurnoverInput(Number(e.target.value))}
                className="font-mono text-sm"
              />
              <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Platforma komissiyasi yoki realizatsiya qilingan xizmatlar summasi
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Hisobga olinadigan (kiruvchi) QQS
            </label>
            <div className="relative">
              <Input
                type="number"
                value={vatDeductibleInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVatDeductibleInput(Number(e.target.value))}
                className="font-mono text-sm"
              />
              <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Didox orqali sizga kelgan va to&apos;langan EHF fakturalaridagi QQS
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-card p-3 border border-border">
              <span className="text-[11px] text-muted-foreground block">
                Hisoblangan QQS (12%):
              </span>
              <strong className="text-base font-bold text-amber-600 font-mono">
                {fmt(grossVat)} so&apos;m
              </strong>
            </div>

            <div className="rounded-lg bg-card p-3 border border-border">
              <span className="text-[11px] text-muted-foreground block">
                Hisobga olinadigan (kiruvchi) QQS:
              </span>
              <strong className="text-base font-bold text-indigo-600 font-mono">
                {fmt(vatDeductibleInput)} so&apos;m
              </strong>
            </div>

            <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
              <span className="text-[11px] text-primary block">
                Byudjetga to&apos;lanadigan sof QQS:
              </span>
              <strong className="text-base font-bold text-primary font-mono">
                {fmt(netPayableVat)} so&apos;m
              </strong>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              QQS hisoboti har oy 20-sanasigacha my.soliq.uz orqali imzolanishi shart.
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `Korxona: "TILAV" MCHJ (STIR: 313296455)\nQQS hisoboti (12%)\nRealizatsiya aylanmasi: ${fmt(
                    effectiveVatTurnover,
                  )} so'm\nHisoblangan QQS: ${fmt(grossVat)} so'm\nHisobga olingan QQS: ${fmt(
                    vatDeductibleInput,
                  )} so'm\nTo'lanadigan QQS: ${fmt(netPayableVat)} so'm`;
                  handleCopyText(text, 'QQS hisoboti');
                }}
              >
                <Copy className="size-3.5" />
                Raqamlarni nusxalash
              </Button>

              <Button
                size="sm"
                disabled={submitMut.isPending}
                onClick={() => {
                  const targetPeriod = calData?.items.find((i) => i.id === 'vat')?.period || '2026-08';
                  const dueDate = calData?.items.find((i) => i.id === 'vat')?.dueDate || '2026-09-20';
                  submitMut.mutate({
                    reportType: 'vat',
                    period: targetPeriod,
                    dueDate,
                    data: {
                      vatTurnover: effectiveVatTurnover,
                      grossVat,
                      vatDeductibleInput,
                      netPayableVat,
                    },
                    notes: `To'lanadigan QQS (12%): ${fmt(netPayableVat)} so'm`,
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

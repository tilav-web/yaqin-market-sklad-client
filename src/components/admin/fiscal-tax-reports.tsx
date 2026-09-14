'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  History,
  Info,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';

export interface TaxReportRecord {
  id: string;
  reportType: string;
  period: string;
  dueDate: string;
  submittedAt: string | null;
  data: Record<string, unknown>;
  notes?: string | null;
  submissionConfirmation?: string | null;
}

interface TaxCalendarItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  period: string;
  periodLabel: string;
  dueDate: string;
  daysRemaining: number;
  status: 'pending' | 'submitted' | 'overdue';
  submittedReport?: TaxReportRecord | null;
  standardDay: number;
  description: string;
}

interface TaxCalendarData {
  today: string;
  companyInfo: {
    name: string;
    tin: string;
    pinfl: string;
    director: string;
    taxRegime: string;
  };
  items: TaxCalendarItem[];
  hasOverdue: boolean;
  hasUrgent: boolean;
}

interface SalaryCalculation {
  baseSalary: number;
  rate: number;
  grossSalary: number;
  ndflTotal: number;
  inpsAmount: number;
  budgetNdfl: number;
  socialTaxAmount: number;
  netSalary: number;
  totalCompanyCost: number;
  employeeCount: number;
  position: string;
  notes: string;
}

interface ProfitVatCalculation {
  period: string;
  platformTurnover: number;
  commissionPercent: number;
  platformRevenue: number;
  vatRate: number;
  vatAmount: number;
  netRevenueExcludingVat: number;
  expenses: {
    salaryExpense: number;
    otherExpenses: number;
    totalExpenses: number;
  };
  taxableProfit: number;
  profitTaxRate: number;
  profitTaxAmount: number;
  netProfitAfterTax: number;
}

const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ');

export function TaxReportsSection() {
  const qc = useQueryClient();

  // Salary Calculator State
  const [baseSalary, setBaseSalary] = useState<number>(1155000); // MHTEKM
  const [rate, setRate] = useState<number>(0.25); // 0.25 stavka

  // Profit/VAT Calculator State
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [additionalExpenses, setAdditionalExpenses] = useState<number>(500000); // Server, aloqa va h.k.
  const [manualRevenue, setManualRevenue] = useState<string>('');

  // Confirmation notes
  const salaryConfirmNote = 'my.soliq.uz orqali qabul qilindi';
  const profitConfirmNote = 'my.soliq.uz orqali qabul qilindi';

  // Queries
  const calendarQ = useQuery<TaxCalendarData>({
    queryKey: ['admin', 'tax-reports-calendar'],
    queryFn: async () => (await api.get('/admin/fiscal/tax-reports/calendar')).data,
  });

  const salaryQ = useQuery<SalaryCalculation>({
    queryKey: ['admin', 'tax-reports-salary', baseSalary, rate],
    queryFn: async () =>
      (
        await api.get('/admin/fiscal/tax-reports/calculate-salary', {
          params: { baseSalary, rate },
        })
      ).data,
  });

  const profitQ = useQuery<ProfitVatCalculation>({
    queryKey: ['admin', 'tax-reports-profit-vat', selectedPeriod, additionalExpenses, manualRevenue],
    queryFn: async () =>
      (
        await api.get('/admin/fiscal/tax-reports/calculate-profit-vat', {
          params: {
            period: selectedPeriod || undefined,
            additionalExpenses,
            manualRevenue: manualRevenue ? parseFloat(manualRevenue) : undefined,
          },
        })
      ).data,
  });

  const historyQ = useQuery<TaxReportRecord[]>({
    queryKey: ['admin', 'tax-reports-history'],
    queryFn: async () => (await api.get('/admin/fiscal/tax-reports/history')).data,
  });

  // Submit Mutation
  const submitMut = useMutation({
    mutationFn: async (payload: {
      reportType: string;
      period: string;
      dueDate: string;
      data: Record<string, unknown>;
      notes?: string;
      submissionConfirmation?: string;
    }) => (await api.post('/admin/fiscal/tax-reports/submit', payload)).data,
    onSuccess: () => {
      toast.success('Hisobot topshirilgan deb qayd qilindi!');
      qc.invalidateQueries({ queryKey: ['admin', 'tax-reports-calendar'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tax-reports-history'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} nusxalandi!`);
  };

  const calData = calendarQ.data;
  const salaryData = salaryQ.data;
  const profitData = profitQ.data;

  return (
    <div className="space-y-6">
      {/* ─── 1. MChJ Soliq Rekvizitlari & Holati ─── */}
      <Card className="border-border bg-gradient-to-r from-card via-card to-primary/5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {calData?.companyInfo.name || '"TILAV" MCHJ'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Rahbar: <strong className="text-foreground">{calData?.companyInfo.director || 'Tilovov Shavqiddin S.'}</strong>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="primary" className="font-mono">
                STIR: {calData?.companyInfo.tin || '313296455'}
              </Badge>
              <Badge variant="neutral" className="font-mono">
                PINFL: {calData?.companyInfo.pinfl || '52302035660028'}
              </Badge>
              <Badge variant="warning" className="font-medium">
                {calData?.companyInfo.taxRegime || 'Umumbelgilangan soliq tizimi (Foyda 15% + QQS 12%)'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://my.soliq.uz"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-3.5" />
              my.soliq.uz ga o&apos;tish
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                calendarQ.refetch();
                historyQ.refetch();
              }}
              disabled={calendarQ.isFetching}
            >
              <RefreshCw className={cn('size-3.5', calendarQ.isFetching && 'animate-spin')} />
              Yangilash
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── 2. Soliq Taqvimi va Eslatmalar Bloki ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Soliq Taqvimi &amp; Yaqinlashayotgan Muddatlar</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Bugungi sana: <strong>{calData?.today || new Date().toISOString().slice(0, 10)}</strong>
          </span>
        </div>

        {/* Ogohlantirish banneri */}
        {calData?.hasOverdue && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <div className="text-sm">
              <strong className="font-semibold">Diqqat! Muddati o&apos;tgan soliq hisoboti mavjud!</strong>
              <p className="text-xs opacity-90">
                Soliq inspeksiyasi hisob raqamni bloklamasligi yoki jarima qo&apos;llamasligi uchun kechiktirilgan hisobotni darhol topshiring.
              </p>
            </div>
          </div>
        )}

        {/* Muddat kartalari */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {calData?.items.map((item) => {
            const isOverdue = item.status === 'overdue';
            const isSubmitted = item.status === 'submitted';
            const isUrgent = !isSubmitted && item.daysRemaining <= 3 && item.daysRemaining >= 0;

            return (
              <Card
                key={item.id}
                className={cn(
                  'relative flex flex-col justify-between p-4 transition-all',
                  isOverdue && 'border-red-300 bg-red-500/5 dark:border-red-900',
                  isUrgent && 'border-amber-300 bg-amber-500/5 dark:border-amber-900',
                  isSubmitted && 'border-emerald-300 bg-emerald-500/5 dark:border-emerald-900',
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                        isSubmitted && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                        isOverdue && 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
                        !isSubmitted && !isOverdue && 'bg-primary/10 text-primary',
                      )}
                    >
                      <Clock className="size-3" />
                      Har oy {item.standardDay}-sana
                    </span>

                    {isSubmitted ? (
                      <Badge variant="success">
                        <CheckCircle2 className="size-3" /> Topshirilgan
                      </Badge>
                    ) : isOverdue ? (
                      <Badge variant="danger">
                        <AlertCircle className="size-3" /> Muddati o&apos;tgan!
                      </Badge>
                    ) : (
                      <Badge variant={isUrgent ? 'warning' : 'neutral'}>
                        {item.daysRemaining === 0
                          ? 'Bugun oxirgi kun!'
                          : `${item.daysRemaining} kun qoldi`}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>

                  <div className="rounded-lg bg-muted/60 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Hisobot davri:</span>
                      <strong className="text-foreground">{item.periodLabel}</strong>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Oxirgi muddat:</span>
                      <strong className={cn(isOverdue ? 'text-red-600 font-bold' : 'text-foreground')}>
                        {item.dueDate}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60">
                  {isSubmitted ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <Check className="size-4" />
                      Qayd etilgan
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant={isOverdue ? 'destructive' : 'default'}
                      className="w-full text-xs"
                      onClick={() => {
                        const el = document.getElementById(
                          item.type === 'salary_ndfl' ? 'section-salary-calc' : 'section-profit-calc',
                        );
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Formani to&apos;ldirish &amp; Topshirish
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── 3. Forma 1: Xodimlar va 0.25 Stavka Direktor Oyligi (15-sana uchun) ─── */}
      <div id="section-salary-calc" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Direktor (Yagona xodim) 0.25 Stavka Oylik &amp; Soliq Hisob-kitobi
            </h3>
          </div>
          <Badge variant="neutral">Har oyning 15-sanasigacha</Badge>
        </div>

        <Card className="p-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                MHTEKM (Minimal oylik bazasi)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="font-mono text-sm"
                />
                <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                O&apos;zbekistonda minimal: 1 155 000 so&apos;m
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Belgilangan stavka
              </label>
              <div className="flex gap-1.5">
                {[0.25, 0.5, 1.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRate(s)}
                    className={cn(
                      'flex-1 rounded-lg border py-1.5 text-xs font-bold transition-all',
                      rate === s
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {s} st.
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Tavsiya etiladi: 0.25 stavka (faqat o&apos;zingiz bo&apos;lsangiz)
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Xodimlar soni
              </label>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm font-semibold text-foreground">
                1 nafar (Direktor / Rahbar)
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Begona xodim yo&apos;q
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Hisobot topshirish holati
              </label>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Qonuniy 0.25 shtat</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Buyruq va shtat jadvali asosida
              </span>
            </div>
          </div>

          {/* Natijalar paneli */}
          {salaryData && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Hisoblangan oylik:</span>
                  <strong className="text-base font-bold text-foreground font-mono">
                    {fmt(salaryData.grossSalary)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">so&apos;m/oy</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">JShODS (NDFL 12%):</span>
                  <strong className="text-base font-bold text-red-600 font-mono">
                    {fmt(salaryData.ndflTotal)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">ushlab qolinadi</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">INPS (0.1% Xalq bank):</span>
                  <strong className="text-base font-bold text-amber-600 font-mono">
                    {fmt(salaryData.inpsAmount)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">NDFL hisobidan</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Ijtimoiy soliq (12%):</span>
                  <strong className="text-base font-bold text-indigo-600 font-mono">
                    {fmt(salaryData.socialTaxAmount)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">korxona to&apos;laydi</span>
                </div>

                <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">Qo&apos;lga tegadigan:</span>
                  <strong className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {fmt(salaryData.netSalary)}
                  </strong>
                  <span className="text-[10px] text-emerald-600/80 block">so&apos;m (sof oylik)</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Korxona jami xarajati:</span>
                  <strong className="text-base font-bold text-foreground font-mono">
                    {fmt(salaryData.totalCompanyCost)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">oylik + ijtimoiy</span>
                </div>
              </div>

              {/* Qo'lda yoki my.soliq.uz ga kiritish uchun qulaylik */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/60">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="size-4 text-primary shrink-0" />
                  <span>
                    my.soliq.uz xodimlar hisoboti (JShODS va Ijtimoiy soliq) uchun tayyor raqamlar.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = `Korxona: "TILAV" MCHJ (STIR: 313296455)\nXodim: 1 nafar (Direktor)\nStavka: ${rate}\nHisoblangan oklad: ${fmt(
                        salaryData.grossSalary,
                      )} so'm\nJShODS (12%): ${fmt(salaryData.ndflTotal)} so'm (INPS: ${fmt(
                        salaryData.inpsAmount,
                      )} so'm)\nIjtimoiy soliq (12%): ${fmt(
                        salaryData.socialTaxAmount,
                      )} so'm\nQo'lga tegadigan: ${fmt(salaryData.netSalary)} so'm`;
                      handleCopyText(text, "Oylik hisobot ma'lumotlari");
                    }}
                  >
                    <Copy className="size-3.5" />
                    Ma&apos;lumotlarni nusxalash
                  </Button>

                  <Button
                    size="sm"
                    disabled={submitMut.isPending}
                    onClick={() => {
                      const targetPeriod = calData?.items.find((i) => i.id === 'salary_ndfl')?.period || '2026-08';
                      const dueDate = calData?.items.find((i) => i.id === 'salary_ndfl')?.dueDate || '2026-09-15';
                      submitMut.mutate({
                        reportType: 'salary_ndfl',
                        period: targetPeriod,
                        dueDate,
                        data: salaryData as unknown as Record<string, unknown>,
                        notes: `0.25 stavka direktor oyligi: ${fmt(salaryData.grossSalary)} so'm, JShODS: ${fmt(
                          salaryData.ndflTotal,
                        )} so'm`,
                        submissionConfirmation: salaryConfirmNote,
                      });
                    }}
                  >
                    <Send className="size-3.5" />
                    Topshirildi deb qayd etish
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ─── 4. Forma 2: QQS va Foyda Solig'i Hisob-kitobi (20-sana uchun) ─── */}
      <div id="section-profit-calc" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              QQS (12%) va Foyda Solig&apos;i (15%) Hisob-kitobi
            </h3>
          </div>
          <Badge variant="neutral">Har oyning / chorakning 20-sanasigacha</Badge>
        </div>

        <Card className="p-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Davr tanlash (Oy yoki Chorak)
              </label>
              <Input
                type="text"
                placeholder="masalan: 2026-08 yoki 2026-Q2"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="font-mono text-sm"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Bo&apos;sh qoldirilsa: oxirgi hisobot oyi olinadi
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Qo&apos;shimcha chegiriladigan xarajatlar
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={additionalExpenses}
                  onChange={(e) => setAdditionalExpenses(Number(e.target.value))}
                  className="font-mono text-sm"
                />
                <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Server hosting, internet, bank xizmatlari va h.k.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Platforma tushumi (ixtiyoriy override)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Avtomatik (buyurtmalardan)"
                  value={manualRevenue}
                  onChange={(e) => setManualRevenue(e.target.value)}
                  className="font-mono text-sm"
                />
                <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Bo&apos;sh qolsa, tizim amaldagi savdoni oladi
              </span>
            </div>
          </div>

          {/* Hisoblangan natijalar */}
          {profitData && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Platforma aylanmasi:</span>
                  <strong className="text-base font-bold text-foreground font-mono">
                    {fmt(profitData.platformTurnover)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">so&apos;m (GMV)</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Platforma sof tushumi:</span>
                  <strong className="text-base font-bold text-indigo-600 font-mono">
                    {fmt(profitData.platformRevenue)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">
                    {profitData.commissionPercent}% komissiya
                  </span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">QQS (12%):</span>
                  <strong className="text-base font-bold text-amber-600 font-mono">
                    {fmt(profitData.vatAmount)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">20-sana hisoboti</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Jami xarajatlar:</span>
                  <strong className="text-base font-bold text-red-600 font-mono">
                    {fmt(profitData.expenses.totalExpenses)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">oylik + boshqa</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Soliqqa tortiladigan foyda:</span>
                  <strong className="text-base font-bold text-foreground font-mono">
                    {fmt(profitData.taxableProfit)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">Daromad - Xarajat</span>
                </div>

                <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
                  <span className="text-[11px] text-primary block">Foyda solig&apos;i (15%):</span>
                  <strong className="text-base font-bold text-primary font-mono">
                    {fmt(profitData.profitTaxAmount)}
                  </strong>
                  <span className="text-[10px] text-primary/80 block">Choraklik to&apos;lov</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/60">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary shrink-0" />
                  <span>
                    QQS har oy 20-sana, Foyda solig&apos;i har chorak yakuni bo&apos;yicha 20-sana topshiriladi.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = `Korxona: "TILAV" MCHJ (STIR: 313296455)\nDavr: ${profitData.period}\nPlatforma aylanmasi: ${fmt(
                        profitData.platformTurnover,
                      )} so'm\nPlatforma daromadi: ${fmt(profitData.platformRevenue)} so'm\nQQS (12%): ${fmt(
                        profitData.vatAmount,
                      )} so'm\nChegiriladigan xarajatlar: ${fmt(
                        profitData.expenses.totalExpenses,
                      )} so'm\nSoliqqa tortiladigan foyda: ${fmt(
                        profitData.taxableProfit,
                      )} so'm\nFoyda solig'i (15%): ${fmt(profitData.profitTaxAmount)} so'm`;
                      handleCopyText(text, "Foyda va QQS hisob-kitobi");
                    }}
                  >
                    <Copy className="size-3.5" />
                    Raqamlarni nusxalash
                  </Button>

                  <Button
                    size="sm"
                    disabled={submitMut.isPending}
                    onClick={() => {
                      const targetPeriod = profitData.period;
                      submitMut.mutate({
                        reportType: 'profit_tax',
                        period: targetPeriod,
                        dueDate: calData?.items.find((i) => i.id === 'profit_tax')?.dueDate || '2026-10-20',
                        data: profitData as unknown as Record<string, unknown>,
                        notes: `Foyda solig'i (15%): ${fmt(profitData.profitTaxAmount)} so'm, QQS (12%): ${fmt(
                          profitData.vatAmount,
                        )} so'm`,
                        submissionConfirmation: profitConfirmNote,
                      });
                    }}
                  >
                    <Send className="size-3.5" />
                    Topshirildi deb qayd etish
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ─── 5. Topshirilgan Hisobotlar Tarixi va Arxivi ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="size-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Topshirilgan Soliq Hisobotlari Tarixi</h3>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-3">Hisobot turi</th>
                  <th className="px-4 py-3">Davr</th>
                  <th className="px-4 py-3">Oxirgi muddat</th>
                  <th className="px-4 py-3">Topshirilgan vaqt</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Qayd / Tasdiq</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyQ.data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Hozircha topshirilgan hisobotlar saqlanmagan. Yuqoridagi formalardan foydalanib topshiring.
                    </td>
                  </tr>
                ) : (
                  historyQ.data?.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {r.reportType === 'salary_ndfl'
                          ? 'Xodimlar oyligi (JShODS + Ijtimoiy)'
                          : r.reportType === 'vat'
                          ? 'QQS (12%)'
                          : "Foyda solig'i (15%)"}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{r.period}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.dueDate}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString('uz-UZ') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="success">Topshirilgan</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {r.submissionConfirmation || r.notes || "my.soliq.uz orqali qabul qilindi"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

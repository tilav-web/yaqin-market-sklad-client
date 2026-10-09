'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ExternalLink, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';

import { CalendarOverviewTab } from './fiscal-tax-reports/calendar-overview-tab';
import { ProfitTaxTab } from './fiscal-tax-reports/profit-tax-tab';
import { SalaryTaxTab } from './fiscal-tax-reports/salary-tax-tab';
import { TaxHistoryTab } from './fiscal-tax-reports/tax-history-tab';
import { TurnoverTaxTab } from './fiscal-tax-reports/turnover-tax-tab';
import { VatTaxTab } from './fiscal-tax-reports/vat-tax-tab';
import {
  EmployeeItem,
  ProfitVatCalculation,
  SUB_TABS,
  SubTab,
  TaxCalendarData,
  TaxReportRecord,
} from './fiscal-tax-reports/types';

export * from './fiscal-tax-reports/types';

export function TaxReportsSection() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<SubTab>('overview');

  /* ─── 1. Xodimlar Ro'yxati State ─── */
  const defaultEmployees: EmployeeItem[] = [
    {
      id: 'emp-director',
      name: 'TILOVOV SHAVQIDDIN S.',
      role: 'Direktor (Rahbar)',
      pinfl: '52302035660028',
      baseSalary: 1155000,
      rate: 0.25,
    },
  ];
  const [employees, setEmployees] = useState<EmployeeItem[]>(defaultEmployees);

  // Xodimlar jami hisob-kitobi (Memoized)
  const salarySummary = useMemo(() => {
    let totalGross = 0;
    let totalNdfl = 0;
    let totalInps = 0;
    let totalSocial = 0;
    let totalNet = 0;
    let totalCost = 0;

    employees.forEach((emp) => {
      const gross = Math.round(emp.baseSalary * emp.rate);
      const ndfl = Math.round(gross * 0.12);
      const inps = Math.round(gross * 0.001);
      const social = Math.round(gross * 0.12);
      const net = gross - ndfl;
      const cost = gross + social;

      totalGross += gross;
      totalNdfl += ndfl;
      totalInps += inps;
      totalSocial += social;
      totalNet += net;
      totalCost += cost;
    });

    return {
      count: employees.length,
      totalGross,
      totalNdfl,
      totalInps,
      totalSocial,
      totalNet,
      totalCost,
    };
  }, [employees]);

  /* ─── 2. QQS State ─── */
  const [vatTurnoverInput, setVatTurnoverInput] = useState<number | null>(null);
  const [vatDeductibleInput, setVatDeductibleInput] = useState<number>(0);

  /* ─── 3. Foyda solig'i State ─── */
  const [profitQuarter, setProfitQuarter] = useState<string>('2026-Q3');
  const [profitGrossInput, setProfitGrossInput] = useState<number | null>(null);
  const [profitExpenses, setProfitExpenses] = useState<{
    server: number;
    banking: number;
    other: number;
  }>({
    server: 600000,
    banking: 200000,
    other: 200000,
  });

  /* ─── 4. Aylanma soliq State ─── */
  const [turnoverOverride, setTurnoverOverride] = useState<number | null>(null);

  /* ─── Backend Queries ─── */
  const calendarQ = useQuery<TaxCalendarData>({
    queryKey: ['admin', 'tax-reports-calendar'],
    queryFn: async () => (await api.get('/admin/fiscal/tax-reports/calendar')).data,
  });

  const profitVatQ = useQuery<ProfitVatCalculation>({
    queryKey: ['admin', 'tax-reports-profit-vat'],
    queryFn: async () => (await api.get('/admin/fiscal/tax-reports/calculate-profit-vat')).data,
  });

  const historyQ = useQuery<TaxReportRecord[]>({
    queryKey: ['admin', 'tax-reports-history'],
    queryFn: async () => (await api.get('/admin/fiscal/tax-reports/history')).data,
  });

  const defaultRevenue = profitVatQ.data?.platformRevenue ?? 0;
  const effectiveVatTurnover = vatTurnoverInput !== null ? vatTurnoverInput : defaultRevenue;
  const effectiveProfitRevenue = profitGrossInput !== null ? profitGrossInput : defaultRevenue;
  const effectiveTurnover = turnoverOverride !== null ? turnoverOverride : defaultRevenue;

  /* ─── Submit Mutation ─── */
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
      toast.success('Hisobot topshirilgan deb muvaffaqiyatli saqlandi!');
      qc.invalidateQueries({ queryKey: ['admin', 'tax-reports-calendar'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tax-reports-history'] });
      setActiveTab('history');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  /* ─── Soliq Live Sync Mutation ─── */
  const syncSoliqMut = useMutation({
    mutationFn: async () => (await api.post('/admin/fiscal/tax-reports/sync-soliq')).data,
    onSuccess: (data: { message?: string }) => {
      toast.success(data?.message || 'Soliq portali bilan muvaffaqiyatli sinxronlandi!');
      qc.invalidateQueries({ queryKey: ['admin', 'tax-reports-calendar'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tax-reports-history'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} nusxalandi!`);
  };

  const handleDownloadExcel = async (customPeriod?: string) => {
    try {
      setIsDownloadingExcel(true);
      const targetPeriod =
        customPeriod ||
        calData?.items.find((i) => i.id === 'salary_ndfl')?.period ||
        '2026-08';
      const res = await api.post(
        '/admin/fiscal/tax-reports/export-excel',
        {
          reportType: 'salary_ndfl',
          period: targetPeriod,
          employees: employees.map((emp) => {
            const gross = Math.round(emp.baseSalary * emp.rate);
            const ndfl = Math.round(gross * 0.12);
            const inps = Math.round(gross * 0.001);
            const social = Math.round(gross * 0.12);
            return {
              name: emp.name,
              pinfl: emp.pinfl,
              position: emp.role,
              rate: emp.rate,
              salary: gross,
              ndfl,
              inps,
              social,
            };
          }),
        },
        { responseType: 'blob' },
      );

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `soliq_11101_20_${targetPeriod}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        `Soliq uchun Excel fayl (11101_20, ${targetPeriod}) muvaffaqiyatli shakllantirildi va yuklab olindi!`,
      );
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const calData = calendarQ.data;

  return (
    <div className="space-y-6">
      {/* ─── Rekvizitlar Bosh Paneli ─── */}
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
                  Rahbar:{' '}
                  <strong className="text-foreground">
                    {calData?.companyInfo.director || 'Tilovov Shavqiddin S.'}
                  </strong>
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
              <Badge variant="success" className="font-medium">
                {calData?.companyInfo.taxRegime ||
                  'Soddalashtirilgan tizim (Aylanmadan olinadigan soliq — 4%)'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => syncSoliqMut.mutate()}
              disabled={syncSoliqMut.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
              title="Serverdagi E-IMZO orqali my.soliq.uz bilan live sinxronlash"
            >
              <RefreshCw
                className={cn('size-3.5', syncSoliqMut.isPending && 'animate-spin')}
              />
              {syncSoliqMut.isPending ? 'Sinxronlanmoqda...' : '🔄 Soliqdan yangilash (Live)'}
            </Button>
            <a
              href="https://oldmy.soliq.uz"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              title="oldmy.soliq.uz hisobotlar jurnaliga o'tish"
            >
              <ExternalLink className="size-3.5" />
              my.soliq.uz
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
              Taqvim
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── Sub-Tablar Navbari ─── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
        {SUB_TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
              {t.badge && (
                <span
                  className={cn(
                    'ml-1 rounded px-1.5 py-0.2 text-[10px] font-bold',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'overview' && (
        <CalendarOverviewTab
          calData={calData}
          setActiveTab={setActiveTab}
          handleDownloadExcel={handleDownloadExcel}
          isDownloadingExcel={isDownloadingExcel}
        />
      )}

      {activeTab === 'salary' && (
        <SalaryTaxTab
          employees={employees}
          setEmployees={setEmployees}
          defaultEmployees={defaultEmployees}
          salarySummary={salarySummary}
          calData={calData}
          handleDownloadExcel={handleDownloadExcel}
          isDownloadingExcel={isDownloadingExcel}
          handleCopyText={handleCopyText}
          submitMut={submitMut}
        />
      )}

      {activeTab === 'turnover' && (
        <TurnoverTaxTab
          calData={calData}
          turnoverOverride={turnoverOverride}
          setTurnoverOverride={setTurnoverOverride}
          effectiveTurnover={effectiveTurnover}
          submitMut={submitMut}
          handleCopyText={handleCopyText}
        />
      )}

      {activeTab === 'vat' && (
        <VatTaxTab
          calData={calData}
          effectiveVatTurnover={effectiveVatTurnover}
          setVatTurnoverInput={setVatTurnoverInput}
          vatDeductibleInput={vatDeductibleInput}
          setVatDeductibleInput={setVatDeductibleInput}
          submitMut={submitMut}
          handleCopyText={handleCopyText}
        />
      )}

      {activeTab === 'profit' && (
        <ProfitTaxTab
          profitQuarter={profitQuarter}
          setProfitQuarter={setProfitQuarter}
          profitExpenses={profitExpenses}
          setProfitExpenses={setProfitExpenses}
          effectiveProfitRevenue={effectiveProfitRevenue}
          setProfitGrossInput={setProfitGrossInput}
          salarySummary={salarySummary}
          submitMut={submitMut}
          handleCopyText={handleCopyText}
        />
      )}

      {activeTab === 'history' && <TaxHistoryTab historyQ={historyQ} />}
    </div>
  );
}

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
  FileSpreadsheet,
  HelpCircle,
  History,
  Info,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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

export interface EmployeeItem {
  id: string;
  name: string;
  role: string;
  pinfl: string;
  baseSalary: number;
  rate: number; // 0.25, 0.5, 1.0
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
  turnoverTaxRate?: number;
  turnoverTaxAmount?: number;
}

type SubTab = 'overview' | 'salary' | 'vat' | 'profit' | 'turnover' | 'history';

const SUB_TABS: { key: SubTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: 'overview', label: 'Umumiy & Taqvim', icon: Calendar },
  { key: 'salary', label: 'Xodimlar & Oylik (15-sana)', icon: Users },
  { key: 'vat', label: 'QQS 12% (20-sana)', icon: ReceiptText },
  { key: 'profit', label: 'Foyda Solig\u02BBi 15% (Choraklik)', icon: TrendingUp },
  { key: 'turnover', label: 'Aylanma Solig\u02BBi 4%', icon: Coins },
  { key: 'history', label: 'Hisobotlar Tarixi', icon: History },
];

const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ');

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

  // Yangi xodim qo'shish formasi
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Xodim / Mutaxassis');
  const [newEmpPinfl, setNewEmpPinfl] = useState('');
  const [newEmpRate, setNewEmpRate] = useState(0.25);
  const [newEmpBase, setNewEmpBase] = useState(1155000);

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
  const [vatDeductibleInput, setVatDeductibleInput] = useState<number>(0); // Kiruvchi QQS

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

  // Avtomatik backend qiymatlaridan hosil bo'lgan aktiv qiymatlar
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

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} nusxalandi!`);
  };

  const handleDownloadExcel = async () => {
    try {
      setIsDownloadingExcel(true);
      const targetPeriod =
        calData?.items.find((i) => i.id === 'salary_ndfl')?.period || '2026-08';
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
        "Soliq uchun Excel fayl (11101_20) muvaffaqiyatli shakllantirildi va yuklab olindi!",
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
              <Badge variant="success" className="font-medium">
                {calData?.companyInfo.taxRegime || 'Soddalashtirilgan tizim (Aylanmadan olinadigan soliq — 4%)'}
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
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: UMUMIY & TAQVIM ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Soliq Taqvimi &amp; Yaqinlashayotgan Muddatlar</h3>
              <p className="text-xs text-muted-foreground">
                MCHJ uchun barcha qonuniy soliqlar va ularning topshirilish muddatlari monitoringi
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Bugungi sana: <strong>{calData?.today || new Date().toISOString().slice(0, 10)}</strong>
            </span>
          </div>

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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {calData?.items.map((item) => {
              const isOverdue = item.status === 'overdue';
              const isSubmitted = item.status === 'submitted';
              const isUrgent = !isSubmitted && item.daysRemaining <= 3 && item.daysRemaining >= 0;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    'flex flex-col justify-between p-4 transition-all',
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
                    <Button
                      size="sm"
                      variant={isOverdue ? 'destructive' : isSubmitted ? 'outline' : 'default'}
                      className="w-full text-xs"
                      onClick={() => {
                        if (item.type === 'salary_ndfl') setActiveTab('salary');
                        else if (item.type === 'vat') setActiveTab('vat');
                        else if (item.type === 'profit_tax') setActiveTab('profit');
                      }}
                    >
                      {isSubmitted ? 'Hisobotni ko\u02BBrib chiqish' : 'Ushbu hisobotni to\u02BBldirish'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: XODIMLAR & OYLIK HISOBOTI (15-SANA) ─── */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {/* Yo'riqnoma kartasi */}
          <Card className="border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <Info className="size-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1 text-xs text-blue-900 dark:text-blue-200">
                <strong className="font-semibold text-sm">
                  Xodimlar (JShODS va Ijtimoiy soliq) hisoboti — Qonuniy asos:
                </strong>
                <p>
                  • <strong>Muddat:</strong> Har oyning 15-sanasidan kechiktirmay (Soliq kodeksi 389-modda).
                  <br />
                  • <strong>0.25 stavka:</strong> Agar korxonada o&apos;zingizdan boshqa xodim bo&apos;lmasa,
                  soliq va xarajatlarni minimal qilish uchun 0.25 stavka belgilash qonuniydir (O&apos;zR Mehnat kodeksi 186-modda).
                  <br />
                  • <strong>Stavkalar:</strong> JShODS — 12% (shundan 0.1% Xalq banki INPSga), Ijtimoiy soliq — 12% (korxonadan).
                </p>
              </div>
            </div>
          </Card>

          {/* Xodimlar ro'yxati va tahrirlash */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Shtat Jadvali va Xodimlar</h3>
                <p className="text-xs text-muted-foreground">
                  Istalgan xodimni qo&apos;shishingiz, o&apos;chirishingiz yoki stavkasi va okladini o&apos;zgartirishingiz mumkin
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExcel}
                  disabled={isDownloadingExcel}
                  className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  title="my.soliq.uz ga yuklash uchun 11101_20 shablonini to'ldirib yuklab olish"
                >
                  <FileSpreadsheet className="size-3.5 text-emerald-600" />
                  {isDownloadingExcel ? 'Yuklanmoqda...' : 'Soliq Excel shabloni (11101_20)'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEmployees(defaultEmployees)}
                  title="Faqat bitta direktor 0.25 stavka holatiga qaytarish"
                >
                  <RotateCcw className="size-3.5" />
                  Standartga qaytarish (0.25 st.)
                </Button>
                <Button size="sm" onClick={() => setShowAddEmp(!showAddEmp)}>
                  <Plus className="size-3.5" />
                  Xodim qo&apos;shish
                </Button>
              </div>
            </div>

            {/* Yangi xodim qo'shish formasi */}
            {showAddEmp && (
              <Card className="p-4 border-primary/40 bg-primary/5 space-y-3">
                <h4 className="text-xs font-bold text-foreground">Yangi xodim ma&apos;lumotlari</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      F.I.O.
                    </label>
                    <Input
                      placeholder="Masalan: Karimov Jasur"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Lavozimi
                    </label>
                    <Input
                      placeholder="Kuryer, sotuvchi va h.k."
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      PINFL (JShSHIR)
                    </label>
                    <Input
                      placeholder="14 xonali raqam"
                      value={newEmpPinfl}
                      onChange={(e) => setNewEmpPinfl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Bazaviy Oklad
                    </label>
                    <Input
                      type="number"
                      value={newEmpBase}
                      onChange={(e) => setNewEmpBase(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Stavka
                    </label>
                    <select
                      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none"
                      value={newEmpRate}
                      onChange={(e) => setNewEmpRate(parseFloat(e.target.value))}
                    >
                      <option value="0.25">0.25 stavka (chorak)</option>
                      <option value="0.5">0.5 stavka (yarim)</option>
                      <option value="1.0">1.0 stavka (to&apos;liq)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddEmp(false)}>
                    Bekor qilish
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!newEmpName.trim()) {
                        toast.error('Xodim ism-sharifi kiritilishi shart');
                        return;
                      }
                      setEmployees([
                        ...employees,
                        {
                          id: `emp-${Date.now()}`,
                          name: newEmpName.trim(),
                          role: newEmpRole.trim(),
                          pinfl: newEmpPinfl.trim(),
                          baseSalary: newEmpBase,
                          rate: newEmpRate,
                        },
                      ]);
                      setNewEmpName('');
                      setShowAddEmp(false);
                      toast.success('Xodim ro\u02BByxatga qo\u02BBshildi!');
                    }}
                  >
                    Saqlash
                  </Button>
                </div>
              </Card>
            )}

            {/* Xodimlar jadvali */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Xodim F.I.O. &amp; Lavozim</th>
                      <th className="px-4 py-3">Stavka</th>
                      <th className="px-4 py-3">Hisoblangan Oklad</th>
                      <th className="px-4 py-3">JShODS (12%)</th>
                      <th className="px-4 py-3">Ijtimoiy (12%)</th>
                      <th className="px-4 py-3">Qo&apos;lga tegadigan</th>
                      <th className="px-4 py-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {employees.map((emp) => {
                      const gross = Math.round(emp.baseSalary * emp.rate);
                      const ndfl = Math.round(gross * 0.12);
                      const social = Math.round(gross * 0.12);
                      const net = gross - ndfl;

                      return (
                        <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <strong className="font-semibold text-foreground block">{emp.name}</strong>
                            <span className="text-muted-foreground text-[11px]">{emp.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {[0.25, 0.5, 1.0].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() =>
                                    setEmployees(
                                      employees.map((e) => (e.id === emp.id ? { ...e, rate: s } : e)),
                                    )
                                  }
                                  className={cn(
                                    'rounded px-1.5 py-0.5 text-[11px] font-bold border transition-all',
                                    emp.rate === s
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border bg-card text-muted-foreground hover:bg-muted',
                                  )}
                                >
                                  {s} st.
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-foreground">
                            {fmt(gross)} so&apos;m
                          </td>
                          <td className="px-4 py-3 font-mono text-red-600 font-semibold">
                            {fmt(ndfl)} so&apos;m
                          </td>
                          <td className="px-4 py-3 font-mono text-indigo-600 font-semibold">
                            {fmt(social)} so&apos;m
                          </td>
                          <td className="px-4 py-3 font-mono text-emerald-600 font-bold">
                            {fmt(net)} so&apos;m
                          </td>
                          <td className="px-4 py-3 text-right">
                            {employees.length > 1 && (
                              <button
                                onClick={() => setEmployees(employees.filter((e) => e.id !== emp.id))}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="O'chirish"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Jami hisob-kitob kartasi */}
            <Card className="p-5 bg-gradient-to-r from-card to-primary/5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Jami Oylik Fondi &amp; To&apos;lanadigan Soliqlar ({salarySummary.count} nafar xodim)
                </span>
                <Badge variant="primary">Har oy 15-sana</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-lg bg-card p-3 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Jami hisoblangan:</span>
                  <strong className="text-base font-bold text-foreground font-mono">
                    {fmt(salarySummary.totalGross)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">so&apos;m/oy</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Jami JShODS (12%):</span>
                  <strong className="text-base font-bold text-red-600 font-mono">
                    {fmt(salarySummary.totalNdfl)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">
                    shundan INPS: {fmt(salarySummary.totalInps)}
                  </span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Ijtimoiy soliq (12%):</span>
                  <strong className="text-base font-bold text-indigo-600 font-mono">
                    {fmt(salarySummary.totalSocial)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">korxona hisobidan</span>
                </div>

                <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">
                    Qo&apos;lga tegadigan:
                  </span>
                  <strong className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {fmt(salarySummary.totalNet)}
                  </strong>
                  <span className="text-[10px] text-emerald-600/80 block">sof xodimlar maoshi</span>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Korxona jami xarajati:</span>
                  <strong className="text-base font-bold text-foreground font-mono">
                    {fmt(salarySummary.totalCost)}
                  </strong>
                  <span className="text-[10px] text-muted-foreground block">oklad + ijtimoiy</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="size-4 text-primary shrink-0" />
                  <span>
                    my.soliq.uz portaliga xodimlar soni va ushbu raqamlarni kiritasiz.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadExcel}
                    disabled={isDownloadingExcel}
                    className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    title="my.soliq.uz ga yuklash uchun 11101_20 shablonini to'ldirib yuklab olish"
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-600" />
                    {isDownloadingExcel ? 'Yuklanmoqda...' : 'Excel shablonni yuklab olish (.xlsx)'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = `Korxona: "TILAV" MCHJ (STIR: 313296455)\nXodimlar soni: ${salarySummary.count}\nJami oklad: ${fmt(
                        salarySummary.totalGross,
                      )} so'm\nJShODS (12%): ${fmt(salarySummary.totalNdfl)} so'm (INPS: ${fmt(
                        salarySummary.totalInps,
                      )} so'm)\nIjtimoiy soliq (12%): ${fmt(
                        salarySummary.totalSocial,
                      )} so'm\nQo'lga tegadigan: ${fmt(salarySummary.totalNet)} so'm\nJami korxona xarajati: ${fmt(
                        salarySummary.totalCost,
                      )} so'm`;
                      handleCopyText(text, 'Oylik hisobot ma\u02BBlumotlari');
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
                        data: {
                          employees,
                          summary: salarySummary,
                        },
                        notes: `Xodimlar soni: ${salarySummary.count}, Jami oklad: ${fmt(
                          salarySummary.totalGross,
                        )} so'm`,
                      });
                    }}
                  >
                    <Send className="size-3.5" />
                    Topshirildi deb qayd etish
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB 3: QQS 12% (20-SANA) ─── */}
      {activeTab === 'vat' && (
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
                    onChange={(e) => setVatTurnoverInput(Number(e.target.value))}
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
                    onChange={(e) => setVatDeductibleInput(Number(e.target.value))}
                    className="font-mono text-sm"
                  />
                  <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Didox orqali sizga kelgan va to&apos;langan EHF fakturalaridagi QQS
                </span>
              </div>
            </div>

            {/* QQS hisob-kitob natijasi */}
            {(() => {
              const grossVat = Math.round((effectiveVatTurnover * 0.12) / 1.12);
              const netPayableVat = Math.max(0, grossVat - vatDeductibleInput);

              return (
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
              );
            })()}
          </Card>
        </div>
      )}

      {/* ─── TAB 4: FOYDA SOLIG'I 15% (CHORAKLIK — 20-SANA) ─── */}
      {activeTab === 'profit' && (
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
                  onChange={(e) => setProfitQuarter(e.target.value)}
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
                    onChange={(e) => setProfitGrossInput(Number(e.target.value))}
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
                    onChange={(e) =>
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
                    onChange={(e) =>
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
                    onChange={(e) =>
                      setProfitExpenses({ ...profitExpenses, other: Number(e.target.value) })
                    }
                    className="font-mono text-sm"
                  />
                  <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
                </div>
              </div>
            </div>

            {/* Hisoblangan natijalar */}
            {(() => {
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
              );
            })()}
          </Card>
        </div>
      )}

      {/* ─── TAB 5: AYLANMA SOLIG'I 4% (MUQOBIL TIZIM) ─── */}
      {activeTab === 'turnover' && (
        <div className="space-y-6">
          <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <Info className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
                <strong className="font-semibold text-sm">
                  Aylanmadan olinadigan soliq (AOS — 4%) — Qonuniy asos:
                </strong>
                <p>
                  • <strong>Muddat:</strong> Har oyning 15-sanasidan kechiktirmay (Soliq kodeksi 470-modda).
                  <br />
                  • <strong>Kimlar uchun:</strong> Yillik aylanmasi 1 milliard so&apos;mgacha bo&apos;lgan soddalashtirilgan tizimdagi MCHJlar.
                  <br />
                  • <strong>Formula:</strong> Aylanma (tushum) × 4%. Xarajatlar chegirilmaydi, QQS va Foyda solig&apos;i o&apos;rniga yagona to&apos;lov to&apos;lanadi.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-bold text-foreground">Aylanma Solig&apos;i Kalkulyatori</h4>
                <p className="text-xs text-muted-foreground">
                  Agar korxonangiz soddalashtirilgan tizimga o&apos;tsa yoki hisob-kitobni solishtirmoqchi bo&apos;lsangiz
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
                  onChange={(e) => setTurnoverOverride(Number(e.target.value))}
                  className="font-mono text-sm"
                />
                <span className="absolute right-3 top-2 text-xs text-muted-foreground">so&apos;m</span>
              </div>
            </div>

            {(() => {
              const turnoverTax = Math.round(effectiveTurnover * 0.04);

              return (
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
              );
            })()}
          </Card>
        </div>
      )}

      {/* ─── TAB 6: HISOBOTLAR TARIXI & ARXIVI ─── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Topshirilgan Soliq Hisobotlari Tarixi</h3>
              <p className="text-xs text-muted-foreground">
                Tizim orqali tasdiqlangan va Soliqqa yuborilgan barcha hisobotlar arxivi
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => historyQ.refetch()}
              disabled={historyQ.isFetching}
            >
              <RefreshCw className={cn('size-3.5', historyQ.isFetching && 'animate-spin')} />
              Yangilash
            </Button>
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
                    <th className="px-4 py-3">Tafsilot / Qayd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historyQ.data?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Hozircha saqlangan hisobotlar mavjud emas. Yuqoridagi tablardan hisobotni to&apos;ldirib topshiring.
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
                            : r.reportType === 'profit_tax'
                            ? 'Foyda solig\u02BBi (15%)'
                            : 'Aylanma solig\u02BBi (4%)'}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">{r.period}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.dueDate}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleString('uz-UZ') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="success">
                            <Check className="size-3" /> Topshirilgan
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                          {r.notes || r.submissionConfirmation || 'my.soliq.uz orqali qabul qilindi'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

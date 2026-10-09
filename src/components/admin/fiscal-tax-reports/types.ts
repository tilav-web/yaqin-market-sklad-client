import React from 'react';
import {
  Calendar,
  Coins,
  History,
  ReceiptText,
  TrendingUp,
  Users,
} from 'lucide-react';

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

export interface SoliqSyncMeta {
  reportNumber?: string;
  packet?: string;
  status?: 'accepted' | 'error' | 'draft' | 'pending';
  statusRaw?: string;
  errorReason?: string | null;
  lastSyncedAt?: string;
}

export interface TaxCalendarAlert {
  id: string;
  level: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  reportNumber?: string;
  packet?: string;
}

export interface TaxCalendarItem {
  id: string;
  type: string;
  packet?: string;
  title: string;
  subtitle: string;
  period: string;
  periodLabel: string;
  dueDate: string;
  daysRemaining: number;
  status: 'pending' | 'submitted' | 'overdue' | 'error' | 'draft';
  submittedReport?: TaxReportRecord | null;
  soliqSync?: SoliqSyncMeta;
  standardDay: number;
  description: string;
}

export interface TaxCalendarData {
  today: string;
  companyInfo: {
    name: string;
    tin: string;
    pinfl: string;
    director: string;
    taxRegime: string;
  };
  items: TaxCalendarItem[];
  alerts?: TaxCalendarAlert[];
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

export interface ProfitVatCalculation {
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

export type SubTab =
  | 'overview'
  | 'salary'
  | 'turnover'
  | 'history'
  | 'vat'
  | 'profit';

export const SUB_TABS: {
  key: SubTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}[] = [
  { key: 'overview', label: 'Umumiy & Taqvim', icon: Calendar },
  {
    key: 'salary',
    label: 'Xodimlar & Oylik (11101_20)',
    icon: Users,
    badge: '15-sana',
  },
  {
    key: 'turnover',
    label: 'Aylanma Solig\u02BBi 4% (10104_36)',
    icon: Coins,
    badge: 'Asosiy',
  },
  { key: 'history', label: 'Hisobotlar Tarixi', icon: History },
  { key: 'vat', label: 'QQS 12% (Mavjud emas)', icon: ReceiptText },
  {
    key: 'profit',
    label: 'Foyda Solig\u02BBi 15% (Mavjud emas)',
    icon: TrendingUp,
  },
];

export const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ');

export interface SalarySummary {
  count: number;
  totalGross: number;
  totalNdfl: number;
  totalInps: number;
  totalSocial: number;
  totalNet: number;
  totalCost: number;
}

export type SoliqCalendarResponse = TaxCalendarData;
export type SubmittedReport = TaxReportRecord;

export interface SubmitReportPayload {
  reportType: string;
  period: string;
  dueDate: string;
  data: Record<string, unknown>;
  notes?: string;
  submissionConfirmation?: string;
}

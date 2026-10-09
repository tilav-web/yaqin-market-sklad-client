'use client';

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { SubTab, TaxCalendarData } from './types';

interface CalendarOverviewTabProps {
  calData?: TaxCalendarData;
  setActiveTab: (tab: SubTab) => void;
  handleDownloadExcel: (period: string) => void;
  isDownloadingExcel: boolean;
}

export function CalendarOverviewTab({
  calData,
  setActiveTab,
  handleDownloadExcel,
  isDownloadingExcel,
}: CalendarOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Soliq Taqvimi &amp; Yaqinlashayotgan Muddatlar
          </h3>
          <p className="text-xs text-muted-foreground">
            MCHJ uchun barcha soliqlar va ularning topshirilish muddatlari monitoringi
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Bugungi sana:{' '}
          <strong>{calData?.today || new Date().toISOString().slice(0, 10)}</strong>
        </span>
      </div>

      {/* Soliq portalidan kelgan muhim xabarlar & ogohlantirishlar */}
      {calData?.alerts && calData.alerts.length > 0 && (
        <div className="space-y-3">
          {calData.alerts.map((alt) => (
            <div
              key={alt.id}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
                alt.level === 'warning' &&
                  'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
                alt.level === 'error' &&
                  'border-red-300 bg-red-50 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200',
                alt.level === 'info' &&
                  'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200',
              )}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={cn(
                    'size-5 shrink-0 mt-0.5',
                    alt.level === 'warning' &&
                      'text-amber-600 dark:text-amber-400',
                    alt.level === 'error' && 'text-red-600 dark:text-red-400',
                    alt.level === 'info' && 'text-blue-600 dark:text-blue-400',
                  )}
                />
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-bold text-sm">{alt.title}</strong>
                    {alt.reportNumber && (
                      <Badge variant="neutral" className="text-[10px] font-mono">
                        № {alt.reportNumber}
                      </Badge>
                    )}
                    {alt.packet && (
                      <Badge variant="neutral" className="text-[10px] font-mono">
                        Пакет {alt.packet}
                      </Badge>
                    )}
                  </div>
                  <p className="leading-relaxed opacity-95">{alt.message}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                {alt.id === 'sep_premature_error' && (
                  <Button
                    size="sm"
                    onClick={() => handleDownloadExcel('2026-08')}
                    disabled={isDownloadingExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    <FileSpreadsheet className="size-3.5" />
                    Avgust Excel shabloni
                  </Button>
                )}
                {alt.id === 'turnover_auto_draft' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('turnover')}
                    className="text-xs"
                  >
                    Aylanma soliqqa o&apos;tish
                  </Button>
                )}
                <a
                  href="https://oldmy.soliq.uz"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <ExternalLink className="size-3" />
                  Soliqqa kirish
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {calData?.hasOverdue && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="size-5 shrink-0 text-red-600" />
          <div className="text-sm">
            <strong className="font-semibold">
              Diqqat! Muddati o&apos;tgan soliq hisoboti mavjud!
            </strong>
            <p className="text-xs opacity-90">
              Soliq inspeksiyasi hisob raqamni bloklamasligi yoki jarima
              qo&apos;llamasligi uchun kechiktirilgan hisobotni darhol topshiring.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {calData?.items.map((item) => {
          const isOverdue = item.status === 'overdue';
          const isSubmitted = item.status === 'submitted';
          const isError = item.status === 'error';
          const isDraft = item.status === 'draft';
          const isUrgent =
            !isSubmitted && item.daysRemaining <= 3 && item.daysRemaining >= 0;

          return (
            <Card
              key={item.id}
              className={cn(
                'flex flex-col justify-between p-4 transition-all',
                isError &&
                  'border-amber-400 bg-amber-500/5 dark:border-amber-800',
                isDraft &&
                  'border-blue-300 bg-blue-500/5 dark:border-blue-900',
                isOverdue &&
                  'border-red-300 bg-red-500/5 dark:border-red-900',
                isUrgent &&
                  !isError &&
                  'border-amber-300 bg-amber-500/5 dark:border-amber-900',
                isSubmitted &&
                  'border-emerald-300 bg-emerald-500/5 dark:border-emerald-900',
              )}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                      isSubmitted &&
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                      isOverdue &&
                        'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
                      isDraft &&
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
                      isError &&
                        'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
                      !isSubmitted &&
                        !isOverdue &&
                        !isDraft &&
                        !isError &&
                        'bg-primary/10 text-primary',
                    )}
                  >
                    <Clock className="size-3" />
                    Har oy {item.standardDay}-sana
                  </span>

                  {isSubmitted ? (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3" /> Soliqda qabul
                    </Badge>
                  ) : isError ? (
                    <Badge variant="danger">
                      <AlertCircle className="size-3" /> Soliqda xatolik
                    </Badge>
                  ) : isDraft ? (
                    <Badge
                      variant="neutral"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    >
                      <Clock className="size-3" /> Avtomat qoralama
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
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-foreground">
                      {item.title}
                    </h4>
                    {item.packet && (
                      <Badge variant="neutral" className="text-[10px] font-mono">
                        {item.packet}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>

                {item.soliqSync?.reportNumber && (
                  <div className="flex items-center justify-between rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 text-[11px]">
                    <span className="text-muted-foreground">Soliq hisobot №:</span>
                    <span className="font-mono font-bold text-foreground">
                      {item.soliqSync.reportNumber}
                    </span>
                  </div>
                )}

                <div className="rounded-lg bg-muted/60 p-2.5 text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Hisobot davri:</span>
                    <strong className="text-foreground">{item.periodLabel}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Oxirgi muddat:</span>
                    <strong
                      className={cn(
                        isOverdue ? 'text-red-600 font-bold' : 'text-foreground',
                      )}
                    >
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
                  variant={
                    isOverdue
                      ? 'destructive'
                      : isSubmitted
                        ? 'outline'
                        : 'default'
                  }
                  className="w-full text-xs"
                  onClick={() => {
                    if (item.id === 'salary_ndfl') setActiveTab('salary');
                    else if (item.id === 'turnover_tax') setActiveTab('turnover');
                    else if (item.id === 'vat') setActiveTab('vat');
                    else if (item.id === 'profit_tax') setActiveTab('profit');
                  }}
                >
                  {item.id === 'salary_ndfl'
                    ? 'Xodimlar & Excel shablon'
                    : item.id === 'turnover_tax'
                      ? "Aylanma soliqni ko'rish"
                      : isSubmitted
                        ? "Hisobotni ko'rish"
                        : "Ko'rib chiqish"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

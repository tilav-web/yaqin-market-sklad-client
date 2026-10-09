'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SubmittedReport } from './types';

export interface TaxHistoryTabProps {
  historyQ: {
    data?: SubmittedReport[];
    isFetching: boolean;
    refetch: () => void;
  };
}

export function TaxHistoryTab({ historyQ }: TaxHistoryTabProps) {
  return (
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
  );
}

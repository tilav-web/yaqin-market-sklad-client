'use client';

import {
  AlertCircle,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Info,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';
import type { EmployeeItem, TaxCalendarData } from './types';
import { fmt } from './types';

interface SalaryTaxTabProps {
  employees: EmployeeItem[];
  setEmployees: React.Dispatch<React.SetStateAction<EmployeeItem[]>>;
  defaultEmployees: EmployeeItem[];
  salarySummary: {
    count: number;
    totalGross: number;
    totalNdfl: number;
    totalInps: number;
    totalSocial: number;
    totalNet: number;
    totalCost: number;
  };
  calData?: TaxCalendarData;
  handleDownloadExcel: (period?: string) => void;
  isDownloadingExcel: boolean;
  handleCopyText: (text: string, label: string) => void;
  submitMut: {
    isPending: boolean;
    mutate: (payload: {
      reportType: string;
      period: string;
      dueDate: string;
      data: Record<string, unknown>;
      notes?: string;
    }) => void;
  };
}

export function SalaryTaxTab({
  employees,
  setEmployees,
  defaultEmployees,
  salarySummary,
  calData,
  handleDownloadExcel,
  isDownloadingExcel,
  handleCopyText,
  submitMut,
}: SalaryTaxTabProps) {
  const [salaryPeriod, setSalaryPeriod] = useState<string>('2026-08');

  // Yangi xodim qo'shish formasi
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Xodim / Mutaxassis');
  const [newEmpPinfl, setNewEmpPinfl] = useState('');
  const [newEmpRate, setNewEmpRate] = useState(0.25);
  const [newEmpBase, setNewEmpBase] = useState(1155000);

  return (
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

      {/* Sentyabr premature xatolik ogohlantirishi & Avgust davrini tanlash */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <strong className="font-bold text-sm">
                  Muhim: 15-sentyabrgacha Avgust 2026 oyi hisoboti topshiriladi!
                </strong>
                <Badge variant="neutral" className="text-[10px] font-mono">
                  Пакет 11101_20
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                Soliqdagi rad sababi: &quot;Ҳисобот даври тугамаган&quot;
              </span>
            </div>
            <p className="leading-relaxed">
              Agar oldin yuborilgan hisobotda <em>&quot;Ҳисобот даври тугамаган&quot;</em> xatoligi berilgan bo&apos;lsa,
              buning sababi Soliq saytida davr sifatida <strong>&quot;Сентябрь&quot;</strong> tanlanganidir.
              O&apos;zbekiston Soliq kodeksiga binoan, 15-sentyabrgacha o&apos;tgan oy —{' '}
              <strong>&quot;Август&quot;</strong> oyi hisoboti topshiriladi. Sentyabr oyi hisoboti esa 1-oktyabrdan ochiladi.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[11px] font-semibold">
                Davrni tanlang:
              </span>
              <select
                value={salaryPeriod}
                onChange={(e) => setSalaryPeriod(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold outline-none"
              >
                <option value="2026-08">2026-08 (Avgust — Hozir topshirilishi shart)</option>
                <option value="2026-09">2026-09 (Sentyabr — 1-oktyabrdan)</option>
                <option value="2026-07">2026-07 (Iyul)</option>
              </select>
              <Button
                size="sm"
                onClick={() => handleDownloadExcel(salaryPeriod)}
                disabled={isDownloadingExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
              >
                <FileSpreadsheet className="size-3.5" />
                {salaryPeriod} uchun Excel yuklab olish
              </Button>
              <a
                href="https://oldmy.soliq.uz"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ExternalLink className="size-3" />
                my.soliq.uz ga kirish
              </a>
            </div>
          </div>
        </div>
      </div>

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
              onClick={() => handleDownloadExcel(salaryPeriod)}
              disabled={isDownloadingExcel}
              className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              title="my.soliq.uz ga yuklash uchun 11101_20 shablonini to'ldirib yuklab olish"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              {isDownloadingExcel ? 'Yuklanmoqda...' : `Excel shablon (${salaryPeriod})`}
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
                onClick={() => handleDownloadExcel()}
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
  );
}

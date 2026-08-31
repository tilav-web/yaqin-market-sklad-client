'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  Landmark,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Store,
  X,
  XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useEscapeKey } from '@/lib/use-escape-key';
import { toast } from '@/stores/toast';

interface SellerApplication {
  id: string;
  firstName: string;
  lastName: string;
  contactPhone: string | null;
  stir: string | null;
  companyName: string | null;
  entityType: string | null;
  legalAddress: string | null;
  bankAccountNumber?: string | null;
  bankMfo?: string | null;
  bankName?: string | null;
  bankAccountHolderName?: string | null;
  bankCardNumber: string | null;
  bankCardHolderName: string | null;
  soliqConfirmed: boolean;
  ofertaAccepted: boolean;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  user: { id: string; phone: string; name: string | null };
}

interface ApproveForm {
  fullName: string;
  passportOrPinfl: string;
  stir: string;
  entityType: string;
  bankAccountNumber: string;
  bankMfo: string;
  bankName: string;
  bankAccountHolderName: string;
  bankCardNumber: string;
  bankCardHolderName: string;
  contractNumber: string;
  contractDate: string;
  adminNotes: string;
}

const EMPTY_APPROVE: ApproveForm = {
  fullName: '',
  passportOrPinfl: '',
  stir: '',
  entityType: '',
  bankAccountNumber: '',
  bankMfo: '',
  bankName: '',
  bankAccountHolderName: '',
  bankCardNumber: '',
  bankCardHolderName: '',
  contractNumber: '',
  contractDate: '',
  adminNotes: '',
};

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string; icon: React.ElementType }[] = [
  { key: 'pending', label: 'Kutilmoqda', icon: Clock },
  { key: 'approved', label: 'Tasdiqlangan', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rad etilgan', icon: XCircle },
  { key: 'all', label: 'Barcha arizalar', icon: FileText },
];

const EMPTY_APPS: SellerApplication[] = [];

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingApp, setApprovingApp] = useState<SellerApplication | null>(null);
  const [approveForm, setApproveForm] = useState<ApproveForm>(EMPTY_APPROVE);
  const [approveErr, setApproveErr] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectErr, setRejectErr] = useState('');

  useEscapeKey(Boolean(approvingApp || rejectingId), () => {
    if (approvingApp) setApprovingApp(null);
    if (rejectingId) setRejectingId(null);
  });

  const appsQuery = useQuery({
    queryKey: ['admin', 'applications'],
    queryFn: async () => {
      const res = await api.get<SellerApplication[]>('/sellers/admin/applications');
      return res.data;
    },
  });

  const apps = appsQuery.data ?? EMPTY_APPS;

  const counts = useMemo(
    () => ({
      pending: apps.filter((a) => a.status === 'pending').length,
      approved: apps.filter((a) => a.status === 'approved').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      all: apps.length,
    }),
    [apps],
  );

  const filteredList = useMemo(() => {
    let list = apps;
    if (filter !== 'all') {
      list = list.filter((a) => a.status === filter);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((a) => {
        const matchName = `${a.firstName} ${a.lastName}`.toLowerCase().includes(q);
        const matchComp = (a.companyName || '').toLowerCase().includes(q);
        const matchStir = (a.stir || '').includes(q);
        const matchPhone = (a.contactPhone || a.user.phone || '').includes(q);
        return matchName || matchComp || matchStir || matchPhone;
      });
    }
    return list;
  }, [apps, filter, searchQuery]);

  const approveMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<ApproveForm>;
    }) => {
      await api.post(`/sellers/admin/applications/${id}/approve`, body);
    },
    onSuccess: () => {
      setApprovingApp(null);
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      qc.invalidateQueries({ queryKey: ['admin', 'applications-pending-count'] });
      toast.success('Do\'kon arizasi muvaffaqiyatli tasdiqlandi!');
    },
    onError: (e: unknown) => setApproveErr(extractErrorMessage(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }) => {
      await api.post(`/sellers/admin/applications/${id}/reject`, { reason });
    },
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      setRejectErr('');
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      qc.invalidateQueries({ queryKey: ['admin', 'applications-pending-count'] });
      toast.success('Ariza rad etildi');
    },
    onError: (e: unknown) => setRejectErr(extractErrorMessage(e)),
  });

  const openApproveDialog = (app: SellerApplication) => {
    setApproveForm({
      ...EMPTY_APPROVE,
      fullName: `${app.firstName} ${app.lastName}`.trim(),
      stir: app.stir ?? '',
      entityType: app.entityType ?? '',
      bankAccountNumber: app.bankAccountNumber ?? '',
      bankMfo: app.bankMfo ?? '',
      bankName: app.bankName ?? '',
      bankAccountHolderName: app.bankAccountHolderName ?? app.companyName ?? `${app.firstName} ${app.lastName}`.trim(),
      bankCardNumber: app.bankCardNumber ?? '',
      bankCardHolderName: app.bankCardHolderName ?? '',
    });
    setApproveErr('');
    setApprovingApp(app);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Do'kon Ochish Arizalari"
        description="Yangi sotuvchilar (seller) yuborgan arizalar, STIR tekshiruvlari va shartnomalarni tasdiqlash"
        breadcrumbs={[{ label: 'Savdo & Do\'konlar', href: '/admin/shops' }, { label: 'Arizalar' }]}
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="F.I.SH, STIR, telefon yoki do'kon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded-xl border border-border bg-card pl-9 pr-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        }
      />

      {/* KPI Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Kutilmoqda
            </span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{counts.pending}</p>
          <p className="text-[0.7rem] text-muted-foreground mt-0.5">Ko&apos;rib chiqilishi kerak</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Tasdiqlangan
            </span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{counts.approved}</p>
          <p className="text-[0.7rem] text-muted-foreground mt-0.5">Faoliyatga ruxsat berilgan</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Rad etilgan
            </span>
            <XCircle className="size-4 text-rose-500" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{counts.rejected}</p>
          <p className="text-[0.7rem] text-muted-foreground mt-0.5">Xato yoki talabga mos emas</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Jami Arizalar
            </span>
            <FileText className="size-4 text-primary" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{counts.all}</p>
          <p className="text-[0.7rem] text-muted-foreground mt-0.5">Platforma tarixi bo&apos;yicha</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = filter === f.key;
          const count = counts[f.key];
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}>
              <Icon className="size-4" />
              <span>{f.label}</span>
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-[0.62rem] font-bold',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications Cards Grid */}
      {appsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed rounded-2xl">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <Store className="size-7" />
          </div>
          <h4 className="text-sm font-bold text-foreground">Arizalar mavjud emas</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery
              ? `"${searchQuery}" bo'yicha hech qanday ariza topilmadi`
              : 'Tanlangan filtr bo\'yicha arizalar mavjud emas'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredList.map((app) => {
            const isPending = app.status === 'pending';
            const isApproved = app.status === 'approved';
            const isRejected = app.status === 'rejected';

            return (
              <Card
                key={app.id}
                className={cn(
                  'flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all shadow-xs hover:shadow-md',
                  isPending
                    ? 'border-amber-500/30 bg-card hover:border-amber-500/50'
                    : 'border-border/80 bg-card',
                )}>
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg shadow-xs">
                        <Store className="size-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-foreground leading-tight">
                          {app.companyName || `${app.firstName} ${app.lastName}`}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Mas&apos;ul: <strong className="text-foreground">{app.firstName} {app.lastName}</strong>
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold border',
                        isPending && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                        isApproved && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                        isRejected && 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                      )}>
                      {isPending && <Clock className="size-3" />}
                      {isApproved && <CheckCircle2 className="size-3" />}
                      {isRejected && <XCircle className="size-3" />}
                      {isPending ? 'Kutilmoqda' : isApproved ? 'Tasdiqlangan' : 'Rad etilgan'}
                    </span>
                  </div>

                  {/* Badges / Legal Info */}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {app.stir && (
                      <span className="flex items-center gap-1 rounded-xl bg-muted/60 border border-border px-2.5 py-1 font-mono font-bold text-foreground">
                        <Building2 className="size-3 text-primary" />
                        STIR: {app.stir}
                      </span>
                    )}

                    {app.entityType && (
                      <span className="rounded-xl bg-muted/60 border border-border px-2.5 py-1 font-semibold text-foreground">
                        {app.entityType}
                      </span>
                    )}

                    {app.soliqConfirmed && (
                      <span className="flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="size-3" />
                        Soliq tasdiqlangan
                      </span>
                    )}

                    {app.ofertaAccepted && (
                      <span className="flex items-center gap-1 rounded-xl bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 font-bold text-blue-600 dark:text-blue-400">
                        <FileCheck2 className="size-3" />
                        Oferta qabul qilingan (12%)
                      </span>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="mt-3.5 space-y-1.5 rounded-xl bg-muted/30 p-3 text-xs border border-border/50">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-primary" /> Aloqa telefoni:
                      </span>
                      <strong className="text-foreground font-mono">
                        {app.contactPhone || app.user.phone}
                      </strong>
                    </div>

                    {app.legalAddress && (
                      <div className="flex items-start justify-between gap-2 text-muted-foreground pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1.5 shrink-0">
                          <MapPin className="size-3.5 text-primary" /> Yuridik manzil:
                        </span>
                        <span className="text-right text-foreground font-medium truncate">
                          {app.legalAddress}
                        </span>
                      </div>
                    )}

                    {app.bankAccountNumber ? (
                      <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1.5">
                          <Landmark className="size-3.5 text-primary" /> Bank hisob raqami:
                        </span>
                        <span className="text-foreground font-mono font-bold">
                          🏦 {app.bankAccountNumber} {app.bankMfo && `(MFO: ${app.bankMfo})`}
                        </span>
                      </div>
                    ) : app.bankCardNumber ? (
                      <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="size-3.5 text-primary" /> Bank kartasi:
                        </span>
                        <span className="text-foreground font-mono font-bold">
                          💳 {app.bankCardNumber}{' '}
                          {app.bankCardHolderName && `(${app.bankCardHolderName})`}
                        </span>
                      </div>
                    ) : null}

                    {app.rejectionReason && (
                      <div className="rounded-lg bg-destructive/10 p-2 text-destructive font-medium mt-2">
                        Rad etish sababi: {app.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                {isPending && (
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectingId(app.id);
                        setRejectReason('');
                      }}
                      className="h-9 gap-1.5 rounded-xl border-destructive/30 text-xs font-bold text-destructive hover:bg-destructive/10">
                      <X className="size-3.5" />
                      Rad etish
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openApproveDialog(app)}
                      className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold">
                      <Check className="size-3.5" />
                      Tasdiqlash & Do&apos;kon ochish
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Application Modal */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Do&apos;konni Tasdiqlash</h3>
                  <p className="text-xs text-muted-foreground">Shartnoma va profil ma&apos;lumotlarini yakunlash</p>
                </div>
              </div>
              <button
                onClick={() => setApprovingApp(null)}
                className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            {approveErr && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {approveErr}
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  F.I.SH (Mas&apos;ul shaxs)
                </label>
                <input
                  type="text"
                  value={approveForm.fullName}
                  onChange={(e) => setApproveForm({ ...approveForm, fullName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    STIR / INN
                  </label>
                  <input
                    type="text"
                    value={approveForm.stir}
                    onChange={(e) => setApproveForm({ ...approveForm, stir: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Yuridik Shakl
                  </label>
                  <input
                    type="text"
                    value={approveForm.entityType}
                    onChange={(e) => setApproveForm({ ...approveForm, entityType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Bank Hisob Raqami (20 xonali)
                  </label>
                  <input
                    type="text"
                    value={approveForm.bankAccountNumber}
                    onChange={(e) => setApproveForm({ ...approveForm, bankAccountNumber: e.target.value })}
                    placeholder="20208..."
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Bank MFO
                  </label>
                  <input
                    type="text"
                    value={approveForm.bankMfo}
                    onChange={(e) => setApproveForm({ ...approveForm, bankMfo: e.target.value })}
                    placeholder="00444"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Bank Nomi
                  </label>
                  <input
                    type="text"
                    value={approveForm.bankName}
                    onChange={(e) => setApproveForm({ ...approveForm, bankName: e.target.value })}
                    placeholder="Masalan: AT Xalq Banki"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hisob Egasi (Tashkilot)
                  </label>
                  <input
                    type="text"
                    value={approveForm.bankAccountHolderName}
                    onChange={(e) => setApproveForm({ ...approveForm, bankAccountHolderName: e.target.value })}
                    placeholder='Masalan: "TILAV" MCHJ'
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Admin Izohi (Ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  value={approveForm.adminNotes}
                  onChange={(e) => setApproveForm({ ...approveForm, adminNotes: e.target.value })}
                  placeholder="Do'kon ochish bo'yicha maxsus qaydlar..."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovingApp(null)}
                className="h-9 rounded-xl text-xs font-semibold">
                Bekor qilish
              </Button>
              <Button
                size="sm"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate({ id: approvingApp.id, body: approveForm })}
                className="h-9 gap-1.5 rounded-xl px-5 text-xs font-bold">
                <Check className="size-3.5" />
                {approveMutation.isPending ? 'Tasdiqlanmoqda…' : 'Tasdiqlash & Faollashtirish'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <XCircle className="size-5" />
              </div>
              <h3 className="text-base font-extrabold text-foreground">Arizani Rad Etish</h3>
            </div>

            {rejectErr && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {rejectErr}
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rad etish sababi
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="STIR ma'lumotlari mos kelmadi yoki hujjatlar yetarli emas..."
                className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs font-medium outline-none focus:border-destructive"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingId(null)}
                className="h-9 rounded-xl text-xs font-semibold">
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: rejectingId, reason: rejectReason })}
                className="h-9 rounded-xl px-4 text-xs font-bold">
                {rejectMutation.isPending ? 'Rad etilmoqda…' : 'Rad etish'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

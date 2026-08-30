'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Store, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader, StatPill } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
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
  bankCardNumber: '',
  bankCardHolderName: '',
  contractNumber: '',
  contractDate: '',
  adminNotes: '',
};

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'approved', label: 'Tasdiqlandi' },
  { key: 'rejected', label: 'Rad etildi' },
  { key: 'all', label: 'Hammasi' },
];

const STATUS: Record<SellerApplication['status'], { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Kutilmoqda', variant: 'warning' },
  approved: { label: 'Tasdiqlandi', variant: 'success' },
  rejected: { label: 'Rad etildi', variant: 'danger' },
};

const APPROVE_FIELDS: { k: keyof ApproveForm; label: string; required?: boolean; type?: string }[] = [
  { k: 'fullName', label: 'To\'liq ism (FIO)', required: true },
  { k: 'passportOrPinfl', label: 'Pasport / PINFL', required: false },
  { k: 'stir', label: 'STIR / INN', required: false },
  { k: 'entityType', label: 'Yuridik shakl (YaTT / MChJ)', required: false },
  { k: 'bankCardNumber', label: 'Karta raqami (Uzcard/Humo)', required: false },
  { k: 'bankCardHolderName', label: 'Karta egasi', required: false },
  { k: 'contractNumber', label: 'Shartnoma raqami', required: false },
  { k: 'contractDate', label: 'Shartnoma sanasi', type: 'date', required: false },
  { k: 'adminNotes', label: 'Admin izohi', required: false },
];

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [approvingApp, setApprovingApp] = useState<SellerApplication | null>(null);
  const [approveForm, setApproveForm] = useState<ApproveForm>(EMPTY_APPROVE);
  const [approveErr, setApproveErr] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectErr, setRejectErr] = useState('');

  useEscapeKey(!!approvingApp || !!rejectingId, () => {
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

  const apps = appsQuery.data ?? [];

  const counts = useMemo(
    () => ({
      pending: apps.filter((a) => a.status === 'pending').length,
      approved: apps.filter((a) => a.status === 'approved').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
    }),
    [apps],
  );

  const list = useMemo(() => {
    if (filter === 'all') return apps;
    return apps.filter((a) => a.status === filter);
  }, [apps, filter]);

  const approveMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<ApproveForm> }) => {
      await api.post(`/sellers/admin/applications/${id}/approve`, body);
    },
    onSuccess: () => {
      setApprovingApp(null);
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      toast.success('Do\'kon arizasi tasdiqlandi');
    },
    onError: (e: unknown) => setApproveErr(extractErrorMessage(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.post(`/sellers/admin/applications/${id}/reject`, { reason });
    },
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      setRejectErr('');
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
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
      bankCardNumber: app.bankCardNumber ?? '',
      bankCardHolderName: app.bankCardHolderName ?? '',
    });
    setApproveErr('');
    setApprovingApp(app);
  };

  const requiredFilled = APPROVE_FIELDS.filter((f) => f.required).every((f) => approveForm[f.k].trim());

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Do'kon ochish arizalari"
        description="Foydalanuvchilar do'kon ochish uchun yuborgan arizalarni ko'rib chiqing va tasdiqlang."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatPill label="Kutilmoqda" value={counts.pending} />
        <StatPill label="Tasdiqlangan" value={counts.approved} />
        <StatPill label="Rad etilgan" value={counts.rejected} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'default' : 'outline'}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      {appsQuery.isLoading ? (
        <div className="grid gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 border-dashed py-14 text-center">
          <Store className="size-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Bu bo'limda ariza yo'q</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {list.map((app) => {
            const st = STATUS[app.status];
            return (
              <Card key={app.id} className="overflow-hidden p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <Store className="size-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-foreground">
                          {app.companyName || `${app.firstName} ${app.lastName}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mas'ul: {app.firstName} {app.lastName}
                        </p>
                        {app.contactPhone && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Tel: {app.contactPhone}
                          </p>
                        )}
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="size-4 text-primary" />
                      <span className="text-foreground">{app.user.name ?? '—'}</span>
                      <span>· {app.user.phone}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {app.stir && (
                        <span className="rounded-md bg-muted px-2 py-1">
                          STIR: <strong className="font-mono">{app.stir}</strong>
                        </span>
                      )}
                      {app.entityType && (
                        <span className="rounded-md bg-muted px-2 py-1">
                          Shakl: <strong>{app.entityType}</strong>
                        </span>
                      )}
                      {app.bankCardNumber && (
                        <span className="rounded-md bg-muted px-2 py-1 font-mono">
                          💳 {app.bankCardNumber}
                        </span>
                      )}
                      {app.soliqConfirmed ? (
                        <span className="rounded-md bg-emerald-50 text-emerald-700 font-semibold px-2 py-1 border border-emerald-200">
                          ✅ Soliqda biriktirilgan
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-50 text-amber-700 px-2 py-1 border border-amber-200">
                          ⏳ Soliq kutilmoqda
                        </span>
                      )}
                    </div>

                    {app.note && (
                      <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                        {app.note}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(app.createdAt).toLocaleString('uz-UZ')}
                    </p>

                    {app.status === 'rejected' && app.rejectionReason && (
                      <p className="mt-3 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                        Sabab: {app.rejectionReason}
                      </p>
                    )}

                    {app.status === 'pending' && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openApproveDialog(app)}>
                          <Check className="size-4" />
                          Tasdiqlash
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setRejectingId(app.id)}>
                          <X className="size-4" />
                          Rad etish
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve dialog */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-foreground">Do'kon egasi sifatida tasdiqlash</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{approvingApp.firstName} {approvingApp.lastName}</span>
              {' '}({approvingApp.user.phone}) uchun hamkorlik ma'lumotlarini to'ldiring va tasdiqlang.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {APPROVE_FIELDS.map(({ k, label, required, type }) => (
                <div key={k} className={k === 'adminNotes' ? 'sm:col-span-2' : ''}>
                  <label className="mb-0.5 block text-xs font-medium text-muted-foreground">
                    {label}{required && <span className="text-destructive"> *</span>}
                  </label>
                  {k === 'adminNotes' ? (
                    <textarea
                      rows={2}
                      value={approveForm[k]}
                      onChange={(e) => setApproveForm((p) => ({ ...p, [k]: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    />
                  ) : (
                    <input
                      type={type ?? 'text'}
                      value={approveForm[k]}
                      onChange={(e) => setApproveForm((p) => ({ ...p, [k]: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    />
                  )}
                </div>
              ))}
            </div>

            {approveErr && <p className="mt-3 text-xs text-destructive">{approveErr}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setApprovingApp(null); setApproveErr(''); }}>
                Bekor qilish
              </Button>
              <Button
                variant="success"
                size="sm"
                disabled={!requiredFilled || approveMutation.isPending}
                onClick={() => approveMutation.mutate({ id: approvingApp.id, body: approveForm })}>
                <Check className="size-4" />
                Saqlash &amp; Tasdiqlash
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-foreground">Arizani rad etish</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sabab foydalanuvchiga ko'rsatiladi.</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Masalan: Soliq kabinetida komissioner biriktirilmagan"
              className="mt-3 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            {rejectErr && <p className="mt-2 text-xs text-destructive">{rejectErr}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setRejectingId(null); setRejectReason(''); setRejectErr(''); }}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: rejectingId, reason: rejectReason })}>
                <X className="size-4" />
                Rad etish
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

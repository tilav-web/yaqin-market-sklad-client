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
  { k: 'passportOrPinfl', label: 'Pasport / PINFL', required: true },
  { k: 'stir', label: 'STIR / INN', required: true },
  { k: 'entityType', label: 'Yuridik shakl (YaTT / MChJ / AJ)', required: true },
  { k: 'bankCardNumber', label: 'Karta raqami (16 raqam)' },
  { k: 'bankCardHolderName', label: 'Karta egasi' },
  { k: 'contractNumber', label: 'Shartnoma raqami' },
  { k: 'contractDate', label: 'Shartnoma sanasi', type: 'date' },
  { k: 'adminNotes', label: 'Admin izohi (ichki)' },
];

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectErr, setRejectErr] = useState('');
  const [approvingApp, setApprovingApp] = useState<SellerApplication | null>(null);
  const [approveForm, setApproveForm] = useState<ApproveForm>(EMPTY_APPROVE);
  const [approveErr, setApproveErr] = useState('');
  useEscapeKey(!!rejectingId, () => { setRejectingId(null); setRejectReason(''); setRejectErr(''); });
  useEscapeKey(!!approvingApp, () => { setApprovingApp(null); setApproveErr(''); });

  const appsQuery = useQuery({
    queryKey: ['admin', 'applications'],
    queryFn: async () => {
      const res = await api.get<SellerApplication[]>('/sellers/admin/applications');
      return res.data;
    },
  });

  const all = useMemo(() => appsQuery.data ?? [], [appsQuery.data]);
  const counts = useMemo(
    () => ({
      pending: all.filter((a) => a.status === 'pending').length,
      approved: all.filter((a) => a.status === 'approved').length,
      rejected: all.filter((a) => a.status === 'rejected').length,
    }),
    [all],
  );
  const list = filter === 'all' ? all : all.filter((a) => a.status === filter);

  const approve = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: ApproveForm }) => {
      const body: Record<string, string> = {};
      (Object.keys(form) as (keyof ApproveForm)[]).forEach((k) => {
        if (form[k]) body[k] = form[k];
      });
      await api.post(`/sellers/admin/applications/${id}/approve`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      setApprovingApp(null);
      setApproveForm(EMPTY_APPROVE);
      setApproveErr('');
      toast.success('Seller tasdiqlandi');
    },
    onError: (e: unknown) => setApproveErr(extractErrorMessage(e)),
  });

  const reject = useMutation({
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
    setApproveForm({ ...EMPTY_APPROVE, fullName: `${app.firstName} ${app.lastName}`.trim() });
    setApproveErr('');
    setApprovingApp(app);
  };

  const requiredFilled = APPROVE_FIELDS.filter((f) => f.required).every((f) => approveForm[f.k].trim());

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Seller arizalari"
        description="Foydalanuvchilar sotuvchi bo'lish uchun yuborgan arizalarni ko'rib chiqing va tasdiqlang."
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
                          {app.firstName} {app.lastName}
                        </p>
                        {app.contactPhone && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            Qo'shimcha tel: {app.contactPhone}
                          </p>
                        )}
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="size-4 text-primary" />
                      <span className="text-foreground">{app.user.name ?? '—'}</span>
                      <span>· {app.user.phone}</span>
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
            <h2 className="text-lg font-bold text-foreground">Seller yaratish</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{approvingApp.firstName} {approvingApp.lastName}</span>
              {' '}({approvingApp.user.phone}) uchun seller ma'lumotlarini to'ldiring.
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
                disabled={!requiredFilled || approve.isPending}
                onClick={() => approve.mutate({ id: approvingApp.id, form: approveForm })}>
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
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rad etish sababi"
              rows={3}
              className="mt-4 w-full rounded-lg border border-input bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
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
                disabled={!rejectReason || reject.isPending}
                onClick={() => reject.mutate({ id: rejectingId, reason: rejectReason })}>
                Rad etish
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

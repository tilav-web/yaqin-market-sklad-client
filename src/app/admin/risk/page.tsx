'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { useEscapeKey } from '@/lib/use-escape-key';
import { toast } from '@/stores/toast';

type RiskRule =
  | 'mocked_location' | 'delivered_far_from_address' | 'delivered_without_evidence'
  | 'pickup_far_from_shop' | 'impossible_travel' | 'not_received_complaint'
  | 'low_courier_rating' | 'corroborated_false_delivery' | 'address_far_from_device'
  | 'shop_relocated_after_orders' | 'device_shared_across_accounts';
type RiskSeverity = 'low' | 'medium' | 'high';
type RiskStatus = 'open' | 'confirmed' | 'dismissed';
type RiskSubjectType = 'user' | 'shop' | 'order' | 'device';

interface RiskFlag {
  id: string;
  rule: RiskRule;
  severity: RiskSeverity;
  status: RiskStatus;
  subjectType: RiskSubjectType;
  subjectId: string;
  subject: { id: string; name: string | null; phone: string } | null;
  orderId: string | null;
  shopId: string | null;
  deviceId: string | null;
  summary: string;
  details: Record<string, unknown> | null;
  dedupeKey: string;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  reviewedByAdminId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

interface RiskFlagsPage { items: RiskFlag[]; total: number }

const PAGE_SIZE = 30;

const RULE_LABEL: Record<RiskRule, string> = {
  mocked_location: 'GPS soxta (mock)',
  delivered_far_from_address: 'Manzildan uzoqda "Yetkazildi"',
  delivered_without_evidence: 'Dalilsiz yetkazish',
  pickup_far_from_shop: "Do'kondan uzoqda yo'lga chiqish",
  impossible_travel: 'Imkonsiz tezlik',
  not_received_complaint: 'Yetkazilmadi shikoyati',
  low_courier_rating: 'Kuryerga past baho',
  corroborated_false_delivery: 'Tasdiqlangan soxta yetkazish',
  address_far_from_device: 'Manzil GPSdan uzoq',
  shop_relocated_after_orders: "Faol do'kon ko'chirildi",
  device_shared_across_accounts: 'Qurilma bir nechta akkauntda',
};

const SEVERITY_LABEL: Record<RiskSeverity, string> = { low: 'Past', medium: "O'rta", high: 'Yuqori' };
const SEVERITY_VARIANT: Record<RiskSeverity, 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

const STATUS_LABEL: Record<RiskStatus, string> = { open: 'Ochiq', confirmed: 'Tasdiqlangan', dismissed: 'Rad etilgan' };
const STATUS_VARIANT: Record<RiskStatus, 'warning' | 'danger' | 'neutral'> = {
  open: 'warning',
  confirmed: 'danger',
  dismissed: 'neutral',
};

const STATUS_FILTERS: { key: RiskStatus | ''; label: string }[] = [
  { key: '', label: 'Barchasi' },
  { key: 'open', label: 'Ochiq' },
  { key: 'confirmed', label: 'Tasdiqlangan' },
  { key: 'dismissed', label: 'Rad etilgan' },
];

const SEVERITY_FILTERS: { key: RiskSeverity | ''; label: string }[] = [
  { key: '', label: 'Barcha jiddiylik' },
  { key: 'high', label: 'Yuqori' },
  { key: 'medium', label: "O'rta" },
  { key: 'low', label: 'Past' },
];

function subjectLabel(flag: RiskFlag): string {
  if (flag.subjectType === 'user' && flag.subject) return flag.subject.name || flag.subject.phone;
  return flag.subjectId;
}

function FlagDetailDialog({ flag, onClose }: { flag: RiskFlag; onClose: () => void }) {
  const qc = useQueryClient();
  useEscapeKey(true, onClose);

  const review = useMutation({
    mutationFn: async (status: 'confirmed' | 'dismissed') => {
      await api.patch(`/admin/risk/flags/${flag.id}/review`, { status });
    },
    onSuccess: (_data, status) => {
      qc.invalidateQueries({ queryKey: ['admin', 'risk', 'flags'] });
      qc.invalidateQueries({ queryKey: ['admin', 'risk', 'open-count'] });
      toast.success(status === 'confirmed' ? 'Signal tasdiqlandi' : 'Signal rad etildi');
      onClose();
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={SEVERITY_VARIANT[flag.severity]}>{SEVERITY_LABEL[flag.severity]}</Badge>
            <h2 className="text-base font-bold text-foreground">{RULE_LABEL[flag.rule] ?? flag.rule}</h2>
          </div>
          <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-foreground">{flag.summary}</p>

        <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
          <div>Subyekt: <span className="text-foreground">{subjectLabel(flag)}</span></div>
          {flag.orderId && <div>Buyurtma: <span className="font-mono text-foreground">{flag.orderId}</span></div>}
          {flag.shopId && <div>Do&apos;kon: <span className="font-mono text-foreground">{flag.shopId}</span></div>}
          <div>Takrorlangan: <span className="text-foreground">{flag.occurrences} marta</span></div>
          <div>Birinchi: {new Date(flag.firstSeenAt).toLocaleString('uz-UZ')}</div>
          <div>Oxirgi: {new Date(flag.lastSeenAt).toLocaleString('uz-UZ')}</div>
        </div>

        {flag.details && (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            {JSON.stringify(flag.details, null, 2)}
          </pre>
        )}

        {flag.status !== 'open' ? (
          <div className="mt-4 rounded-lg border border-border p-3 text-sm">
            <Badge variant={STATUS_VARIANT[flag.status]}>{STATUS_LABEL[flag.status]}</Badge>
            {flag.reviewNote && <p className="mt-1 text-xs text-muted-foreground">{flag.reviewNote}</p>}
          </div>
        ) : (
          <div className="mt-5 flex gap-2">
            <Button variant="destructive" disabled={review.isPending} onClick={() => review.mutate('confirmed')}>
              Tasdiqlash
            </Button>
            <Button variant="outline" disabled={review.isPending} onClick={() => review.mutate('dismissed')}>
              Rad etish
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminRiskPage() {
  const [status, setStatus] = useState<RiskStatus | ''>('open');
  const [severity, setSeverity] = useState<RiskSeverity | ''>('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<RiskFlag | null>(null);

  const flagsQuery = useQuery<RiskFlagsPage>({
    queryKey: ['admin', 'risk', 'flags', status, severity, page],
    queryFn: async () =>
      (await api.get('/admin/risk/flags', {
        params: { status: status || undefined, severity: severity || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      })).data,
    placeholderData: (prev) => prev,
  });

  const items = flagsQuery.data?.items ?? [];
  const total = flagsQuery.data?.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Xavfsizlik"
        title="Xavf signallari"
        description="Lokatsiya dalili, shikoyat va baholardan avtomatik aniqlangan shubhali holatlar — hech biri avtomatik bloklamaydi, faqat ko'rib chiqish uchun."
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setStatus(f.key); setPage(0); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                status === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setSeverity(f.key); setPage(0); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                severity === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Qoida</th>
              <th className="px-4 py-3 font-semibold">Jiddiylik</th>
              <th className="px-4 py-3 font-semibold">Subyekt</th>
              <th className="px-4 py-3 font-semibold">Izoh</th>
              <th className="px-4 py-3 font-semibold">Takror</th>
              <th className="px-4 py-3 font-semibold">Holat</th>
              <th className="px-4 py-3 font-semibold">Sana</th>
            </tr>
          </thead>
          <tbody>
            {flagsQuery.isLoading ? (
              <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda…</td></tr>
            ) : flagsQuery.isError ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-destructive">
                  {extractErrorMessage(flagsQuery.error)} —{' '}
                  <button className="underline" onClick={() => flagsQuery.refetch()}>qayta urinish</button>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <ShieldAlert className="size-6 text-muted-foreground/50" />
                    Signal topilmadi
                  </div>
                </td>
              </tr>
            ) : items.map((f) => (
              <tr
                key={f.id}
                onClick={() => setSelected(f)}
                className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">{RULE_LABEL[f.rule] ?? f.rule}</td>
                <td className="px-4 py-3">
                  <Badge variant={SEVERITY_VARIANT[f.severity]}>{SEVERITY_LABEL[f.severity]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{subjectLabel(f)}</td>
                <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{f.summary}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.occurrences > 1 ? `${f.occurrences}×` : '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[f.status]}>{STATUS_LABEL[f.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(f.lastSeenAt).toLocaleString('uz-UZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      {selected && <FlagDetailDialog flag={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

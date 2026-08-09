'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast';

interface Setting { key: string; value: string; description: string | null; updatedAt: string }

interface Economics {
  commissionPercent: number;
  clickFeePercent: number;
  payoutFeePercent: number;
  onlineMarginPercent: number;
  cashMarginPercent: number;
  examplePer100k: {
    online: { commission: number; clickFee: number; payoutFee: number; platformNet: number; sellerNet: number };
    cash: { commission: number; platformNet: number; sellerNet: number };
  };
  warnings: string[];
}

const LABEL: Record<string, string> = {
  commission_rate_default: 'Standart komissiya (%)',
  debt_due_days: 'Qarz muddati (kun)',
  settlement_hours: 'Settlement vaqti (soat)',
  click_fee_percent: 'Click ekvayring haqi (%)',
  payout_fee_percent: "Sellerga o'tkazma haqi (%)",
  min_order_total: "Minimal buyurtma (so'm)",
  vat_rate_percent: 'QQS stavkasi (%)',
  fiscal_mode: 'Fiskal rejim',
  platform_legal_name: 'Operator (MChJ) nomi',
  platform_stir: 'Operator STIRi',
  risk_delivered_max_distance_m: '"Yetkazildi" — manzildan max masofa (metr)',
  risk_evidence_max_accuracy_m: 'GPS aniqlik chegarasi (metr)',
  risk_pickup_max_distance_m: '"Kuryerga berish" — do\'kondan max masofa (metr)',
  risk_impossible_speed_kmh: "Imkonsiz tezlik chegarasi (km/soat)",
  risk_impossible_min_segment_m: 'Tezlik tekshiruvi uchun min masofa (metr)',
  risk_low_rating_threshold: 'Kuryer past baho chegarasi (yulduz)',
  risk_address_pin_max_distance_m: "Manzil pini — GPSdan max masofa (metr, 0=o'chiq)",
  risk_shop_relocation_max_m: "Do'kon pinining siljish chegarasi (metr)",
  risk_device_max_accounts: 'Qurilmadagi max akkaunt soni',
  risk_ping_retention_days: 'Kuryer treki saqlash muddati (kun)',
  risk_ping_min_interval_sec: 'Ping oralig\'i (soniya)',
  risk_qr_handshake_enabled: 'QR-tasdiq yoqilganmi (1/0)',
};

/** Server tomonidagi matnli sozlamalar — raqam validatsiyasi qo'llanmaydi. */
const STRING_KEYS: Record<string, { options?: { value: string; label: string }[] }> = {
  fiscal_mode: {
    options: [
      { value: 'off', label: 'Off — chek yaratilmaydi' },
      { value: 'collect', label: "Collect — cheklar yig'iladi, yuborilmaydi" },
      { value: 'live', label: 'Live — OFDga yuboriladi' },
    ],
  },
  platform_legal_name: {},
  platform_stir: {},
};

/** Mirrors the server's validation in SettingsService.set() — numeric settings are non-negative numbers, commission is additionally capped at 100. */
function isValidSettingValue(key: string, value: string): boolean {
  if (STRING_KEYS[key]) return true;
  // Number('') is 0, not NaN — an emptied field would otherwise read as a
  // "valid" zero and silently save (e.g. commission dropping to 0%).
  if (value.trim() === '') return false;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return false;
  if (key === 'commission_rate_default' && n > 100) return false;
  return true;
}

const fmt = (n: number) => n.toLocaleString('uz-UZ');

/**
 * Jonli marja-panel: komissiya maydoni tahrirlanayotganda kiritilgan qiymat
 * bilan platforma real marjasini ko'rsatadi (Click + payout xarajatlaridan
 * keyin) — admin break-even ostiga tushayotganini saqlashdan OLDIN ko'radi.
 */
function EconomicsPanel({ commissionDraft }: { commissionDraft: string | undefined }) {
  const draftValid = commissionDraft !== undefined && commissionDraft.trim() !== '' && Number.isFinite(Number(commissionDraft));
  const ecoQ = useQuery<Economics>({
    queryKey: ['admin', 'economics', draftValid ? commissionDraft : 'current'],
    queryFn: async () =>
      (await api.get('/admin/settings/economics', {
        params: draftValid ? { commission: commissionDraft } : {},
      })).data,
  });

  const e = ecoQ.data;
  if (!e) return null;

  const negative = e.onlineMarginPercent < 0;

  return (
    <Card className={`space-y-2 px-4 py-3 ${negative ? 'border-destructive' : ''}`}>
      <p className="text-sm font-semibold">
        Foyda kalkulyatori {draftValid && <span className="text-muted-foreground">(komissiya {commissionDraft}% bo&apos;lsa)</span>}
      </p>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-md bg-muted/40 p-2.5">
          <p className="font-medium">Onlayn (Click) buyurtma</p>
          <p className="mt-1 text-muted-foreground">
            Komissiya {e.commissionPercent}% − Click {e.clickFeePercent}% − o&apos;tkazma ~{e.payoutFeePercent}% =
          </p>
          <p className={`text-base font-bold ${negative ? 'text-destructive' : 'text-emerald-600'}`}>
            {e.onlineMarginPercent}% sof marja
          </p>
          <p className="mt-1 text-muted-foreground">
            100 000 so&apos;mda: komissiya {fmt(e.examplePer100k.online.commission)} − Click {fmt(e.examplePer100k.online.clickFee)} − o&apos;tkazma {fmt(e.examplePer100k.online.payoutFee)} = <b>{fmt(e.examplePer100k.online.platformNet)} so&apos;m</b>
          </p>
        </div>
        <div className="rounded-md bg-muted/40 p-2.5">
          <p className="font-medium">Naqd buyurtma</p>
          <p className="mt-1 text-muted-foreground">Komissiya qarz sifatida yig&apos;iladi, Click/o&apos;tkazma yo&apos;q</p>
          <p className="text-base font-bold text-emerald-600">{e.cashMarginPercent}% sof marja</p>
          <p className="mt-1 text-muted-foreground">
            100 000 so&apos;mda: <b>{fmt(e.examplePer100k.cash.platformNet)} so&apos;m</b> (seller: {fmt(e.examplePer100k.cash.sellerNet)})
          </p>
        </div>
      </div>
      {e.warnings.map((w) => (
        <p key={w} className="flex items-start gap-1.5 text-xs text-destructive">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {w}
        </p>
      ))}
    </Card>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useQuery<Setting[]>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => (await api.get('/admin/settings')).data,
  });

  const save = useMutation({
    mutationFn: ({ key, value, force }: { key: string; value: string; force?: boolean }) =>
      api.put(`/admin/settings/${key}`, force ? { value, force } : { value }),
    onSuccess: (_, { key }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'economics'] });
      setEditing((prev) => { const next = { ...prev }; delete next[key]; return next; });
      toast.success('Sozlama saqlandi');
    },
    onError: (e, { key, value }) => {
      const msg = extractErrorMessage(e);
      // Server break-even himoyasi: komissiya zarar chegarasidan past bo'lsa
      // 400 + "force=true" ko'rsatmasi qaytadi — admin ogohlantirishni o'qib
      // ataylab davom etsa, force bilan qayta yuboriladi.
      if (msg.includes('force=true')) {
        if (window.confirm(`${msg}\n\nBaribir saqlaysizmi?`)) {
          save.mutate({ key, value, force: true });
        }
      } else {
        toast.error(msg);
      }
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Yuklanmoqda…</div>;

  if (isError) {
    return (
      <div className="p-6 text-sm text-destructive">
        {extractErrorMessage(error)} —{' '}
        <button className="underline" onClick={() => refetch()}>qayta urinish</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PageHeader title="Sozlamalar" description="Komissiya, soliq, fiskal va boshqa parametrlar" />
      <div className="mt-6 space-y-3">
        <EconomicsPanel commissionDraft={editing.commission_rate_default} />
        {(data ?? []).map((s) => {
          const val = editing[s.key] ?? s.value;
          const dirty = editing[s.key] !== undefined;
          const valid = isValidSettingValue(s.key, val);
          const stringKey = STRING_KEYS[s.key];
          return (
            <Card key={s.key} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{LABEL[s.key] ?? s.key}</p>
                  {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                </div>
                {stringKey?.options ? (
                  <select
                    className="w-64 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    value={val}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))}
                  >
                    {stringKey.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : stringKey ? (
                  <input
                    type="text"
                    className="w-48 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    value={val}
                    placeholder="—"
                    onChange={(e) => setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={s.key === 'commission_rate_default' ? 100 : undefined}
                    className="w-28 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
                    value={val}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))}
                  />
                )}
                <Button
                  size="sm"
                  disabled={!dirty || !valid || save.isPending}
                  onClick={() => save.mutate({ key: s.key, value: val })}
                >
                  <Save className="size-3" />
                  Saqlash
                </Button>
              </div>
              {dirty && !valid && (
                <p className="text-xs text-destructive">
                  Qiymat manfiy bo&apos;lmagan raqam bo&apos;lishi kerak
                  {s.key === 'commission_rate_default' ? ' (0-100 oralig\'ida)' : ''}
                </p>
              )}
              {s.key === 'commission_rate_default' && (
                <p className="text-xs text-muted-foreground">
                  Bu qiymat faqat yangi buyurtmalarga ta&apos;sir qiladi — allaqachon yaratilgan buyurtmalar eski stavkada qoladi. Yuqoridagi kalkulyator kiritilgan qiymat bo&apos;yicha real marjani ko&apos;rsatadi.
                </p>
              )}
              {s.key === 'platform_stir' && (
                <p className="text-xs text-muted-foreground">
                  MChJ ro&apos;yxatdan o&apos;tgach kiritiladi — fiskal cheklar shu rekvizit bilan chiqadi. Bo&apos;sh bo&apos;lsa cheklar &quot;ma&apos;lumot yetishmaydi&quot; holatida to&apos;planadi.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

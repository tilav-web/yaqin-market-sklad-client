'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  DollarSign,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Percent,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';

interface Setting {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

interface Economics {
  commissionPercent: number;
  clickFeePercent: number;
  payoutFeePercent: number;
  onlineMarginPercent: number;
  cashMarginPercent: number;
  examplePer100k: {
    online: {
      commission: number;
      clickFee: number;
      payoutFee: number;
      platformNet: number;
      sellerNet: number;
    };
    cash: {
      commission: number;
      platformNet: number;
      sellerNet: number;
    };
  };
  warnings: string[];
}

type SettingsTab = 'finance' | 'legal' | 'fiscal' | 'risk';

interface SettingMeta {
  tab: SettingsTab;
  label: string;
  category: string;
  unit?: string;
  icon: React.ElementType;
  hint?: string;
  min?: number;
  max?: number;
  isSecret?: boolean;
  options?: { value: string; label: string; desc?: string }[];
}

const SETTINGS_METADATA: Record<string, SettingMeta> = {
  // 1. Finance & Commission
  commission_rate_default: {
    tab: 'finance',
    category: 'Asosiy Komissiya',
    label: 'Standart platforma komissiyasi',
    unit: '%',
    min: 0,
    max: 100,
    icon: Percent,
    hint: "Yangi buyurtmalarga qo'llanadigan standart komissiya foizi. (Masalan: 12%)",
  },
  click_fee_percent: {
    tab: 'finance',
    category: 'Ekvayring & To\'lovlar',
    label: 'Click / To\'lov tizimlari ekvayring haqi',
    unit: '%',
    min: 0,
    max: 10,
    icon: DollarSign,
    hint: "Onlayn to'lovlar uchun to'lov shlyuzi ushlab qoladigan foiz. (Masalan: 1.5%)",
  },
  payout_fee_percent: {
    tab: 'finance',
    category: 'Ekvayring & To\'lovlar',
    label: "Seller kartasiga pul o'tkazish (Payout) haqi",
    unit: '%',
    min: 0,
    max: 10,
    icon: DollarSign,
    hint: "Do'konga pul yechilganda bank ushlab qoladigan komissiya. (Masalan: 1.0%)",
  },
  min_order_total: {
    tab: 'finance',
    category: 'Buyurtma Parametrlari',
    label: 'Minimal buyurtma summasi',
    unit: "so'm",
    min: 0,
    icon: DollarSign,
    hint: "Mijoz xarid qilishi mumkin bo'lgan eng kam savat summasi.",
  },
  debt_due_days: {
    tab: 'finance',
    category: 'Qarzdorlik Siyosati',
    label: 'Naqd komissiya qarzini to\'lash muddati',
    unit: 'kun',
    min: 1,
    max: 90,
    icon: AlertTriangle,
    hint: "Naqd savdo komissiyasini to'lash uchun sellerga beriladigan muhlat.",
  },
  settlement_hours: {
    tab: 'finance',
    category: 'Buyurtma Parametrlari',
    label: 'Buyurtma muzlatish (Settlement) vaqti',
    unit: 'soat',
    min: 0,
    max: 168,
    icon: Zap,
    hint: "Buyurtma yetkazilgach, mablag' seller hisobiga to'liq o'tishi uchun kutish vaqti.",
  },

  // 2. Legal & Soliq (Didox)
  platform_legal_name: {
    tab: 'legal',
    category: 'Operator Yuridik Rekvizitlari',
    label: 'Operator (Platforma egasi) rasmiy nomi',
    icon: Building2,
    hint: 'Shartnomalar, oferta va cheklarda ko\'rsatiladigan rasmiy korxona nomi. (Masalan: "TILAV" MCHJ)',
  },
  platform_stir: {
    tab: 'legal',
    category: 'Operator Yuridik Rekvizitlari',
    label: 'Operator STIR (INN) raqami',
    icon: Building2,
    hint: "Platforma yuridik shaxsining 9 xonali rasmiy STIR raqami. (Masalan: 313296455)",
  },
  didox_user_key: {
    tab: 'legal',
    category: 'Didox & Davlat Soliq Integratsiyasi',
    label: 'Didox API kaliti (user-key)',
    isSecret: true,
    icon: KeyRound,
    hint: "Didox shaxsiy kabinetidan olingan API kaliti. Yangi sellerlar STIR ma'lumotlarini Soliq bazasidan avtomatik tortish uchun xizmat qiladi.",
  },
  didox_api_url: {
    tab: 'legal',
    category: 'Didox & Davlat Soliq Integratsiyasi',
    label: 'Didox API asosiy server manzili',
    icon: Server,
    hint: "Standart qiymat: https://api.didox.uz",
  },

  // 3. Fiscal & Cheklar
  fiscal_mode: {
    tab: 'fiscal',
    category: 'Fiskallash Siyosati',
    label: 'Fiskal cheklar generatsiya rejimi',
    icon: Receipt,
    hint: 'OFD va Davlat Soliq Qo\'mitasiga chek yuborish tartibi.',
    options: [
      {
        value: 'off',
        label: 'Off — Chek yaratilmaydi',
        desc: 'Fiskallash to\'liq o\'chirilgan (Test rejimi)',
      },
      {
        value: 'collect',
        label: 'Collect — Cheklar yig\'iladi, yuborilmaydi',
        desc: 'Chek ma\'lumotlari bazada saqlanadi, lekin OFDga yuborilmaydi',
      },
      {
        value: 'live',
        label: 'Live — OFDga jonli yuboriladi',
        desc: 'Har bir buyurtma uchun avtomatik QR-kodli rasmiy chek beriladi',
      },
    ],
  },
  vat_rate_percent: {
    tab: 'fiscal',
    category: 'Soliq Stavkalari',
    label: 'QQS (НДС) stavkasi',
    unit: '%',
    min: 0,
    max: 20,
    icon: Percent,
    hint: "O'zbekiston Respublikasi bo'yicha amaldagi QQS foizi (12%).",
  },

  // 4. Risk & Anti-Fraud
  risk_delivered_max_distance_m: {
    tab: 'risk',
    category: 'Lokatsiya & GPS Nazorati',
    label: '"Yetkazildi" belgilashda mijoz manzilidan max masofa',
    unit: 'metr',
    min: 10,
    max: 5000,
    icon: ShieldAlert,
    hint: 'Kuryer mijoz manzilidan necha metr uzoqlikda buyurtmani yakunlashi mumkin.',
  },
  risk_evidence_max_accuracy_m: {
    tab: 'risk',
    category: 'Lokatsiya & GPS Nazorati',
    label: 'GPS aniqlik (Accuracy) chegarasi',
    unit: 'metr',
    min: 5,
    max: 200,
    icon: ShieldAlert,
    hint: 'Kuryer telefonidan yuborilgan GPS signali ruxsat etilgan maksimal noaniqligi.',
  },
  risk_pickup_max_distance_m: {
    tab: 'risk',
    category: 'Lokatsiya & GPS Nazorati',
    label: '"Do\'kondan oldi" belgilashda max masofa',
    unit: 'metr',
    min: 10,
    max: 5000,
    icon: ShieldAlert,
    hint: 'Kuryer tovarlarni olish uchun do\'kondan necha metr masofada bo\'lishi kerak.',
  },
  risk_impossible_speed_kmh: {
    tab: 'risk',
    category: 'Harakat & Tezlik Anomaliyalari',
    label: 'Imkonsiz tezlik (Teleportatsiya) chegarasi',
    unit: 'km/soat',
    min: 30,
    max: 300,
    icon: ShieldAlert,
    hint: 'Agar kuryer ikki nuqta orasida bu tezlikdan yuqori harakatlansa, soxta GPS xavf signali beriladi.',
  },
  risk_impossible_min_segment_m: {
    tab: 'risk',
    category: 'Harakat & Tezlik Anomaliyalari',
    label: 'Tezlik tekshiruvi uchun minimal masofa',
    unit: 'metr',
    min: 10,
    max: 1000,
    icon: ShieldAlert,
    hint: 'Tezlik tekshiruvi hisoblanishi uchun kamida bosib o\'tilishi kerak bo\'lgan oraliq.',
  },
  risk_device_max_accounts: {
    tab: 'risk',
    category: 'Akkaunt & Qurilma Xavfsizligi',
    label: 'Bitta qurilmadagi maksimal akkaunt soni',
    unit: 'ta',
    min: 1,
    max: 20,
    icon: ShieldCheck,
    hint: 'Bitta smartfondan ko\'p sonli akkaunt ochish orqali suiiste\'mol qilishni oldini olish.',
  },
  risk_ping_retention_days: {
    tab: 'risk',
    category: 'Audit & Saqlash',
    label: 'Kuryer marshruti (Trek) saqlash muddati',
    unit: 'kun',
    min: 1,
    max: 365,
    icon: ShieldCheck,
    hint: 'GPS marshrut koordinatalari bazada necha kun saqlanadi.',
  },
  risk_qr_handshake_enabled: {
    tab: 'risk',
    category: 'Tasdiqlash Mexanizmlari',
    label: 'QR-kod orqali topshirish tasdig\'i',
    icon: ShieldCheck,
    hint: '1 = Kuryer xaridorga tovar berganda QR skaner qilish talab qilinadi, 0 = Oddiy tasdiq.',
    options: [
      { value: '1', label: '1 — QR-kod tasdig\'i majburiy' },
      { value: '0', label: '0 — Standart PIN / tugmacha tasdig\'i' },
    ],
  },
};

const fmt = (n: number) => n.toLocaleString('uz-UZ');

function EconomicsCalculator({
  commissionDraft,
}: {
  commissionDraft: string | undefined;
}) {
  const draftValid =
    commissionDraft !== undefined &&
    commissionDraft.trim() !== '' &&
    Number.isFinite(Number(commissionDraft));

  const ecoQ = useQuery<Economics>({
    queryKey: ['admin', 'economics', draftValid ? commissionDraft : 'current'],
    queryFn: async () =>
      (
        await api.get('/admin/settings/economics', {
          params: draftValid ? { commission: commissionDraft } : {},
        })
      ).data,
  });

  const e = ecoQ.data;
  if (!e) return null;

  const isNegative = e.onlineMarginPercent < 0;

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all shadow-xs',
        isNegative
          ? 'border-destructive/40 bg-destructive/5'
          : 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10',
      )}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp
            className={cn(
              'size-5',
              isNegative ? 'text-destructive' : 'text-emerald-500',
            )}
          />
          <h3 className="text-sm font-bold text-foreground">
            Jonli Marja & Foyda Kalkulyatori{' '}
            {draftValid && (
              <span className="text-xs text-muted-foreground font-normal">
                (Komissiya {commissionDraft}% bo&apos;lsa)
              </span>
            )}
          </h3>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2.5 py-0.5 rounded-full border',
            isNegative
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          )}>
          {isNegative ? 'Zarar xavfi!' : 'Foydali model'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Online payment model */}
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-foreground">
              Onlayn (Click / Karta) Buyurtma
            </span>
            <span
              className={cn(
                'text-sm font-extrabold',
                isNegative ? 'text-destructive' : 'text-emerald-600',
              )}>
              {e.onlineMarginPercent}% sof marja
            </span>
          </div>
          <p className="text-[0.72rem] text-muted-foreground">
            Komissiya {e.commissionPercent}% − Click {e.clickFeePercent}% − Payout{' '}
            {e.payoutFeePercent}%
          </p>
          <div className="mt-2.5 pt-2 border-t border-border/60 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">100 000 so&apos;mda sof foyda:</span>
            <span className="font-extrabold text-foreground">
              {fmt(e.examplePer100k.online.platformNet)} so&apos;m
            </span>
          </div>
        </div>

        {/* Cash payment model */}
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-foreground">Naqd Buyurtma</span>
            <span className="text-sm font-extrabold text-emerald-600">
              {e.cashMarginPercent}% sof marja
            </span>
          </div>
          <p className="text-[0.72rem] text-muted-foreground">
            Ekvayring xarajati yo&apos;q, to&apos;liq komissiya qarz sifatida yig&apos;iladi
          </p>
          <div className="mt-2.5 pt-2 border-t border-border/60 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">100 000 so&apos;mda sof foyda:</span>
            <span className="font-extrabold text-foreground">
              {fmt(e.examplePer100k.cash.platformNet)} so&apos;m
            </span>
          </div>
        </div>
      </div>

      {e.warnings && e.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {e.warnings.map((w, idx) => (
            <p
              key={idx}
              className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <TriangleAlert className="size-3.5 shrink-0" /> {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function DidoxConnectionTester({ didoxKey }: { didoxKey?: string }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: unknown;
  } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.get('/admin/settings/test-didox', {
        params: didoxKey ? { key: didoxKey } : {},
      });
      setTestResult(res.data);
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      const msg = extractErrorMessage(err);
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const isConfigured = Boolean(didoxKey && didoxKey.trim() !== '');

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">
                Davlat Soliq & Didox Jonli Tekshiruv
              </h4>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold border',
                  isConfigured
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                )}>
                {isConfigured ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <KeyRound className="size-3" />
                )}
                {isConfigured ? 'Kalit kiritilgan' : 'Kalit kiritilmagan'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Yangi sotuvchilar ro&apos;yxatdan o&apos;tayotganda Davlat Soliq Qo&apos;mitasi
              (DSQ) bazasidan ma&apos;lumotlarni avtomatik tortish shlyuzi
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={testing}
          onClick={runTest}
          className="h-9 gap-1.5 rounded-xl border-border px-3 text-xs font-semibold shrink-0">
          <RefreshCw className={cn('size-3.5', testing && 'animate-spin')} />
          Ulanishni tekshirish
        </Button>
      </div>

      {testResult && (
        <div
          className={cn(
            'mt-4 rounded-xl p-3 text-xs border',
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
              : 'bg-destructive/10 border-destructive/20 text-destructive',
          )}>
          <p className="font-bold flex items-center gap-1.5">
            {testResult.success ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            {testResult.message}
          </p>
          {Boolean(testResult.data) && (
            <pre className="mt-2 max-h-36 overflow-auto rounded-lg bg-black/20 p-2.5 text-[11px] font-mono opacity-90 custom-scrollbar">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('finance');
  const [searchQuery, setSearchQuery] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError, error, refetch } = useQuery<Setting[]>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => (await api.get('/admin/settings')).data,
  });

  const saveMutation = useMutation({
    mutationFn: ({
      key,
      value,
      force,
    }: {
      key: string;
      value: string;
      force?: boolean;
    }) => api.put(`/admin/settings/${key}`, force ? { value, force } : { value }),
    onSuccess: (_, { key }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'economics'] });
      setEditing((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success('Sozlama muvaffaqiyatli saqlandi');
    },
    onError: (e, { key, value }) => {
      const msg = extractErrorMessage(e);
      if (msg.includes('force=true')) {
        if (window.confirm(`${msg}\n\nBaribir saqlashni tasdiqlaysizmi?`)) {
          saveMutation.mutate({ key, value, force: true });
        }
      } else {
        toast.error(msg);
      }
    },
  });

  const settingsList = data ?? [];

  // Group settings by tab
  const tabItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return settingsList.filter((s) => {
      const meta = SETTINGS_METADATA[s.key];
      if (q) {
        const matchLabel = (meta?.label || s.key).toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        const matchKey = s.key.toLowerCase().includes(q);
        return matchLabel || matchDesc || matchKey;
      }
      return meta?.tab === activeTab || (!meta && activeTab === 'finance');
    });
  }, [settingsList, activeTab, searchQuery]);

  const didoxKeyVal =
    editing.didox_user_key ??
    settingsList.find((s) => s.key === 'didox_user_key')?.value;

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="size-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">
          Tizim sozlamalari yuklanmoqda…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-sm font-medium text-destructive">{extractErrorMessage(error)}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Qayta urinish
        </Button>
      </div>
    );
  }

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType; count: number }[] = [
    {
      id: 'finance',
      label: 'Moliya & Komissiyalar',
      icon: DollarSign,
      count: settingsList.filter((s) => SETTINGS_METADATA[s.key]?.tab === 'finance').length,
    },
    {
      id: 'legal',
      label: 'Yuridik & Soliq (Didox)',
      icon: Building2,
      count: settingsList.filter((s) => SETTINGS_METADATA[s.key]?.tab === 'legal').length,
    },
    {
      id: 'fiscal',
      label: 'Fiskal & Cheklar',
      icon: Receipt,
      count: settingsList.filter((s) => SETTINGS_METADATA[s.key]?.tab === 'fiscal').length,
    },
    {
      id: 'risk',
      label: 'Anti-Fraud & Xavfsizlik',
      icon: ShieldAlert,
      count: settingsList.filter((s) => SETTINGS_METADATA[s.key]?.tab === 'risk').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tizim Sozlamalari"
        description="Platforma komissiyalari, soliq va Didox integratsiyasi, fiskallash va xavfsizlik chegaralari"
        breadcrumbs={[{ label: 'Sozlamalar' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Sozlamalardan qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-60 rounded-xl border border-border bg-card pl-9 pr-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        }
      />

      {/* Segmented Tab Navigation */}
      {!searchQuery && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}>
                <Icon className="size-4" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-[0.62rem] font-bold',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Special Contextual Widgets */}
      {activeTab === 'finance' && !searchQuery && (
        <EconomicsCalculator
          commissionDraft={editing.commission_rate_default}
        />
      )}

      {activeTab === 'legal' && !searchQuery && (
        <DidoxConnectionTester didoxKey={didoxKeyVal} />
      )}

      {/* Settings Grid Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {tabItems.map((s) => {
          const meta = SETTINGS_METADATA[s.key];
          const val = editing[s.key] ?? s.value;
          const dirty = editing[s.key] !== undefined;
          const isSecret = meta?.isSecret;
          const isRevealed = Boolean(showSecret[s.key]);
          const Icon = meta?.icon || HelpCircle;

          return (
            <Card
              key={s.key}
              className={cn(
                'flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-xs',
                dirty
                  ? 'border-primary/50 bg-primary/[0.02] shadow-md'
                  : 'border-border/80 bg-card hover:border-border',
              )}>
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4.5" />
                    </div>
                    <div>
                      {meta?.category && (
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                          {meta.category}
                        </p>
                      )}
                      <h4 className="text-sm font-bold text-foreground">
                        {meta?.label || s.key}
                      </h4>
                    </div>
                  </div>
                  {dirty && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                      O&apos;zgardi
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {meta?.hint || s.description || "Tizim parametri."}
                </p>
              </div>

              {/* Form Input Row */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {meta?.options ? (
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                      value={val}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))
                      }>
                      {meta.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : isSecret ? (
                    <div className="relative flex items-center">
                      <input
                        type={isRevealed ? 'text' : 'password'}
                        className="w-full rounded-xl border border-border bg-background pl-3 pr-8 py-2 text-xs font-mono font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        placeholder="Kalit kiritilmagan"
                        value={val}
                        onChange={(e) =>
                          setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowSecret((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
                        }
                        className="absolute right-2 text-muted-foreground hover:text-foreground">
                        {isRevealed ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={meta?.min ?? 0}
                        max={meta?.max}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        value={val}
                        onChange={(e) =>
                          setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))
                        }
                      />
                      {meta?.unit && (
                        <span className="absolute right-3 text-[0.7rem] font-bold text-muted-foreground pointer-events-none">
                          {meta.unit}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  disabled={!dirty || saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ key: s.key, value: val })}
                  className="h-9 gap-1.5 rounded-xl px-3.5 text-xs font-bold shrink-0">
                  <Save className="size-3.5" />
                  Saqlash
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

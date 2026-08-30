'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  FileCode,
  Gauge,
  HelpCircle,
  Hourglass,
  KeyRound,
  MapPin,
  Percent,
  QrCode,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  Timer,
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

type SettingsTab = 'finance' | 'legal' | 'fiscal' | 'risk' | 'inventory';

interface SettingMeta {
  tab: SettingsTab;
  label: string;
  category: string;
  unit?: string;
  icon: React.ElementType;
  hint: string;
  min?: number;
  max?: number;
  isSecret?: boolean;
  options?: { value: string; label: string; desc?: string }[];
}

/** 100% Complete metadata dictionary for EVERY setting key in backend */
const SETTINGS_METADATA: Record<string, SettingMeta> = {
  // ── 1. Finance & Economics ──
  commission_rate_default: {
    tab: 'finance',
    category: 'Komissiya Siyosati',
    label: 'Standart platforma komissiyasi',
    unit: '%',
    min: 0,
    max: 100,
    icon: Percent,
    hint: "Yangi buyurtmalarga qo'llanadigan standart vositachilik komissiyasi foizi (Standart: 12%).",
  },
  click_fee_percent: {
    tab: 'finance',
    category: 'Ekvayring & To\'lovlar',
    label: 'Click ekvayring to\'lov haqi',
    unit: '%',
    min: 0,
    max: 10,
    icon: DollarSign,
    hint: "Onlayn karta orqali to'lovlarda Click/Payme shlyuzlari ushlab qoladigan xarajat foizi.",
  },
  payout_fee_percent: {
    tab: 'finance',
    category: 'Ekvayring & To\'lovlar',
    label: 'Seller kartasiga pul yechish (Payout) haqi',
    unit: '%',
    min: 0,
    max: 10,
    icon: DollarSign,
    hint: "Sotuvchi o'z daromadini bank kartasiga yechib olayotganda bank ushlab qoladigan foiz.",
  },
  min_order_total: {
    tab: 'finance',
    category: 'Buyurtma Parametrlari',
    label: 'Minimal buyurtma summasi',
    unit: "so'm",
    min: 0,
    icon: DollarSign,
    hint: "Xaridor do'kondan buyurtma berishi mumkin bo'lgan eng kam savat summasi (0 = cheklovsiz).",
  },
  debt_due_days: {
    tab: 'finance',
    category: 'Qarzdorlik Nazorati',
    label: 'Naqd komissiya qarzini to\'lash muddati',
    unit: 'kun',
    min: 1,
    max: 90,
    icon: Clock,
    hint: "Naqd savdo komissiyasini platformaga to'lash uchun sellerga beriladigan maksimal muhlat.",
  },
  settlement_hours: {
    tab: 'finance',
    category: 'Buyurtma Parametrlari',
    label: 'Buyurtma muzlatish (Settlement) vaqti',
    unit: 'soat',
    min: 0,
    max: 168,
    icon: Hourglass,
    hint: "Buyurtma yetkazilgach, mijoz e'tiroz bildirmasa, mablag' sellerning yechish balansiga o'tish vaqti.",
  },

  // ── 2. Legal & Soliq (Didox) ──
  platform_legal_name: {
    tab: 'legal',
    category: 'Operator Yuridik Shaxsi',
    label: 'Operator (Platforma egasi) rasmiy nomi',
    icon: Building2,
    hint: 'Barcha shartnoma, oferta va elektron hisob-fakturalarda ko\'rsatiladigan rasmiy korxona nomi ("TILAV" MCHJ).',
  },
  platform_stir: {
    tab: 'legal',
    category: 'Operator Yuridik Shaxsi',
    label: 'Operator STIR (INN) raqami',
    icon: Building2,
    hint: "Operator korxonasining 9 xonali davlat soliq identifikatsiya raqami (313296455).",
  },
  didox_user_key: {
    tab: 'legal',
    category: 'Davlat Soliq & Didox Integratsiyasi',
    label: 'Didox API kaliti (user-key)',
    isSecret: true,
    icon: KeyRound,
    hint: "Didox shaxsiy kabinetidan olingan API kaliti. Yangi sellerlar STIR ma'lumotlarini Soliq bazasidan avtomatik tekshirish uchun xizmat qiladi.",
  },
  didox_api_url: {
    tab: 'legal',
    category: 'Davlat Soliq & Didox Integratsiyasi',
    label: 'Didox API server manzili',
    icon: Server,
    hint: "Standart qiymat: https://api.didox.uz",
  },

  // ── 3. Fiscal & Cheklar ──
  fiscal_mode: {
    tab: 'fiscal',
    category: 'Fiskallash Tartibi',
    label: 'Fiskal cheklar generatsiya rejimi',
    icon: Receipt,
    hint: 'Davlat Soliq Qo\'mitasi (OFD)ga elektron fiskal chek yuborish tartibi.',
    options: [
      {
        value: 'off',
        label: 'Off — Chek yaratilmaydi',
        desc: 'Fiskallash to\'liq o\'chirilgan (Test va ishlab chiqish rejimi)',
      },
      {
        value: 'collect',
        label: 'Collect — Cheklar yig\'iladi, yuborilmaydi',
        desc: 'Chek ma\'lumotlari bazada saqlanadi, lekin OFDga yuborilmaydi',
      },
      {
        value: 'live',
        label: 'Live — OFDga jonli yuboriladi',
        desc: 'Har bir buyurtma uchun avtomatik QR-kodli rasmiy fiskal chek beriladi',
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
  delivery_mxik_code: {
    tab: 'fiscal',
    category: 'Tasnif & MXIK',
    label: 'Yetkazib berish xizmati MXIK kodi',
    icon: FileCode,
    hint: 'Kuryerlik va yetkazib berish xizmati uchun Tasnif Soliq MXIK kodi (masalan: 05320001001000000).',
  },

  // ── 4. Risk & Anti-Fraud ──
  risk_low_rating_threshold: {
    tab: 'risk',
    category: 'Kuryer & Xizmat Sifati',
    label: 'Kuryer past baho xavf chegarasi',
    unit: 'yulduz',
    min: 1,
    max: 5,
    icon: Star,
    hint: 'Agar mijoz kuryerga ushbu yoki undan past baho (masalan 1 yoki 2 yulduz) qo\'ysa, tizim kuryerni avtomatik tekshiruv (Risk Flag) ro\'yxatiga kiritadi.',
  },
  risk_delivered_max_distance_m: {
    tab: 'risk',
    category: 'Lokatsiya & GPS Nazorati',
    label: '"Yetkazildi" bosishda mijoz manzilidan max masofa',
    unit: 'metr',
    min: 10,
    max: 5000,
    icon: MapPin,
    hint: 'Kuryer buyurtmani yakunlash (Yetkazildi) tugmasini bosganda, mijoz tanlagan manzildan eng ko\'pi bilan necha metr uzoqda bo\'lishi mumkin.',
  },
  risk_evidence_max_accuracy_m: {
    tab: 'risk',
    category: 'Lokatsiya & GPS Nazorati',
    label: 'GPS aniqligi (Accuracy) ruxsat chegarasi',
    unit: 'metr',
    min: 5,
    max: 200,
    icon: Gauge,
    hint: 'Kuryer smartfonidagi GPS aniqligi ushbu masofadan noaniq bo\'lsa (masalan 50m dan yomon), joylashuv noaniq deb qabul qilinadi.',
  },
  risk_pickup_max_distance_m: {
    tab: 'risk',
    category: 'Lokatsiya & GPS Nazorati',
    label: '"Do\'kondan oldi" bosishda do\'kondan max masofa',
    unit: 'metr',
    min: 10,
    max: 5000,
    icon: Store,
    hint: 'Kuryer tovarlarni do\'kondan qabul qilib olganda do\'kon binosidan maksimal qancha masofada bo\'lishi mumkin.',
  },
  risk_address_pin_max_distance_m: {
    tab: 'risk',
    category: 'Mijoz Manzili Nazorati',
    label: 'Mijoz manzil pini va GPS masofa chegarasi',
    unit: 'metr',
    min: 0,
    max: 10000,
    icon: MapPin,
    hint: 'Mijoz xaritada belgilagan yetkazish nuqtasi bilan uning real GPS lokatsiyasi orasidagi farq (0 = o\'chirilgan).',
  },
  risk_shop_relocation_max_m: {
    tab: 'risk',
    category: 'Do\'kon Xavfsizligi',
    label: 'Faol do\'kon koordinatasi siljish chegarasi',
    unit: 'metr',
    min: 50,
    max: 5000,
    icon: Store,
    hint: 'Faol yoki buyurtmalari bor do\'kon o\'z manzilini bu masofadan ko\'proq siljitsa, shubhali faoliyat sifatida adminlarga xabar beriladi.',
  },
  risk_impossible_speed_kmh: {
    tab: 'risk',
    category: 'Harakat & Soxta GPS',
    label: 'Imkonsiz tezlik (Teleportatsiya) chegarasi',
    unit: 'km/soat',
    min: 30,
    max: 300,
    icon: Zap,
    hint: 'Agar kuryer ikki nuqta orasida bu tezlikdan yuqori masofa bosib o\'tsa, soxta GPS (Fake Location) xavf signali yoqiladi.',
  },
  risk_impossible_min_segment_m: {
    tab: 'risk',
    category: 'Harakat & Soxta GPS',
    label: 'Tezlik tekshiruvi uchun minimal oraliq',
    unit: 'metr',
    min: 10,
    max: 1000,
    icon: MapPin,
    hint: 'Tezlik tekshiruvi hisoblanishi uchun kuryer kamida shuncha metr masofani bosib o\'tgan bo\'lishi kerak.',
  },
  risk_device_max_accounts: {
    tab: 'risk',
    category: 'Akkauntlar & Anti-Abuse',
    label: 'Bitta qurilmadagi maksimal akkaunt soni',
    unit: 'ta',
    min: 1,
    max: 20,
    icon: Smartphone,
    hint: 'Bitta telefondan haftasiga ko\'p sonli akkaunt ochish yoki promo-kodlarni suiiste\'mol qilishni cheklovchi limit.',
  },
  risk_ping_min_interval_sec: {
    tab: 'risk',
    category: 'GPS Marshrut',
    label: 'Kuryer GPS treki ping oralig\'i',
    unit: 'soniya',
    min: 1,
    max: 60,
    icon: Timer,
    hint: 'Yetkazib berish jarayonida kuryer smartfonidan serverga GPS koordinatalari necha soniyada bir marta yangilanib yuboriladi.',
  },
  risk_ping_retention_days: {
    tab: 'risk',
    category: 'Audit & Saqlash',
    label: 'Kuryer GPS treki saqlash muddati',
    unit: 'kun',
    min: 1,
    max: 365,
    icon: Clock,
    hint: 'GPS marshrut koordinatalari bazada necha kun saqlanadi.',
  },
  risk_qr_handshake_enabled: {
    tab: 'risk',
    category: 'Tasdiqlash Mexanizmlari',
    label: 'QR-kod orqali topshirish tasdig\'i',
    icon: QrCode,
    hint: '1 = Kuryer xaridorga tovar berganda QR skaner qilish talab qilinadi, 0 = Standart PIN tasdiq.',
    options: [
      { value: '1', label: '1 — QR-kod tasdig\'i majburiy' },
      { value: '0', label: '0 — Standart PIN / tugmacha tasdig\'i' },
    ],
  },

  // ── 5. Inventory & Mahsulotlar ──
  expiry_warning_days: {
    tab: 'inventory',
    category: 'Yaroqlilik Muddati',
    label: 'Yaroqlilik muddati ogohlantirish vaqti',
    unit: 'kun',
    min: 1,
    max: 90,
    icon: Clock,
    hint: 'Mahsulotning yaroqlilik muddati tugashiga shuncha kun qolganda do\'konga va adminga ogohlantirish xabari boradi.',
  },
  expiry_critical_days: {
    tab: 'inventory',
    category: 'Yaroqlilik Muddati',
    label: 'Yaroqlilik muddati kritik chegarasi',
    unit: 'kun',
    min: 1,
    max: 30,
    icon: AlertTriangle,
    hint: 'Muddati tugashiga shuncha kun qolgan mahsulotlar avtomatik tarzda vitrinadan yashiriladi va sotuvi to\'xtatiladi.',
  },
  low_stock_warning_default: {
    tab: 'inventory',
    category: 'Ombor Qoldiqlari',
    label: 'Kam qolgan tovar ogohlantirish soni',
    unit: 'dona',
    min: 1,
    max: 100,
    icon: Boxes,
    hint: 'Mahsulot qoldig\'i ushbu miqdordan kamaysa, sotuvchiga tovar tugayotgani haqida bildirishnoma boradi.',
  },
  low_stock_critical_default: {
    tab: 'inventory',
    category: 'Ombor Qoldiqlari',
    label: 'Tugash arafasidagi kritik qoldiq soni',
    unit: 'dona',
    min: 0,
    max: 50,
    icon: Boxes,
    hint: 'Mahsulot qoldig\'i ushbu songa tushganda omborda tovar tugayotganlik xavfi belgilanadi.',
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

const EMPTY_SETTINGS: Setting[] = [];

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

  const settingsList = data ?? EMPTY_SETTINGS;

  const tabItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return settingsList.filter((s) => {
      const meta = SETTINGS_METADATA[s.key];
      if (q) {
        const matchLabel = (meta?.label || s.key).toLowerCase().includes(q);
        const matchDesc = (s.description || meta?.hint || '').toLowerCase().includes(q);
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
    {
      id: 'inventory',
      label: 'Ombor & Mahsulotlar',
      icon: Boxes,
      count: settingsList.filter((s) => SETTINGS_METADATA[s.key]?.tab === 'inventory').length,
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

          const label = meta?.label || s.key;
          const category = meta?.category || 'Tizim Parametri';
          const hint = meta?.hint || s.description || 'Platforma konfiguratsiyasi.';

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
                      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                        {category}
                      </p>
                      <h4 className="text-sm font-bold text-foreground">
                        {label}
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
                  {hint}
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

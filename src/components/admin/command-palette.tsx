'use client';

import {
  AlertTriangle,
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  FolderTree,
  HandCoins,
  History,
  Inbox,
  LayoutDashboard,
  MessageSquareWarning,
  ReceiptText,
  Search,
  Settings,
  ShieldAlert,
  Smartphone,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useEscapeKey } from '@/lib/use-escape-key';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
}

export const ADMIN_PAGES: CommandItem[] = [
  // 1. Umumiy
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'Umumiy Boshqaruv',
    description: 'Jonli savdo ko\'rsatkichlari, buyurtmalar oqimi va xulosalar',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    keywords: ['bosh', 'statistika', 'metrika', 'savdo', 'gmv'],
  },
  {
    id: 'analytics',
    title: 'Analitika',
    category: 'Umumiy Boshqaruv',
    description: 'Sotuvlar dinamikasi, grafiklar va tahlillar',
    href: '/admin/analytics',
    icon: TrendingUp,
    keywords: ['grafik', 'hisobot', 'tahlil', 'trend'],
  },

  // 2. Savdo & Do'konlar
  {
    id: 'applications',
    title: 'Do\'kon arizalari',
    category: 'Savdo & Do\'konlar',
    description: 'Yangi sotuvchilar (seller) hamkorlik arizalari',
    href: '/admin/applications',
    icon: FileText,
    keywords: ['ariza', 'seller', 'sotuvchi', 'onboarding', 'oferta', 'stir'],
  },
  {
    id: 'shops',
    title: 'Do\'konlar tarmog\'i',
    category: 'Savdo & Do\'konlar',
    description: 'Faol do\'konlar, filiallar va xaritadagi lokatsiyalar',
    href: '/admin/shops',
    icon: Store,
    keywords: ['filial', 'lokatsiya', 'xarita', 'market'],
  },
  {
    id: 'orders',
    title: 'Buyurtmalar',
    category: 'Savdo & Do\'konlar',
    description: 'Barcha tushgan buyurtmalar, holatlar va kuryerlar',
    href: '/admin/orders',
    icon: ClipboardList,
    keywords: ['zakaz', 'yetkazish', 'kuryer', 'mijoz', 'to\'lov'],
  },
  {
    id: 'catalog',
    title: 'Global katalog & Mahsulotlar',
    category: 'Savdo & Do\'konlar',
    description: 'Mahsulotlar bazasi, shtrix-kodlar va Excel import',
    href: '/admin/catalog',
    icon: BookOpen,
    keywords: ['tovar', 'tovarlar', 'narx', 'barcode', 'excel', 'import'],
  },
  {
    id: 'categories',
    title: 'Kategoriyalar',
    category: 'Savdo & Do\'konlar',
    description: 'Katalog toifalari va 3 bosqichli kategoriya daraxti',
    href: '/admin/categories',
    icon: FolderTree,
    keywords: ['toifa', 'bolim', 'daraxt', 'slug'],
  },

  // 3. Moliya & Soliq
  {
    id: 'balance',
    title: 'Balanslar & Hamyonlar',
    category: 'Moliya & Soliq',
    description: 'Do\'konlar balansi, depozitlar va tranzaksiyalar',
    href: '/admin/balance',
    icon: Wallet,
    keywords: ['hamyon', 'tranzaksiya', 'hisob', 'pul'],
  },
  {
    id: 'withdrawals',
    title: 'Pul yechish so\'rovlari',
    category: 'Moliya & Soliq',
    description: 'Sotuvchilarning karta orqali pul yechish arizalari',
    href: '/admin/withdrawals',
    icon: CreditCard,
    keywords: ['yechish', 'karta', 'payout', 'uzcard', 'humo'],
  },
  {
    id: 'debts',
    title: 'Komissiya qarzlari',
    category: 'Moliya & Soliq',
    description: 'Naqd buyurtmalar bo\'yicha yig\'ilgan qarzlar',
    href: '/admin/debts',
    icon: AlertTriangle,
    keywords: ['qarz', 'naqd', 'foiz', 'undirish'],
  },
  {
    id: 'payables',
    title: 'Do\'kon majburiyatlari',
    category: 'Moliya & Soliq',
    description: 'Platformaning sotuvchilar oldidagi to\'lov majburiyatlari',
    href: '/admin/payables',
    icon: HandCoins,
    keywords: ['majburiyat', 'haq', 'tushum'],
  },
  {
    id: 'prime',
    title: 'Prime obuna',
    category: 'Moliya & Soliq',
    description: 'Yaqin Prime VIP obuna tariflari va obunachilar',
    href: '/admin/prime',
    icon: Star,
    keywords: ['vip', 'tarif', 'obunachi', 'bonus'],
  },
  {
    id: 'fiscal',
    title: 'Soliq & Fiskal cheklar',
    category: 'Moliya & Soliq',
    description: 'OFD, Soliq (DSQ) cheklari va fiskal integratsiya',
    href: '/admin/fiscal',
    icon: ReceiptText,
    keywords: ['soliq', 'ofd', 'chek', 'dsq', 'fiskal', 'e-imzo', 'eri'],
  },

  // 4. Mijozlar & Qo'llab-quvvatlash
  {
    id: 'users',
    title: 'Foydalanuvchilar & Mijozlar',
    category: 'Mijozlar & CRM',
    description: 'Barcha xaridorlar, sotuvchilar va ro\'yxatdan o\'tganlar',
    href: '/admin/users',
    icon: Users,
    keywords: ['mijoz', 'xaridor', 'telefon', 'profil'],
  },
  {
    id: 'inquiries',
    title: 'Murojaatlar (Inquiries)',
    category: 'Mijozlar & CRM',
    description: 'Sayt va ilovadan kelgan aloqa xabarlari',
    href: '/admin/inquiries',
    icon: Inbox,
    keywords: ['xabar', 'aloqa', 'kontakt', 'murojaat'],
  },
  {
    id: 'complaints',
    title: 'Shikoyatlar & Nizolar',
    category: 'Mijozlar & CRM',
    description: 'Buyurtmalar bo\'yicha mijoz e\'tirozlari va arbitraj',
    href: '/admin/complaints',
    icon: MessageSquareWarning,
    keywords: ['shikoyat', 'nizo', 'muammo', 'rad'],
  },
  {
    id: 'reviews',
    title: 'Sharhlar & Baholar',
    category: 'Mijozlar & CRM',
    description: 'Mahsulotlar va do\'konlarga qoldirilgan reytinglar',
    href: '/admin/reviews',
    icon: Star,
    keywords: ['baho', 'sharh', 'otziv', 'yulduz'],
  },

  // 5. Xavfsizlik & Tizim
  {
    id: 'risk',
    title: 'Xavf signallari (Anti-Fraud)',
    category: 'Xavfsizlik & Tizim',
    description: 'Kuryer va buyurtma lokatsiya anomaliyalari',
    href: '/admin/risk',
    icon: ShieldAlert,
    keywords: ['fraud', 'xavf', 'gps', 'anomaliya', 'kuryer'],
  },
  {
    id: 'staff',
    title: 'Xodimlar & Rollar',
    category: 'Xavfsizlik & Tizim',
    description: 'Admin, moderator, buxgalter ruxsatlari va taklifnomalar',
    href: '/admin/staff',
    icon: UserCheck,
    keywords: ['xodim', 'staff', 'rol', 'admin', 'moderator'],
  },
  {
    id: 'notifications',
    title: 'Bildirishnomalar (Push/SMS)',
    category: 'Xavfsizlik & Tizim',
    description: 'Foydalanuvchilarga ommaviy push va SMS yuborish',
    href: '/admin/notifications',
    icon: Bell,
    keywords: ['push', 'sms', 'xabarnoma', 'reklama'],
  },
  {
    id: 'releases',
    title: 'Ilova versiyalari (Releases)',
    category: 'Xavfsizlik & Tizim',
    description: 'Mobil ilova versiyalari, OTA yangilanishlar',
    href: '/admin/releases',
    icon: Smartphone,
    keywords: ['apk', 'versiya', 'yangilanish', 'ota', 'build'],
  },
  {
    id: 'audit-log',
    title: 'Amallar tarixi (Audit Log)',
    category: 'Xavfsizlik & Tizim',
    description: 'Adminlar harakatlari xavfsizlik jurnali',
    href: '/admin/audit-log',
    icon: History,
    keywords: ['audit', 'tarix', 'harakat', 'log'],
  },
  {
    id: 'settings',
    title: 'Tizim sozlamalari',
    category: 'Xavfsizlik & Tizim',
    description: 'Komissiya stavkasi, E-IMZO/Soliq kalitlari va parametrlar',
    href: '/admin/settings',
    icon: Settings,
    keywords: ['sozlama', 'soliq', 'e-imzo', 'eri', 'komissiya', 'token', 'kalit'],
  },
];

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return ADMIN_PAGES;
    return ADMIN_PAGES.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchKey = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCat || matchKey;
    });
  }, [query]);

  const handleSelect = (item: CommandItem) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:p-6 sm:pt-24 animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="size-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="Sahifa, buyurtma, do'kon yoki xizmatni qidiring... (masalan: Soliq, Katalog)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[0.65rem] font-mono text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              &quot;{query}&quot; bo&apos;yicha hech qanday bo&apos;lim topilmadi
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted/60 text-foreground'
                  }`}>
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <span
                        className={`text-[0.65rem] px-1.5 py-0.5 rounded font-medium ${
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[0.7rem] text-muted-foreground">
          <span>Har qanday sahifaga tez o&apos;tish</span>
          <div className="flex items-center gap-2">
            <span>Tanlash: <b>Enter</b></span>
            <span>Navigatsiya: <b>↑ ↓</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}

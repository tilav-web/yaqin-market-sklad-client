import {
  Languages,
  MapPin,
  MessageCircle,
  Package,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { Card } from '@/components/ui/card';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: MapPin,
    title: 'Yaqin do’konlar xaritada',
    description: 'Atrofingizdagi do’konlarni xaritada pin sifatida ko’ring va eng yaqinini tanlang.',
  },
  {
    icon: Truck,
    title: 'Tez yetkazib berish',
    description: 'Yaqinligi tufayli buyurtmalar daqiqalar ichida eshigingizgacha yetib keladi.',
  },
  {
    icon: ShoppingCart,
    title: 'Bir savatda ko’p do’kon',
    description: 'Bir nechta do’kondan mahsulotlarni bitta savatga yig’ib, yagona buyurtma bering.',
  },
  {
    icon: MessageCircle,
    title: 'Sotuvchi bilan chat',
    description: 'Sotuvchi bilan real vaqtda yozishing, savol bering va buyurtmani aniqlashtiring.',
  },
  {
    icon: Star,
    title: 'Sharhlar va reyting',
    description: 'Do’konlar va mahsulotlarni baholang, boshqalarning sharhlariga ishoning.',
  },
  {
    icon: Languages,
    title: '3 tilda interfeys',
    description: 'O’zbek, кирилл va русский tillarida qulay foydalanish imkoniyati.',
  },
  {
    icon: Store,
    title: 'Mobil sklad boshqaruvi',
    description: 'Sotuvchilar uchun ombor, mahsulot va narxlarni telefon orqali boshqarish.',
  },
  {
    icon: Wallet,
    title: 'Nasiya (qarz) hisobi',
    description: 'Mijozlar bilan nasiya savdosini yuriting va qarzlarni shaffof hisobga oling.',
  },
  {
    icon: Package,
    title: 'Statistika va xodimlar',
    description: 'Sotuvlar statistikasi, kuryer va kassir kabi xodimlarni boshqarish.',
  },
];

export function LandingFeatures() {
  return (
    <section id="imkoniyatlar" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Imkoniyatlar
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Mijozlar uchun qulay xarid, sotuvchilar uchun kuchli sklad — barchasi bitta ilovada.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_50px_-30px_color-mix(in_oklch,var(--color-primary)_55%,transparent)]">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <feature.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

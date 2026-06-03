import { MapPin, Truck, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_18%,transparent),transparent)]"
      />
      <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <Badge variant="primary" className="mb-6">
          <Zap />
          Giperlokal FMCG marketpleys
        </Badge>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
          Yaqin atrofingizdagi do&apos;konlardan{' '}
          <span className="text-primary">eng tez</span> yetkazib berish
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Oziq-ovqat va kundalik mahsulotlarni yaqin atrofdagi do&apos;konlardan buyurtma qiling.
          Bir nechta do&apos;kondan bitta savatda, real vaqtda kuzatib boring va daqiqalar ichida
          qabul qiling.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#yuklab-olish">
            <Button size="lg" className="h-12 px-8 text-base">
              Ilovani yuklab olish
            </Button>
          </a>
          <a href="#imkoniyatlar">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Imkoniyatlar bilan tanishish
            </Button>
          </a>
        </div>
        <div className="mx-auto mt-12 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4 text-primary" /> Yaqin do&apos;konlar xaritada
          </span>
          <span className="inline-flex items-center gap-2">
            <Truck className="size-4 text-primary" /> Tez yetkazib berish
          </span>
          <span className="inline-flex items-center gap-2">
            <Zap className="size-4 text-primary" /> 3 tilda interfeys
          </span>
        </div>
      </div>
    </section>
  );
}

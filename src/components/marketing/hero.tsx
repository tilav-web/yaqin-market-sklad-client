'use client';

import { MapPin, Truck, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/use-t';

export function MarketingHero() {
  const { t } = useT();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="animate-gradient-shift pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--color-primary)_22%,transparent),color-mix(in_oklch,orange_16%,transparent),color-mix(in_oklch,var(--color-primary)_14%,transparent))]"
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -top-10 right-[8%] hidden size-24 rounded-3xl bg-primary/15 blur-2xl sm:block"
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute top-32 left-[6%] hidden size-16 rounded-full bg-orange-400/20 blur-xl sm:block"
        style={{ animationDelay: '1.5s' }}
      />

      <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <Badge variant="primary" className="mb-6">
          <Zap />
          {t.home.badge}
        </Badge>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
          {t.home.title1} <span className="text-primary">{t.home.titleHighlight}</span>{' '}
          {t.home.title2}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          {t.home.subtitle}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#yuklab-olish">
            <Button
              size="lg"
              className="h-12 bg-gradient-to-r from-primary to-orange-500 px-8 text-base shadow-lg shadow-primary/25 hover:opacity-90">
              {t.home.ctaPrimary}
            </Button>
          </a>
          <a href="#qanday-ishlaydi">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              {t.home.ctaSecondary}
            </Button>
          </a>
        </div>
        <div className="mx-auto mt-12 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4 text-primary" /> {t.home.trustMap}
          </span>
          <span className="inline-flex items-center gap-2">
            <Truck className="size-4 text-primary" /> {t.home.trustDelivery}
          </span>
          <span className="inline-flex items-center gap-2">
            <Zap className="size-4 text-primary" /> {t.home.trustLang}
          </span>
        </div>
      </div>
    </section>
  );
}

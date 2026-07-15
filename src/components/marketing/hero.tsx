'use client';

import { Sparkles, MapPin, Truck, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/use-t';

export function MarketingHero() {
  const { t } = useT();

  return (
    <section className="relative overflow-hidden border-b border-zinc-200/40 bg-gradient-to-b from-zinc-50/60 via-white to-zinc-50/30">
      {/* Soft decorative background glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--color-primary)_10%,transparent),transparent_50%)]"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
          <Sparkles className="size-3.5 text-primary" />
          {t.home.badge}
        </div>
        <h1 className="mx-auto max-w-4xl font-heading text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-6xl md:text-7xl">
          {t.home.title1} <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">{t.home.titleHighlight}</span>{' '}
          {t.home.title2}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-pretty text-base leading-relaxed text-zinc-500 sm:text-lg">
          {t.home.subtitle}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#yuklab-olish">
            <Button
              size="lg"
              className="h-12 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
              {t.home.ctaPrimary}
            </Button>
          </a>
          <a href="#qanday-ishlaydi">
            <Button variant="outline" size="lg" className="h-12 rounded-full border-zinc-200 px-8 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
              {t.home.ctaSecondary}
            </Button>
          </a>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-medium text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="size-3.5" />
            </span>
            {t.home.trustMap}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="size-3.5" />
            </span>
            {t.home.trustDelivery}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Zap className="size-3.5" />
            </span>
            {t.home.trustLang}
          </span>
        </div>
      </div>
    </section>
  );
}

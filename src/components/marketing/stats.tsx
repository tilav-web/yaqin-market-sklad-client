'use client';

import { Reveal } from '@/components/marketing/reveal';
import { useT } from '@/lib/i18n/use-t';

export function MarketingStats() {
  const { t } = useT();

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-12 sm:px-8 md:grid-cols-4">
        {t.home.stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 80} className="text-center">
            <p className="bg-gradient-to-br from-primary to-orange-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

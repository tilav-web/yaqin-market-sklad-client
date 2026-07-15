'use client';

import { Reveal } from '@/components/marketing/reveal';
import { useT } from '@/lib/i18n/use-t';

export function MarketingStats() {
  const { t } = useT();

  return (
    <section className="border-y border-zinc-200/40 bg-zinc-50/20">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-16 sm:px-8 md:grid-cols-4">
        {t.home.stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 80} className="text-center">
            <p className="font-heading bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

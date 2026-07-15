'use client';

import { Reveal } from '@/components/marketing/reveal';
import { useT } from '@/lib/i18n/use-t';
import type { MarketingLang } from '@/lib/i18n/dictionary';

interface LegalSection {
  heading: string;
  body: string;
}

const UPDATED_DATE: Record<MarketingLang, string> = {
  uz: '2026-yil 15-iyul',
  uzc: '2026 йил 15 июль',
  ru: '15 июля 2026 г.',
};

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  const { t, lang } = useT();

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {t.legal.updatedPrefix}: {UPDATED_DATE[lang]}
      </p>
      <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section, i) => (
          <Reveal key={section.heading} delay={Math.min(i * 40, 240)}>
            <h2 className="text-lg font-bold text-foreground">{section.heading}</h2>
            <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

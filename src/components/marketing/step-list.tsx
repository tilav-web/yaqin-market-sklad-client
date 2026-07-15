'use client';

import { Reveal } from '@/components/marketing/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';

interface Step {
  title: string;
  desc: string;
}

/** Numbered step list — reused for "how it works" flows on the home,
 * users and sellers pages. */
export function StepList({
  id,
  eyebrow,
  title,
  subtitle,
  steps,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  steps: Step[];
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 100} className="relative">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 text-lg font-extrabold text-primary-foreground shadow-md shadow-primary/20">
              {i + 1}
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            {i < steps.length - 1 ? (
              <div
                aria-hidden
                className="absolute top-5 left-[calc(100%+1rem)] hidden h-px w-8 bg-gradient-to-r from-primary/40 to-transparent lg:block"
              />
            ) : null}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

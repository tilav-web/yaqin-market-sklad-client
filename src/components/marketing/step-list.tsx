'use client';

import { Reveal } from '@/components/marketing/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';

interface Step {
  title: string;
  desc: string;
}

/** Numbered step list — reused for "how it works" flows */
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
    <section id={id} className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 100} className="relative">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground shadow-sm">
              {i + 1}
            </div>
            <h3 className="mt-5 font-heading text-base font-semibold text-zinc-900">{step.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-500">{step.desc}</p>
            {i < steps.length - 1 ? (
              <div
                aria-hidden
                className="absolute top-5 left-[calc(100%+1rem)] hidden h-px w-10 bg-gradient-to-r from-zinc-200 to-transparent lg:block"
              />
            ) : null}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

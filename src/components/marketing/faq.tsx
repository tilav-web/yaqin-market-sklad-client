'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Reveal } from '@/components/marketing/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { cn } from '@/lib/cn';

interface FaqItem {
  q: string;
  a: string;
}

export function Faq({ title, items }: { title: string; items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeading title={title} />
      <div className="mt-10 space-y-3">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <Reveal key={item.q} delay={i * 60}>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="text-sm font-semibold text-foreground">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-muted-foreground transition-transform',
                      open && 'rotate-180 text-primary',
                    )}
                  />
                </button>
                {open ? (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                ) : null}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

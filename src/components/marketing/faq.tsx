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
    <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
      <SectionHeading title={title} />
      <div className="mt-12 space-y-4">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <Reveal key={item.q} delay={i * 60}>
              <div
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white transition-all duration-300 shadow-sm',
                  open ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' : 'border-zinc-200/80 hover:border-zinc-300',
                )}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="font-heading text-sm font-semibold text-zinc-900">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-zinc-400 transition-transform duration-300',
                      open && 'rotate-180 text-emerald-600',
                    )}
                  />
                </button>
                {open ? (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-zinc-500 border-t border-zinc-100 pt-4">
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

'use client';

import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/marketing/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { cn } from '@/lib/cn';

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

/** Icon+title+desc card grid — reused across home/users/sellers pages */
export function FeatureGrid({
  id,
  eyebrow,
  title,
  subtitle,
  items,
  columns = 3,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  items: FeatureItem[];
  columns?: 2 | 3;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      {title ? <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} /> : null}
      <div
        className={cn(
          'grid grid-cols-1 gap-6 sm:grid-cols-2',
          title && 'mt-16',
          columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2',
        )}>
        {items.map((item, i) => (
          <Reveal key={item.title} delay={(i % 3) * 80}>
            <Card className="group h-full p-8 border border-zinc-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_12px_30px_-10px_color-mix(in_oklch,var(--color-primary)_35%,transparent)]">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-heading text-base font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-500">{item.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

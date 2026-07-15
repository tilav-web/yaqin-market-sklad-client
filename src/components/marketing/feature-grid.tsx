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

/** Icon+title+desc card grid — reused across home/users/sellers pages with
 * different content and column counts. */
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
    <section id={id} className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      {title ? <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} /> : null}
      <div
        className={cn(
          'grid grid-cols-1 gap-5 sm:grid-cols-2',
          title && 'mt-12',
          columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2',
        )}>
        {items.map((item, i) => (
          <Reveal key={item.title} delay={(i % 3) * 80}>
            <Card className="group h-full p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_50px_-30px_color-mix(in_oklch,var(--color-primary)_55%,transparent)]">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-orange-500 group-hover:text-primary-foreground">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

'use client';

import { ArrowRight, ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/marketing/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { useT } from '@/lib/i18n/use-t';

export function DualCta() {
  const { t } = useT();

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeading title={t.home.dualTitle} />
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Reveal>
          <Link
            href="/foydalanuvchilar"
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-primary/10 transition-transform group-hover:scale-125"
            />
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 text-primary-foreground shadow-md">
              <ShoppingBag className="size-7" />
            </div>
            <h3 className="relative mt-6 text-xl font-bold text-foreground">
              {t.home.dualCustomerTitle}
            </h3>
            <p className="relative mt-2 flex-1 text-sm text-muted-foreground">
              {t.home.dualCustomerDesc}
            </p>
            <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {t.home.dualCustomerCta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <Link
            href="/sotuvchilar"
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-orange-400/10 transition-transform group-hover:scale-125"
            />
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-primary text-primary-foreground shadow-md">
              <Store className="size-7" />
            </div>
            <h3 className="relative mt-6 text-xl font-bold text-foreground">
              {t.home.dualSellerTitle}
            </h3>
            <p className="relative mt-2 flex-1 text-sm text-muted-foreground">
              {t.home.dualSellerDesc}
            </p>
            <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {t.home.dualSellerCta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

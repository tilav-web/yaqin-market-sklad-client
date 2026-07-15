'use client';

import { ArrowRight, ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/marketing/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { useT } from '@/lib/i18n/use-t';

export function DualCta() {
  const { t } = useT();

  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <SectionHeading title={t.home.dualTitle} />
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <Reveal>
          <Link
            href="/foydalanuvchilar"
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-emerald-50/40 transition-transform duration-300 group-hover:scale-125"
            />
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <ShoppingBag className="size-6" />
            </div>
            <h3 className="relative mt-8 font-heading text-xl font-semibold text-zinc-900">
              {t.home.dualCustomerTitle}
            </h3>
            <p className="relative mt-3 flex-1 text-sm leading-relaxed text-zinc-500">
              {t.home.dualCustomerDesc}
            </p>
            <span className="relative mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition-colors group-hover:text-emerald-700">
              {t.home.dualCustomerCta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <Link
            href="/sotuvchilar"
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-emerald-50/40 transition-transform duration-300 group-hover:scale-125"
            />
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <Store className="size-6" />
            </div>
            <h3 className="relative mt-8 font-heading text-xl font-semibold text-zinc-900">
              {t.home.dualSellerTitle}
            </h3>
            <p className="relative mt-3 flex-1 text-sm leading-relaxed text-zinc-500">
              {t.home.dualSellerDesc}
            </p>
            <span className="relative mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition-colors group-hover:text-emerald-700">
              {t.home.dualSellerCta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

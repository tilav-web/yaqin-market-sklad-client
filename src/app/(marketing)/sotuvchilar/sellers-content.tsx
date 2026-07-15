'use client';

import { CheckCircle2, Percent } from 'lucide-react';
import { AlertTriangle, History, Package, Users } from 'lucide-react';
import { MapPin, Settings, Store, Truck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { MarketingDownload } from '@/components/marketing/download';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { PageHero } from '@/components/marketing/page-hero';
import { Reveal } from '@/components/marketing/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { StepList } from '@/components/marketing/step-list';
import { useT } from '@/lib/i18n/use-t';

const WHY_ICONS = [MapPin, Truck, Settings, Store];
const WAREHOUSE_ICONS = [Package, History, AlertTriangle, Users];

export function SellersContent() {
  const { t } = useT();

  return (
    <>
      <PageHero badge={t.sellers.badge} title={t.sellers.title} subtitle={t.sellers.subtitle} />
      <FeatureGrid
        title={t.sellers.whyTitle}
        items={t.sellers.why.map((w, i) => ({ ...w, icon: WHY_ICONS[i] }))}
        columns={2}
      />
      <StepList
        title={t.sellers.stepsTitle}
        subtitle={t.sellers.stepsSubtitle}
        steps={t.sellers.steps}
      />

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionHeading title={t.sellers.reqTitle} />
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Reveal>
            <Card className="h-full p-8 border border-zinc-200/80 bg-white rounded-3xl shadow-sm">
              <h3 className="font-heading text-base font-semibold text-zinc-900">{t.sellers.reqMinimalTitle}</h3>
              <ul className="mt-5 space-y-4">
                {t.sellers.reqMinimalItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-500">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
          <Reveal delay={100}>
            <Card className="h-full p-8 border border-zinc-200/80 bg-white rounded-3xl shadow-sm">
              <h3 className="font-heading text-base font-semibold text-zinc-900">{t.sellers.reqApprovalTitle}</h3>
              <ul className="mt-5 space-y-4">
                {t.sellers.reqApprovalItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-500">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>

        <Reveal delay={150} className="mt-8">
          <Card className="overflow-hidden border border-primary/15 bg-gradient-to-br from-primary/8 to-orange-50/50 p-8 rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 text-primary-foreground shadow-sm shadow-primary/10">
                <Percent className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-zinc-900">{t.sellers.commissionTitle}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-500">
                  {t.sellers.commissionDesc}
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      </section>

      <FeatureGrid
        title={t.sellers.warehouseTitle}
        items={t.sellers.warehouse.map((w, i) => ({ ...w, icon: WAREHOUSE_ICONS[i] }))}
      />

      <section className="mx-auto max-w-3xl px-5 pb-8 text-center sm:px-8">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {t.sellers.ctaTitle}
        </h2>
        <p className="mt-4 text-pretty text-sm leading-relaxed text-zinc-500">{t.sellers.ctaDesc}</p>
      </section>

      <MarketingDownload />
    </>
  );
}

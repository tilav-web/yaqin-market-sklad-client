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

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHeading title={t.sellers.reqTitle} />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Reveal>
            <Card className="h-full p-7">
              <h3 className="text-base font-bold text-foreground">{t.sellers.reqMinimalTitle}</h3>
              <ul className="mt-4 space-y-3">
                {t.sellers.reqMinimalItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
          <Reveal delay={100}>
            <Card className="h-full p-7">
              <h3 className="text-base font-bold text-foreground">{t.sellers.reqApprovalTitle}</h3>
              <ul className="mt-4 space-y-3">
                {t.sellers.reqApprovalItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>

        <Reveal delay={150} className="mt-6">
          <Card className="overflow-hidden bg-gradient-to-br from-primary/10 to-orange-400/10 p-7">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 text-primary-foreground shadow-sm">
                <Percent className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{t.sellers.commissionTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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

      <section className="mx-auto max-w-3xl px-5 pb-4 text-center sm:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t.sellers.ctaTitle}
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">{t.sellers.ctaDesc}</p>
      </section>

      <MarketingDownload />
    </>
  );
}

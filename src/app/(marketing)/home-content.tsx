'use client';

import {
  Languages,
  MapPin,
  MessageCircle,
  Package,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Wallet,
} from 'lucide-react';

import { MarketingContact } from '@/components/marketing/contact';
import { MarketingDownload } from '@/components/marketing/download';
import { DualCta } from '@/components/marketing/dual-cta';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { MarketingHero } from '@/components/marketing/hero';
import { MarketingStats } from '@/components/marketing/stats';
import { StepList } from '@/components/marketing/step-list';
import { useT } from '@/lib/i18n/use-t';

const FEATURE_ICONS = [
  MapPin,
  Truck,
  ShoppingCart,
  MessageCircle,
  Star,
  Languages,
  Store,
  Wallet,
  Package,
];

export function HomeContent() {
  const { t } = useT();

  return (
    <>
      <MarketingHero />
      <MarketingStats />
      <StepList
        id="qanday-ishlaydi"
        title={t.home.howTitle}
        subtitle={t.home.howSubtitle}
        steps={t.home.howSteps}
      />
      <FeatureGrid
        id="imkoniyatlar"
        title={t.home.featuresTitle}
        subtitle={t.home.featuresSubtitle}
        items={t.home.features.map((f, i) => ({ ...f, icon: FEATURE_ICONS[i] }))}
      />
      <DualCta />
      <MarketingDownload />
      <MarketingContact />
    </>
  );
}

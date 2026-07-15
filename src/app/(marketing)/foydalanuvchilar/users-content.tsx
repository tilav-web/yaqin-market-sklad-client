'use client';

import { Activity, Banknote, Clock, MapPin as MapPinIcon, RotateCcw, Star } from 'lucide-react';
import { Map, MessageCircle, Languages } from 'lucide-react';

import { MarketingDownload } from '@/components/marketing/download';
import { Faq } from '@/components/marketing/faq';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { PageHero } from '@/components/marketing/page-hero';
import { StepList } from '@/components/marketing/step-list';
import { useT } from '@/lib/i18n/use-t';

const RIGHTS_ICONS = [RotateCcw, Star, Banknote, MapPinIcon, Clock, Activity];
const EXTRA_ICONS = [Map, MessageCircle, Languages];

export function UsersContent() {
  const { t } = useT();

  return (
    <>
      <PageHero badge={t.users.badge} title={t.users.title} subtitle={t.users.subtitle} />
      <StepList title={t.users.stepsTitle} steps={t.users.steps} />
      <FeatureGrid
        title={t.users.rightsTitle}
        subtitle={t.users.rightsSubtitle}
        items={t.users.rights.map((r, i) => ({ ...r, icon: RIGHTS_ICONS[i] }))}
      />
      <FeatureGrid
        title={t.users.extraTitle}
        items={t.users.extra.map((e, i) => ({ ...e, icon: EXTRA_ICONS[i] }))}
      />
      <Faq title={t.users.faqTitle} items={t.users.faq} />
      <MarketingDownload />
    </>
  );
}

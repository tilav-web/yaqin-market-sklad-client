'use client';

import { LegalPage } from '@/components/marketing/legal-page';
import { useT } from '@/lib/i18n/use-t';

export function PrivacyContent() {
  const { t } = useT();

  return (
    <LegalPage
      title={t.legal.privacyTitle}
      intro={t.legal.privacyIntro}
      sections={t.legal.privacySections}
    />
  );
}

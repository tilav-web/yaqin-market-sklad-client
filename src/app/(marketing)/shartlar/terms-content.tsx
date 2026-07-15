'use client';

import { LegalPage } from '@/components/marketing/legal-page';
import { useT } from '@/lib/i18n/use-t';

export function TermsContent() {
  const { t } = useT();

  return (
    <LegalPage
      title={t.legal.termsTitle}
      intro={t.legal.termsIntro}
      sections={t.legal.termsSections}
    />
  );
}

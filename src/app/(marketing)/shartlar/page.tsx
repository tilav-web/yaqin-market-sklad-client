import type { Metadata } from 'next';

import { TermsContent } from './terms-content';

export const metadata: Metadata = {
  title: 'Foydalanish shartlari — Yaqin Market',
  description: 'Yaqin Market ilovasi va veb-saytidan foydalanish shartlari.',
};

export default function TermsPage() {
  return <TermsContent />;
}

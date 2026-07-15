import type { Metadata } from 'next';

import { PrivacyContent } from './privacy-content';

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati — Yaqin Market',
  description: 'Yaqin Market foydalanuvchi ma’lumotlarini qanday to’plashi va himoya qilishi.',
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}

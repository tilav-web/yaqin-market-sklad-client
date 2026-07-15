import type { Metadata } from 'next';

import { SellersContent } from './sellers-content';

export const metadata: Metadata = {
  title: 'Sotuvchilar uchun — Yaqin Market',
  description:
    'Yaqin Market’da sotuvchi bo’lish yo’li, talablar va komissiya tizimi — do’koningizni qanday ochish mumkinligini bilib oling.',
};

export default function SellersPage() {
  return <SellersContent />;
}

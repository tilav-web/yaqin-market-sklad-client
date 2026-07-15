import type { Metadata } from 'next';

import { UsersContent } from './users-content';

export const metadata: Metadata = {
  title: 'Foydalanuvchilar uchun — Yaqin Market',
  description:
    'Yaqin Market’da xarid qilish qanday ishlaydi va mijoz sifatida qanday huquqlarga egasiz — barchasi shu sahifada.',
};

export default function UsersPage() {
  return <UsersContent />;
}

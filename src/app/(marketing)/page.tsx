import type { Metadata } from 'next';

import { HomeContent } from './home-content';

export const metadata: Metadata = {
  title: 'Yaqin Market — Yaqin atrofingizdagi do’konlardan tez yetkazib berish',
  description:
    'Yaqin Market — giperlokal FMCG marketpleys. Oziq-ovqat va kundalik mahsulotlarni yaqin atrofdagi do’konlardan buyurtma qiling, real vaqtda kuzating.',
};

export default function Home() {
  return <HomeContent />;
}

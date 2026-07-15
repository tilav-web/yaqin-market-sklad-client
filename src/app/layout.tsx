import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://yaqin-market.uz'),
  title: 'Yaqin Market — Admin',
  description: 'Administrator panel for Yaqin Market',
  openGraph: {
    title: 'Yaqin Market — yaqin atrofingizdagi do’konlardan tez yetkazib berish',
    description:
      'Giperlokal FMCG marketpleys — oziq-ovqat va kundalik mahsulotlarni yaqin atrofdagi do’konlardan buyurtma qiling.',
    url: 'https://yaqin-market.uz/',
    siteName: 'Yaqin Market',
    images: [{ url: '/logo-web.png', width: 923, height: 397, alt: 'Yaqin Market' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yaqin Market',
    description:
      'Giperlokal FMCG marketpleys — oziq-ovqat va kundalik mahsulotlarni yaqin atrofdagi do’konlardan buyurtma qiling.',
    images: ['/logo-web.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={`${outfit.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

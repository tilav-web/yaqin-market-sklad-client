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
  title: {
    default: 'Yaqin Market — Yaqin atrofingizdagi do’konlardan tez yetkazib berish',
    template: '%s | Yaqin Market',
  },
  description:
    'Giperlokal FMCG marketpleys — oziq-ovqat va kundalik mahsulotlarni yaqin atrofdagi do’konlardan buyurtma qiling, 15-20 daqiqada yetkazib berish.',
  keywords: [
    'Yaqin Market',
    'yetkazib berish',
    'oziq-ovqat',
    'market',
    'marketpleys',
    'Qarshi yetkazib berish',
    'onlayn do\'kon',
    'tezkor yetkazish',
    'fmcg',
  ],
  authors: [{ name: 'Yaqin Market' }],
  creator: 'Yaqin Market',
  publisher: 'Yaqin Market',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Yaqin Market — yaqin atrofingizdagi do’konlardan tez yetkazib berish',
    description:
      'Giperlokal FMCG marketpleys — oziq-ovqat va kundalik mahsulotlarni yaqin atrofdagi do’konlardan buyurtma qiling.',
    url: 'https://yaqin-market.uz/',
    siteName: 'Yaqin Market',
    images: [{ url: '/logo-web.png', width: 923, height: 397, alt: 'Yaqin Market' }],
    locale: 'uz_UZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yaqin Market',
    description:
      'Giperlokal FMCG marketpleys — oziq-ovqat va kundalik mahsulotlarni yaqin atrofdagi do’konlardan buyurtma qiling.',
    images: ['/logo-web.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://yaqin-market.uz/#organization',
      name: 'Yaqin Market',
      url: 'https://yaqin-market.uz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://yaqin-market.uz/logo-web.png',
      },
      sameAs: ['https://t.me/yaqin_market_uz', 'https://instagram.com/yaqin_market_uz'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://yaqin-market.uz/#website',
      url: 'https://yaqin-market.uz',
      name: 'Yaqin Market',
      publisher: {
        '@id': 'https://yaqin-market.uz/#organization',
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={`${outfit.variable} ${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

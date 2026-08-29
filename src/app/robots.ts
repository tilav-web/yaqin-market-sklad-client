import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yaqin-market.uz';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/product/*',
          '/category/*',
          '/sotuvchilar',
          '/foydalanuvchilar',
          '/shartlar',
          '/maxfiylik',
        ],
        disallow: ['/admin/*', '/login', '/api/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

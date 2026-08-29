import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

interface SitemapData {
  products: { slug: string; updatedAt: string }[];
  categories: { slug: string; updatedAt: string }[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yaqin-market.uz';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.yaqin-market.uz';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sotuvchilar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/foydalanuvchilar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shartlar`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/maxfiylik`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const res = await fetch(`${apiUrl}/catalog/seo/sitemap-data`, {
      cache: 'no-store',
    });
    if (!res.ok) return staticRoutes;

    const data: SitemapData = await res.json();

    const categoryRoutes: MetadataRoute.Sitemap = (data.categories || [])
      .filter((c) => c.slug)
      .map((c) => ({
        url: `${baseUrl}/category/${encodeURIComponent(c.slug)}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));

    const productRoutes: MetadataRoute.Sitemap = (data.products || [])
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${baseUrl}/product/${encodeURIComponent(p.slug)}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}

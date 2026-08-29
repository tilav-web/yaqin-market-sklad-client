import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronRight,
  Layers,
  Package,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
} from 'lucide-react';

interface LocalizedText {
  uz: string;
  kr?: string;
  ru?: string;
}

interface CategoryDetail {
  id: string;
  slug: string;
  name: LocalizedText | string;
  iconUrl: string | null;
  children: {
    id: string;
    slug: string;
    name: LocalizedText | string;
    iconUrl: string | null;
  }[];
  parent: {
    id: string;
    slug: string;
    name: LocalizedText | string;
  } | null;
}

interface CategoryProduct {
  id: string;
  slug: string;
  name: LocalizedText | string;
  brand: string | null;
  photos: string[];
  unitType: string;
  unitSize: number;
  isVerified: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yaqin-market.uz';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yaqin-market.uz';

function getStr(val: LocalizedText | string | null | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.uz || val.ru || val.kr || '';
}

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.yaqin-market.uz';
  try {
    const res = await fetch(`${apiUrl}/api/catalog/seo/sitemap-data`, { cache: 'no-store' });
    if (!res.ok) return [{ slug: 'sample' }];
    const data = await res.json();
    const params = (data.categories || [])
      .filter((c: any) => c.slug)
      .map((c: any) => ({ slug: c.slug }));
    return params.length > 0 ? params : [{ slug: 'sample' }];
  } catch {
    return [{ slug: 'sample' }];
  }
}

async function fetchCategory(slug: string): Promise<CategoryDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/categories/by-slug/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchCategoryProducts(categoryId: string): Promise<CategoryProduct[]> {
  try {
    const res = await fetch(`${API_URL}/api/admin/catalog?categoryId=${categoryId}&limit=50&activeOnly=true`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) return { title: 'Kategoriya topilmadi — Yaqin Market' };

  const name = getStr(category.name);
  const desc = `${name} bo'limidagi barcha mahsulotlar, narxlar va eng yaqin do'konlardan tezkor yetkazib berish — Yaqin Market.`;
  const canonicalUrl = `${SITE_URL}/category/${encodeURIComponent(slug)}`;

  return {
    title: `${name} — Mahsulotlar katalogi va narxlar | Yaqin Market`,
    description: desc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${name} | Yaqin Market`,
      description: desc,
      url: canonicalUrl,
      siteName: 'Yaqin Market',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Yaqin Market`,
      description: desc,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) notFound();

  const name = getStr(category.name);
  const parentName = category.parent ? getStr(category.parent.name) : null;
  const products = await fetchCategoryProducts(category.id);

  // Schema.org JSON-LD structured data for Google & Yandex
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Bosh sahifa',
            item: SITE_URL,
          },
          ...(category.parent
            ? [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: parentName,
                  item: `${SITE_URL}/category/${category.parent.slug}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name,
                  item: `${SITE_URL}/category/${category.slug}`,
                },
              ]
            : [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name,
                  item: `${SITE_URL}/category/${category.slug}`,
                },
              ]),
        ],
      },
      {
        '@type': 'CollectionPage',
        name,
        description: `${name} mahsulotlari katalogi va narxlari`,
        url: `${SITE_URL}/category/${category.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Bosh sahifa
            </Link>
            <ChevronRight className="size-3.5" />
            {category.parent ? (
              <>
                <Link
                  href={`/category/${category.parent.slug}`}
                  className="hover:text-foreground transition-colors">
                  {parentName}
                </Link>
                <ChevronRight className="size-3.5" />
              </>
            ) : null}
            <span className="font-medium text-foreground">{name}</span>
          </nav>

          {/* Header Card */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-xs sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {category.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={category.iconUrl} alt="" className="size-8 object-contain" />
                ) : (
                  <Layers className="size-7" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">{name}</h1>
                <p className="text-xs text-muted-foreground">
                  {products.length > 0 ? `${products.length} ta mahsulot mavjud` : 'Katalog mahsulotlari'}
                </p>
              </div>
            </div>

            <a
              href="/#download"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto">
              <Smartphone className="size-4" />
              Ilovada buyurtma berish
            </a>
          </div>

          {/* Subcategories (if any) */}
          {category.children && category.children.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ichki bo&apos;limlar
              </span>
              <div className="flex flex-wrap gap-2">
                {category.children.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/category/${sub.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:border-primary hover:bg-primary/5 transition-colors">
                    {sub.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sub.iconUrl} alt="" className="size-4 object-contain" />
                    ) : null}
                    {getStr(sub.name)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Katalogdagi mahsulotlar</h2>
            {products.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
                Bu bo&apos;limda hozircha mahsulotlar mavjud emas.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {products.map((p) => {
                  const pName = getStr(p.name);
                  const photo = p.photos?.[0] || null;
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug || p.id}`}
                      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-3 shadow-2xs hover:border-primary hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/20 p-2 flex items-center justify-center">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo.startsWith('http') ? photo : `${API_URL}${photo}`}
                              alt={pName}
                              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <Package className="size-10 text-muted-foreground/30" />
                          )}
                          {p.isVerified && (
                            <span className="absolute top-1.5 left-1.5 rounded-md bg-emerald-500/15 p-1 text-emerald-600 backdrop-blur-xs">
                              <ShieldCheck className="size-3" />
                            </span>
                          )}
                        </div>

                        {p.brand && (
                          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary truncate block">
                            {p.brand}
                          </span>
                        )}
                        <h3 className="line-clamp-2 text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {pName}
                        </h3>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[0.7rem] text-muted-foreground">
                        <span>
                          {p.unitSize} {p.unitType}
                        </span>
                        <span className="font-semibold text-primary group-hover:underline">Batafsil →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

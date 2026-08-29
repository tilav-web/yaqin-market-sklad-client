import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Package,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  Tag,
  Truck,
} from 'lucide-react';

interface LocalizedText {
  uz: string;
  kr?: string;
  ru?: string;
}

interface ProductDetail {
  id: string;
  slug: string;
  name: LocalizedText | string;
  brand: string | null;
  barcode: string | null;
  unitType: string;
  unitSize: number;
  photos: string[];
  description: LocalizedText | string | null;
  isVerified: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  availableOffersCount: number;
  category: { id: string; slug: string; name: LocalizedText | string } | null;
  offers: {
    variantId: string;
    shopId: string;
    shopName: string;
    shopAddress: string;
    price: number;
    discountPrice: number | null;
    stock: number;
  }[];
  siblings: {
    id: string;
    slug: string;
    name: LocalizedText | string;
    unitSize: number;
    unitType: string;
  }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yaqin-market.uz';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yaqin-market.uz';

function getStr(val: LocalizedText | string | null | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.uz || val.ru || val.kr || '';
}

function fmt(n: number): string {
  return n.toLocaleString('uz-UZ');
}

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.yaqin-market.uz';
  try {
    const res = await fetch(`${apiUrl}/catalog/seo/sitemap-data`, { cache: 'no-store' });
    if (!res.ok) return [{ slug: 'sample' }];
    const data = await res.json();
    const params = (data.products || [])
      .filter((p: any) => p.slug)
      .map((p: any) => ({ slug: p.slug }));
    return params.length > 0 ? params : [{ slug: 'sample' }];
  } catch {
    return [{ slug: 'sample' }];
  }
}

async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/catalog/global-products/by-slug/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: 'Mahsulot topilmadi — Yaqin Market' };

  const name = getStr(product.name);
  const desc =
    getStr(product.description) ||
    `${name} — Yaqin Market orqali eng yaqin do'konlardan tez yetkazib berish bilan buyurtma qiling.`;
  const image = product.photos[0] || `${SITE_URL}/logo-web.png`;
  const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(slug)}`;

  return {
    title: `${name} — Narxlari va yetkazib berish | Yaqin Market`,
    description: desc.slice(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${name} | Yaqin Market`,
      description: desc.slice(0, 200),
      url: canonicalUrl,
      siteName: 'Yaqin Market',
      images: [
        {
          url: image.startsWith('http') ? image : `${API_URL}${image}`,
          width: 800,
          height: 800,
          alt: name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Yaqin Market`,
      description: desc.slice(0, 200),
      images: [image.startsWith('http') ? image : `${API_URL}${image}`],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) notFound();

  const name = getStr(product.name);
  const desc = getStr(product.description);
  const catName = product.category ? getStr(product.category.name) : null;
  const mainPhoto = product.photos[0] || null;

  // Schema.org JSON-LD structured data for Google & Yandex
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name,
    image: product.photos.map((p) => (p.startsWith('http') ? p : `${API_URL}${p}`)),
    description: desc || `${name} — eng yaqin do'konlardan tez yetkazib berish bilan`,
    sku: product.id,
    ...(product.barcode ? { gtin: product.barcode } : {}),
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(product.minPrice !== null
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'UZS',
            lowPrice: product.minPrice,
            highPrice: product.maxPrice || product.minPrice,
            offerCount: product.availableOffersCount,
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Bosh sahifa
            </Link>
            <ChevronRight className="size-3.5" />
            {product.category ? (
              <>
                <Link
                  href={`/category/${product.category.slug}`}
                  className="hover:text-foreground transition-colors">
                  {catName}
                </Link>
                <ChevronRight className="size-3.5" />
              </>
            ) : null}
            <span className="truncate font-medium text-foreground max-w-[200px] sm:max-w-xs">{name}</span>
          </nav>

          {/* Main Product Card */}
          <div className="grid gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-12 md:p-8">
            {/* Gallery Column */}
            <div className="space-y-4 md:col-span-5">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
                {mainPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mainPhoto.startsWith('http') ? mainPhoto : `${API_URL}${mainPhoto}`}
                    alt={name}
                    className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <Package className="size-20 text-muted-foreground/40" />
                )}
                {product.isVerified && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur-md">
                    <ShieldCheck className="size-3.5" /> Tasdiqlangan
                  </span>
                )}
              </div>

              {product.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.startsWith('http') ? p : `${API_URL}${p}`}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="flex flex-col justify-between space-y-6 md:col-span-7">
              <div className="space-y-3">
                {product.brand && (
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">{product.brand}</p>
                )}
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">{name}</h1>

                {/* Price & Stock info */}
                <div className="flex flex-wrap items-baseline gap-3 pt-2">
                  {product.minPrice !== null ? (
                    <div className="text-2xl font-black text-foreground">
                      {product.minPrice === product.maxPrice
                        ? `${fmt(product.minPrice)} so'm`
                        : `${fmt(product.minPrice)} — ${fmt(product.maxPrice!)} so'm`}
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-muted-foreground">
                      Narx yaqin do&apos;konlarda belgilanadi
                    </div>
                  )}

                  {product.inStock ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
                      <CheckCircle2 className="size-3.5" /> Do&apos;konlarda mavjud
                    </span>
                  ) : null}
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 pt-4 text-xs">
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                    <span className="text-muted-foreground block text-[0.7rem]">O&apos;lchov / Birlik</span>
                    <span className="font-semibold text-foreground">
                      {product.unitSize} {product.unitType}
                    </span>
                  </div>
                  {product.barcode && (
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                      <span className="text-muted-foreground block text-[0.7rem]">Barkod</span>
                      <span className="font-mono font-semibold text-foreground">{product.barcode}</span>
                    </div>
                  )}
                </div>

                {/* Sibling variants */}
                {product.siblings.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-semibold text-muted-foreground">Boshqa o&apos;lchamlar:</span>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg border-2 border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                        {product.unitSize} {product.unitType}
                      </span>
                      {product.siblings.map((s) => (
                        <Link
                          key={s.id}
                          href={`/product/${s.slug}`}
                          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors">
                          {s.unitSize} {s.unitType}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {desc && (
                  <div className="space-y-1 pt-2">
                    <span className="text-xs font-semibold text-muted-foreground">Tavsif</span>
                    <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">{desc}</p>
                  </div>
                )}
              </div>

              {/* Order in App CTA */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Smartphone className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Yaqin do&apos;kondan buyurtma qilish</h3>
                    <p className="text-[0.7rem] text-muted-foreground">
                      Ilovada xaritadagi eng yaqin do&apos;konlarni tanlang va 15-20 daqiqada yetkazib oling.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="#download"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                    <Truck className="size-3.5" />
                    Ilovada xarid qilish
                  </a>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors">
                    Bosh sahifaga qaytish
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

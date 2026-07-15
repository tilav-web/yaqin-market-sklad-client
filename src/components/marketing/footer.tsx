'use client';

import { Mail, MessageCircle, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { useT } from '@/lib/i18n/use-t';

export function MarketingFooter() {
  const { t } = useT();

  return (
    <footer className="border-t border-zinc-200/40 bg-zinc-50/50">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-web.png"
                alt="Yaqin Market"
                width={923}
                height={397}
                className="h-8 w-auto"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500">{t.footer.tagline}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t.footer.linksTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="/" className="transition-colors duration-200 hover:text-primary">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/foydalanuvchilar" className="transition-colors duration-200 hover:text-primary">
                  {t.nav.users}
                </Link>
              </li>
              <li>
                <Link href="/sotuvchilar" className="transition-colors duration-200 hover:text-primary">
                  {t.nav.sellers}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t.footer.contactTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary" /> +998 XX XXX XX XX
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-primary" /> info@yaqin-market.uz
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="size-4 text-primary" /> @yaqinmarket
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-8 text-xs text-zinc-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Yaqin Market. {t.footer.rights}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/shartlar" className="transition-colors duration-200 hover:text-primary">
              {t.footer.terms}
            </Link>
            <Link href="/maxfiylik" className="transition-colors duration-200 hover:text-primary">
              {t.footer.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

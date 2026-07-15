'use client';

import { Mail, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';

import { useT } from '@/lib/i18n/use-t';

export function MarketingFooter() {
  const { t } = useT();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 text-lg font-extrabold text-primary-foreground shadow-sm">
                Y
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                Yaqin Market
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t.footer.tagline}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">{t.footer.linksTitle}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-primary">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/foydalanuvchilar" className="transition-colors hover:text-primary">
                  {t.nav.users}
                </Link>
              </li>
              <li>
                <Link href="/sotuvchilar" className="transition-colors hover:text-primary">
                  {t.nav.sellers}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">{t.footer.contactTitle}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-primary" /> +998 XX XXX XX XX
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-primary" /> info@yaqin-market.uz
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="size-4 text-primary" /> @yaqinmarket
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} Yaqin Market. {t.footer.rights}
          </p>
          <div className="flex items-center gap-5">
            <Link href="/shartlar" className="transition-colors hover:text-primary">
              {t.footer.terms}
            </Link>
            <Link href="/maxfiylik" className="transition-colors hover:text-primary">
              {t.footer.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

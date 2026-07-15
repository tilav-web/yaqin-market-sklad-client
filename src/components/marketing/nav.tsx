'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/use-t';
import { LANG_LABELS, type MarketingLang } from '@/lib/i18n/dictionary';
import { cn } from '@/lib/cn';

const LANGS: MarketingLang[] = ['uz', 'uzc', 'ru'];

function LangSwitch({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useT();
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-card p-0.5',
        compact && 'w-full justify-between',
      )}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-bold transition-colors',
            compact && 'flex-1',
            lang === l
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}>
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

export function MarketingNav() {
  const { t } = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/foydalanuvchilar', label: t.nav.users },
    { href: '/sotuvchilar', label: t.nav.sellers },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 text-lg font-extrabold text-primary-foreground shadow-sm">
            Y
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">Yaqin Market</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LangSwitch />
          <Link href="/#yuklab-olish">
            <Button size="sm">{t.nav.download}</Button>
          </Link>
        </div>

        <button
          type="button"
          aria-label="Menyu"
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-lg text-foreground md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <LangSwitch compact />
            <Link href="/#yuklab-olish" onClick={() => setOpen(false)}>
              <Button className="w-full">{t.nav.download}</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

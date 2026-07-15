'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
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
        'inline-flex items-center rounded-full border border-zinc-200/80 bg-zinc-50/50 p-0.5',
        compact && 'w-full justify-between',
      )}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            'rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase transition-all duration-200',
            compact && 'flex-1',
            lang === l
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50'
              : 'text-zinc-400 hover:text-zinc-800',
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
    <header className="sticky top-0 z-50 border-b border-zinc-200/30 bg-white/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <Image
            src="/logo-web.png"
            alt="Yaqin Market"
            width={923}
            height={397}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200',
                pathname === link.href
                  ? 'text-emerald-600 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900',
              )}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <LangSwitch />
          <Link href="/#yuklab-olish">
            <Button size="sm" className="rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white hover:bg-zinc-800">
              {t.nav.download}
            </Button>
          </Link>
        </div>

        <button
          type="button"
          aria-label="Menyu"
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-full hover:bg-zinc-50 text-zinc-700 md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-zinc-100 bg-white px-5 py-5 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200',
                  pathname === link.href
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                )}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-4">
            <LangSwitch compact />
            <Link href="/#yuklab-olish" onClick={() => setOpen(false)}>
              <Button className="w-full rounded-xl bg-zinc-950 font-semibold text-white hover:bg-zinc-800">
                {t.nav.download}
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

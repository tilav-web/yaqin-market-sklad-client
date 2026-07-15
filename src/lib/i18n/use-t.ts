'use client';

import { useEffect } from 'react';

import { useLangStore } from '@/stores/lang';

import { dictionary, type MarketingDict, type MarketingLang } from './dictionary';

const HTML_LANG: Record<MarketingLang, string> = {
  uz: 'uz-Latn',
  uzc: 'uz-Cyrl',
  ru: 'ru',
};

/** Marketing-only i18n: returns the active dictionary + setter, and keeps
 * `<html lang>` in sync. Admin/login pages don't use this — they stay
 * Uzbek-only per project convention. */
export function useT(): { t: MarketingDict; lang: MarketingLang; setLang: (l: MarketingLang) => void } {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  return { t: dictionary[lang], lang, setLang };
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MarketingLang = 'uz' | 'uzc' | 'ru';

interface LangStore {
  lang: MarketingLang;
  setLang: (lang: MarketingLang) => void;
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'uz',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'ym-marketing-lang' },
  ),
);

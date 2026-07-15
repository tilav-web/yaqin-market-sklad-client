import { Sparkles } from 'lucide-react';

/** Compact premium hero banner for sub-pages (users/sellers) */
export function PageHero({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200/50 bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur-sm">
          <Sparkles className="size-3.5 text-emerald-600" />
          {badge}
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-500 sm:text-lg">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

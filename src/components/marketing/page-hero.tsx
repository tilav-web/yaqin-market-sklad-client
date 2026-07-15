import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

/** Compact hero banner for sub-pages (users/sellers) — same gradient
 * language as the home hero, smaller footprint. */
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
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="animate-gradient-shift pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--color-primary)_18%,transparent),color-mix(in_oklch,orange_14%,transparent),color-mix(in_oklch,var(--color-primary)_10%,transparent))]"
      />
      <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-20">
        <Badge variant="primary" className="mb-5">
          <Zap />
          {badge}
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

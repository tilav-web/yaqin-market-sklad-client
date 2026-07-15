import { cn } from '@/lib/cn';

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto max-w-2xl',
        align === 'center' ? 'text-center' : 'max-w-none text-left',
        className,
      )}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

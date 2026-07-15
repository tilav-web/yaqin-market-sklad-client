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
        <p className="mb-2 text-sm font-bold tracking-wide text-primary uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="mt-4 text-pretty text-lg text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

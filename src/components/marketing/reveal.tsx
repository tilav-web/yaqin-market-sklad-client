'use client';

import { cn } from '@/lib/cn';
import { useReveal } from '@/lib/use-reveal';

/** Scroll-reveal wrapper — fades+slides children in once visible. Use
 * `delay` (ms) to stagger siblings (e.g. grid items). */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn('reveal', visible && 'reveal-in', className)}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}>
      {children}
    </div>
  );
}

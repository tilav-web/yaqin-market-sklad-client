import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link href="/admin/dashboard" className="hover:text-primary transition-colors">
              Admin
            </Link>
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-primary transition-colors">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : eyebrow ? (
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatPill({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </div>
        )}
      </div>
      <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[0.7rem] text-muted-foreground font-medium">{sub}</p>}
    </div>
  );
}

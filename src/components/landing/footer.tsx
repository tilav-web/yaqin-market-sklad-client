import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
            Y
          </div>
          <span>© 2026 Yaqin Market</span>
        </div>
        <Link href="/login" className="font-medium transition-colors hover:text-primary">
          Admin panel
        </Link>
      </div>
    </footer>
  );
}

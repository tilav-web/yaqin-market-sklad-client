import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNav } from '@/components/marketing/nav';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-primary/20">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

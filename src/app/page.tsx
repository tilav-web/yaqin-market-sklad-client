'use client';

import { LandingContact } from '@/components/landing/contact';
import { LandingDownload } from '@/components/landing/download';
import { LandingFeatures } from '@/components/landing/features';
import { LandingFooter } from '@/components/landing/footer';
import { LandingHero } from '@/components/landing/hero';
import { LandingNav } from '@/components/landing/nav';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingDownload />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useT } from '@/lib/i18n/use-t';
import { api, API_URL } from '@/lib/api';

type AppRelease = {
  id: string;
  version: string;
  notes?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
  downloadUrl?: string | null;
};

function formatSizeMb(sizeBytes?: number | null): string | null {
  if (!sizeBytes || sizeBytes <= 0) return null;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MarketingDownload() {
  const { t } = useT();
  const { data, isLoading } = useQuery<AppRelease | null>({
    queryKey: ['app-releases', 'latest'],
    queryFn: async () => {
      const res = await api.get<AppRelease | null>('/app-releases/latest');
      return res.data ?? null;
    },
  });

  const hasRelease = Boolean(data?.version);
  const sizeMb = formatSizeMb(data?.sizeBytes);

  return (
    <section id="yuklab-olish" className="bg-zinc-50/40 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Card className="overflow-hidden border border-zinc-200/80 bg-white p-8 sm:p-12 rounded-3xl shadow-sm">
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
              <Smartphone className="size-9" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {t.download.title}
              </h2>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-500">{t.download.desc}</p>

              <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row md:items-start">
                {hasRelease ? (
                  <a href={`${API_URL}/api/app-releases/latest/download`} download>
                    <Button
                      size="lg"
                      className="h-12 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                      <Download className="size-4" />
                      {t.download.ctaReady}
                    </Button>
                  </a>
                ) : (
                  <Button size="lg" disabled className="h-12 rounded-full px-8 text-sm font-semibold">
                    <Download className="size-4" />
                    {t.download.ctaSoon}
                  </Button>
                )}

                {hasRelease ? (
                  <div className="text-sm text-zinc-500">
                    <p className="font-semibold text-zinc-900">
                      {t.download.version} {data?.version}
                    </p>
                    {sizeMb ? <p className="text-xs text-zinc-400 mt-0.5">{sizeMb}</p> : null}
                  </div>
                ) : null}
              </div>

              {!hasRelease && !isLoading ? (
                <p className="mt-4 text-xs text-zinc-400">{t.download.soonNote}</p>
              ) : null}

              {hasRelease && data?.notes ? (
                <p className="mt-4 text-xs text-zinc-400">{data.notes}</p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

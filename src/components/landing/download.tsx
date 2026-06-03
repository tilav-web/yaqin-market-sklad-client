'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

export function LandingDownload() {
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
    <section id="yuklab-olish" className="bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Card className="overflow-hidden p-8 sm:p-12">
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-sm">
              <Smartphone className="size-9" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Yaqin Market ilovasini yuklab oling
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Android qurilmangizga APK faylni o&apos;rnating va yaqin atrofdagi do&apos;konlardan
                xarid qilishni boshlang.
              </p>

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row md:items-start">
                {hasRelease ? (
                  <a href={`${API_URL}/api/app-releases/latest/download`} download>
                    <Button size="lg" className="h-12 px-8 text-base">
                      <Download className="size-5" />
                      APK yuklab olish
                    </Button>
                  </a>
                ) : (
                  <Button size="lg" disabled className="h-12 px-8 text-base">
                    <Download className="size-5" />
                    Tez kunda
                  </Button>
                )}

                {hasRelease ? (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Versiya {data?.version}</p>
                    {sizeMb ? <p>{sizeMb}</p> : null}
                  </div>
                ) : null}
              </div>

              {!hasRelease && !isLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Ilova hozircha tayyorlanmoqda — tez orada yuklab olish mumkin bo&apos;ladi.
                </p>
              ) : null}

              {hasRelease && data?.notes ? (
                <p className="mt-4 text-sm text-muted-foreground">{data.notes}</p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

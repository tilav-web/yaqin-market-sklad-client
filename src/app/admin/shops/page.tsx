'use client';

import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

interface ShopRow {
  id: string;
  name: string;
  address: string;
  isOpenManual: boolean;
  ratingAverage: number;
  ratingCount: number;
  minOrderPrice: number;
}

export default function ShopsAdminPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoords({ lat: 38.8446827, lng: 65.7803532 }),
    );
  }, []);

  const shopsQuery = useQuery({
    queryKey: ['admin', 'shops', coords?.lat, coords?.lng],
    queryFn: async () => {
      if (!coords) return [];
      const res = await api.get<ShopRow[]>('/shops/nearby', { params: { lat: coords.lat, lng: coords.lng } });
      return res.data;
    },
    enabled: !!coords,
  });

  const shops = shopsQuery.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Tarmoq"
        title="Do'konlar"
        description={`${shops.length} ta do'kon platformaning xizmatida.`}
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Nomi</th>
              <th className="px-5 py-3 font-semibold">Manzili</th>
              <th className="px-5 py-3 font-semibold">Reyting</th>
              <th className="px-5 py-3 font-semibold">Min. buyurtma</th>
              <th className="px-5 py-3 font-semibold">Holat</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-5 py-3 font-semibold text-foreground">{s.name}</td>
                <td className="max-w-xs truncate px-5 py-3 text-muted-foreground">{s.address}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {s.ratingAverage.toFixed(1)}
                    <span className="text-muted-foreground">({s.ratingCount})</span>
                  </span>
                </td>
                <td className="px-5 py-3 text-foreground">{s.minOrderPrice.toLocaleString()} so&apos;m</td>
                <td className="px-5 py-3">
                  <Badge variant={s.isOpenManual ? 'success' : 'danger'}>
                    {s.isOpenManual ? 'Ochiq' : 'Yopiq'}
                  </Badge>
                </td>
              </tr>
            ))}
            {!shopsQuery.isLoading && shops.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Hozircha do&apos;kon yo&apos;q
                </td>
              </tr>
            ) : null}
            {shopsQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Yuklanmoqda…
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

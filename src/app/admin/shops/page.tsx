'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

interface ShopRow {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  latitude: number;
  longitude: number;
  isOpenManual: boolean;
  ratingAverage: number;
  ratingCount: number;
  minOrderPrice: number;
  isActive: boolean;
  createdAt: string;
}

export default function ShopsAdminPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoords({ lat: 41.3, lng: 69.27 }),
    );
  }, []);

  const shopsQuery = useQuery({
    queryKey: ['admin', 'shops', coords?.lat, coords?.lng],
    queryFn: async () => {
      if (!coords) return [];
      const res = await api.get<ShopRow[]>('/shops/nearby', {
        params: { lat: coords.lat, lng: coords.lng },
      });
      return res.data;
    },
    enabled: !!coords,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#0046AD] mb-1">Do&apos;konlar</h1>
      <p className="text-slate-600 text-sm mb-4">
        {shopsQuery.data?.length ?? 0} ta do&apos;kon platformaning xizmatida
      </p>

      <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-2 font-semibold">Nomi</th>
              <th className="px-4 py-2 font-semibold">Manzili</th>
              <th className="px-4 py-2 font-semibold">Reyting</th>
              <th className="px-4 py-2 font-semibold">Min</th>
              <th className="px-4 py-2 font-semibold">Holat</th>
            </tr>
          </thead>
          <tbody>
            {shopsQuery.data?.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2 text-slate-600">{s.address}</td>
                <td className="px-4 py-2">⭐ {s.ratingAverage.toFixed(1)} ({s.ratingCount})</td>
                <td className="px-4 py-2">{s.minOrderPrice.toLocaleString()} so&apos;m</td>
                <td className="px-4 py-2">
                  {s.isOpenManual ? (
                    <span className="text-green-600 font-semibold">Ochiq</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Yopiq</span>
                  )}
                </td>
              </tr>
            ))}
            {(!shopsQuery.data || shopsQuery.data.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  Hozircha do&apos;kon yo&apos;q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

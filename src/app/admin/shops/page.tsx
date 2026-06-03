'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Power, PowerOff, Search, Star } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface ShopOwner {
  id: string;
  name: string | null;
  phone: string;
}

interface AdminShop {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  isOpenManual: boolean;
  ratingAverage: number;
  ratingCount: number;
  owner: ShopOwner | null;
  createdAt: string;
}

export default function ShopsAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');

  const shopsQuery = useQuery({
    queryKey: ['admin', 'shops', submitted],
    queryFn: async () => {
      const res = await api.get<AdminShop[]>('/admin/shops', {
        params: submitted ? { search: submitted } : undefined,
      });
      return res.data;
    },
  });

  const setActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/admin/shops/${id}/active`, { isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'shops'] }),
    onError: (e) => alert(extractErrorMessage(e)),
  });

  const shops = shopsQuery.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Tarmoq"
        title="Do'konlar"
        description="Platformadagi barcha do'konlar — qidirish va moderatsiya."
      />

      <form
        className="flex max-w-md items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(search.trim());
        }}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Do'kon nomi yoki manzili…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Qidirish
        </Button>
      </form>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Nomi</th>
              <th className="px-5 py-3 font-semibold">Egasi</th>
              <th className="px-5 py-3 font-semibold">Reyting</th>
              <th className="px-5 py-3 font-semibold">Holat</th>
              <th className="px-5 py-3 text-right font-semibold">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-5 py-3">
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="max-w-xs truncate text-xs text-muted-foreground">{s.address}</p>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {s.owner ? (
                    <>
                      <p className="text-foreground">{s.owner.name || '—'}</p>
                      <p className="text-xs">{s.owner.phone}</p>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {s.ratingAverage.toFixed(1)}
                    <span className="text-muted-foreground">({s.ratingCount})</span>
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={s.isActive ? 'success' : 'danger'}>
                      {s.isActive ? 'Faol' : "O'chirilgan"}
                    </Badge>
                    {s.isActive ? (
                      <Badge variant={s.isOpenManual ? 'neutral' : 'warning'}>
                        {s.isOpenManual ? 'Ochiq' : 'Yopiq'}
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <Button
                      variant={s.isActive ? 'ghost' : 'outline'}
                      size="sm"
                      disabled={setActive.isPending}
                      onClick={() => {
                        const deactivating = s.isActive;
                        if (
                          confirm(
                            `"${s.name}" do'konini ${deactivating ? "o'chirasizmi (mijozlarga ko'rinmaydi)" : 'faollashtirasizmi'}?`,
                          )
                        )
                          setActive.mutate({ id: s.id, isActive: !deactivating });
                      }}>
                      {s.isActive ? (
                        <PowerOff className="size-4 text-destructive" />
                      ) : (
                        <Power className="size-4 text-success" />
                      )}
                      {s.isActive ? "O'chirish" : 'Faollashtirish'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {shopsQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Yuklanmoqda…
                </td>
              </tr>
            ) : null}
            {shopsQuery.isError ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-destructive">
                  {extractErrorMessage(shopsQuery.error)} —{' '}
                  <button className="underline" onClick={() => shopsQuery.refetch()}>
                    qayta urinish
                  </button>
                </td>
              </tr>
            ) : null}
            {!shopsQuery.isLoading && !shopsQuery.isError && shops.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Do&apos;kon topilmadi
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

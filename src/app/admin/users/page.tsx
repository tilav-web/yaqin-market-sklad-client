'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck, ShieldOff, UserX, UserCheck } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface AdminUser {
  id: string;
  phone: string;
  name: string | null;
  status: 'active' | 'blocked';
  isSellerApproved: boolean;
  isAdmin: boolean;
  createdAt: string;
}

interface UsersPage {
  items: AdminUser[];
  total: number;
}

const PAGE_SIZE = 20;

export default function UsersAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(0);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', submitted, page],
    queryFn: async () => {
      const res = await api.get<UsersPage>('/admin/users', {
        params: { search: submitted || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      });
      return res.data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      await api.patch(`/admin/users/${id}/status`, { blocked });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
    onError: (e) => alert(extractErrorMessage(e)),
  });

  const setAdmin = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      await api.patch(`/admin/users/${id}/admin`, { isAdmin });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
    onError: (e) => alert(extractErrorMessage(e)),
  });

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Hisoblar"
        title="Foydalanuvchilar"
        description="Foydalanuvchilarni qidirish, bloklash va admin huquqlarini boshqarish."
      />

      <form
        className="flex max-w-md items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setSubmitted(search.trim());
        }}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon raqami…"
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
              <th className="px-5 py-3 font-semibold">Foydalanuvchi</th>
              <th className="px-5 py-3 font-semibold">Telefon</th>
              <th className="px-5 py-3 font-semibold">Rollar</th>
              <th className="px-5 py-3 font-semibold">Holat</th>
              <th className="px-5 py-3 text-right font-semibold">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-5 py-3 font-semibold text-foreground">{u.name || '—'}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.phone}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.isAdmin ? <Badge variant="warning">Admin</Badge> : null}
                    {u.isSellerApproved ? <Badge variant="neutral">Sotuvchi</Badge> : null}
                    {!u.isAdmin && !u.isSellerApproved ? (
                      <span className="text-xs text-muted-foreground">Mijoz</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                    {u.status === 'active' ? 'Faol' : 'Bloklangan'}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={setAdmin.isPending}
                      onClick={() => {
                        if (confirm(`${u.name || u.phone} uchun admin huquqini ${u.isAdmin ? 'olib tashlaysizmi' : 'beriladimi'}?`))
                          setAdmin.mutate({ id: u.id, isAdmin: !u.isAdmin });
                      }}>
                      {u.isAdmin ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
                      {u.isAdmin ? 'Admindan olish' : 'Admin qilish'}
                    </Button>
                    <Button
                      variant={u.status === 'active' ? 'ghost' : 'outline'}
                      size="sm"
                      disabled={setStatus.isPending}
                      onClick={() => {
                        const blocking = u.status === 'active';
                        if (confirm(`${u.name || u.phone} ni ${blocking ? 'bloklaysizmi' : 'blokdan chiqarasizmi'}?`))
                          setStatus.mutate({ id: u.id, blocked: blocking });
                      }}>
                      {u.status === 'active' ? (
                        <UserX className="size-4 text-destructive" />
                      ) : (
                        <UserCheck className="size-4 text-success" />
                      )}
                      {u.status === 'active' ? 'Bloklash' : 'Chiqarish'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {usersQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Yuklanmoqda…
                </td>
              </tr>
            ) : null}
            {usersQuery.isError ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-destructive">
                  {extractErrorMessage(usersQuery.error)} —{' '}
                  <button className="underline" onClick={() => usersQuery.refetch()}>
                    qayta urinish
                  </button>
                </td>
              </tr>
            ) : null}
            {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Foydalanuvchi topilmadi
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </div>
  );
}

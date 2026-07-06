'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Phone, ShieldCheck, Store, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
interface UsersPage { items: AdminUser[]; total: number }

function UserDetailInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const phone = searchParams.get('phone') ?? '';

  // There is no GET /admin/users/:id endpoint on the backend (only the
  // paginated list at GET /admin/users). Since phone numbers are unique,
  // resolve this user via the existing search param — same approach as the
  // seller lookup on the balance page — rather than adding a fake one.
  const userQuery = useQuery<UsersPage>({
    queryKey: ['admin', 'users', 'detail', phone],
    queryFn: async () => (await api.get('/admin/users', { params: { search: phone, limit: 5 } })).data,
    enabled: !!phone,
  });

  const user = userQuery.data?.items.find((u) => u.id === id) ?? userQuery.data?.items[0];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Hisoblar"
        title="Foydalanuvchi tafsilotlari"
        description={phone || undefined}
        actions={
          <Link href="/admin/users" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ArrowLeft className="size-4" /> Ro&apos;yxatga qaytish
          </Link>
        }
      />

      {!id || !phone ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Foydalanuvchi aniqlanmadi — <Link href="/admin/users" className="underline">ro&apos;yxatdan</Link> qayta oching.
        </Card>
      ) : userQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Yuklanmoqda…</Card>
      ) : userQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">
          {extractErrorMessage(userQuery.error)} —{' '}
          <button className="underline" onClick={() => userQuery.refetch()}>qayta urinish</button>
        </Card>
      ) : !user ? (
        <Card className="p-6 text-sm text-muted-foreground">Foydalanuvchi topilmadi.</Card>
      ) : (
        <>
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <UserIcon className="size-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-foreground">{user.name || '—'}</p>
                  <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                    {user.status === 'active' ? 'Faol' : 'Bloklangan'}
                  </Badge>
                  {user.isAdmin && <Badge variant="warning">Admin</Badge>}
                  {user.isSellerApproved && <Badge variant="neutral">Sotuvchi</Badge>}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-3.5" /> {user.phone}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ro&apos;yxatdan o&apos;tgan: {new Date(user.createdAt).toLocaleString('uz-UZ')}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{user.id}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-primary" />
              <h2 className="text-sm font-semibold">Buyurtmalar tarixi</h2>
            </div>
            <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Backend API hozircha yo&apos;q</p>
              <p className="mt-1">
                Bu foydalanuvchining buyurtmalar tarixini ko&apos;rsatish uchun serverda userId bo&apos;yicha
                filtrlaydigan endpoint kerak (masalan <code className="rounded bg-muted px-1">GET /admin/orders?userId=</code>).
                Hozirgi <code className="rounded bg-muted px-1">orders</code> modulida faqat joriy foydalanuvchi
                uchun <code className="rounded bg-muted px-1">GET orders/mine</code> va <code className="rounded bg-muted px-1">GET orders/:id</code> bor —
                boshqa foydalanuvchining buyurtmalarini admin nomidan olib bo&apos;lmaydi.
              </p>
            </div>
          </Card>

          {user.isSellerApproved && (
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Store className="size-5 text-primary" />
                <h2 className="text-sm font-semibold">Sotuvchi</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Bu foydalanuvchi tasdiqlangan sotuvchi. Balans va tranzaksiyalarni{' '}
                <Link href="/admin/balance" className="inline-flex items-center gap-1 text-primary underline">
                  <ShieldCheck className="size-3.5" /> Balanslar
                </Link>{' '}
                sahifasida (ism/telefon orqali qidirib) ko&apos;ring.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function UserDetailPage() {
  return (
    <Suspense>
      <UserDetailInner />
    </Suspense>
  );
}

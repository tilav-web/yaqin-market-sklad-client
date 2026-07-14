'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Package, Pencil, Phone, ShieldCheck, Store, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface SellerProfile {
  fullName: string | null;
  passportOrPinfl: string | null;
  stir: string | null;
  entityType: string | null;
  bankCardNumber: string | null;
  bankCardHolderName: string | null;
  contractNumber: string | null;
  contractDate: string | null;
  verifiedAt: string | null;
  adminNotes: string | null;
}

interface ProfileForm {
  fullName: string;
  passportOrPinfl: string;
  stir: string;
  entityType: string;
  bankCardNumber: string;
  bankCardHolderName: string;
  contractNumber: string;
  contractDate: string;
  adminNotes: string;
}

const PROFILE_FIELDS: { k: keyof ProfileForm; label: string }[] = [
  { k: 'fullName', label: 'To\'liq ism (FIO)' },
  { k: 'passportOrPinfl', label: 'Pasport / PINFL' },
  { k: 'stir', label: 'STIR / INN' },
  { k: 'entityType', label: 'Yuridik shakl' },
  { k: 'bankCardNumber', label: 'Karta raqami' },
  { k: 'bankCardHolderName', label: 'Karta egasi' },
  { k: 'contractNumber', label: 'Shartnoma raqami' },
  { k: 'contractDate', label: 'Shartnoma sanasi' },
];

function formFromProfile(p: SellerProfile | null): ProfileForm {
  return {
    fullName: p?.fullName ?? '',
    passportOrPinfl: p?.passportOrPinfl ?? '',
    stir: p?.stir ?? '',
    entityType: p?.entityType ?? '',
    bankCardNumber: p?.bankCardNumber ?? '',
    bankCardHolderName: p?.bankCardHolderName ?? '',
    contractNumber: p?.contractNumber ?? '',
    contractDate: p?.contractDate ?? '',
    adminNotes: p?.adminNotes ?? '',
  };
}

function SellerProfilePanel({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(formFromProfile(null));
  const [err, setErr] = useState('');

  const profileQ = useQuery<SellerProfile | null>({
    queryKey: ['admin', 'seller-profile', userId],
    queryFn: async () => (await api.get(`/sellers/admin/profiles/${userId}`)).data,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = {};
      (Object.keys(form) as (keyof ProfileForm)[]).forEach((k) => {
        if (form[k]) body[k] = form[k];
      });
      await api.put(`/sellers/admin/profiles/${userId}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'seller-profile', userId] });
      setEditing(false);
      setErr('');
    },
    onError: (e) => setErr(extractErrorMessage(e)),
  });

  const startEdit = () => {
    setForm(formFromProfile(profileQ.data ?? null));
    setErr('');
    setEditing(true);
  };

  const p = profileQ.data;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Store className="size-5 text-primary" />
          <h2 className="text-sm font-semibold">Sotuvchi profili</h2>
          {p?.verifiedAt && (
            <Badge variant="success">
              <BadgeCheck className="size-3" /> Tasdiqlangan
            </Badge>
          )}
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            <Pencil className="size-4" /> Tahrirlash
          </Button>
        )}
      </div>

      {profileQ.isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Yuklanmoqda…</p>
      ) : profileQ.isError ? (
        <p className="mt-3 text-sm text-destructive">
          {extractErrorMessage(profileQ.error)} —{' '}
          <button className="underline" onClick={() => profileQ.refetch()}>qayta urinish</button>
        </p>
      ) : editing ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {PROFILE_FIELDS.map(({ k, label }) => (
              <div key={k}>
                <label className="mb-0.5 block text-xs font-medium text-muted-foreground">{label}</label>
                <Input
                  type={k === 'contractDate' ? 'date' : 'text'}
                  value={form[k]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-muted-foreground">Admin izohi (ichki)</label>
            <textarea
              rows={2}
              value={form.adminNotes}
              onChange={(e) => setForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setErr(''); }}>
              Bekor qilish
            </Button>
            <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
            </Button>
          </div>
        </div>
      ) : !p || !p.fullName ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Profil ma&apos;lumotlari hali to&apos;ldirilmagan. &quot;Tahrirlash&quot; orqali qo&apos;shing.
        </p>
      ) : (
        <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">FIO:</span> {p.fullName || '—'}</p>
          <p><span className="text-muted-foreground">Pasport/PINFL:</span> {p.passportOrPinfl || '—'}</p>
          <p><span className="text-muted-foreground">STIR:</span> {p.stir || '—'}</p>
          <p><span className="text-muted-foreground">Yuridik shakl:</span> {p.entityType || '—'}</p>
          <p><span className="text-muted-foreground">Karta:</span> {p.bankCardNumber || '—'}</p>
          <p><span className="text-muted-foreground">Karta egasi:</span> {p.bankCardHolderName || '—'}</p>
          <p><span className="text-muted-foreground">Shartnoma №:</span> {p.contractNumber || '—'}</p>
          <p><span className="text-muted-foreground">Shartnoma sanasi:</span> {p.contractDate || '—'}</p>
          {p.adminNotes && (
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Admin izohi:</span> {p.adminNotes}
            </p>
          )}
        </div>
      )}

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Balans va tranzaksiyalarni{' '}
        <Link href="/admin/balance" className="inline-flex items-center gap-1 text-primary underline">
          <ShieldCheck className="size-3.5" /> Balanslar
        </Link>{' '}
        sahifasida (ism/telefon orqali qidirib) ko&apos;ring.
      </p>
    </Card>
  );
}

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

type OrderStatus = 'new' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

interface AdminOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  returnedQuantity: number;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: 'delivery' | 'in_store';
  total: number;
  createdAt: string;
  shop: { id: string; name: string } | null;
  items: AdminOrderItem[];
}

interface OrdersPage { items: AdminOrder[]; total: number }

const ORDERS_PAGE_SIZE = 10;

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Yangi',
  accepted: 'Qabul qilingan',
  preparing: 'Tayyorlanmoqda',
  delivering: 'Yetkazilmoqda',
  delivered: 'Yetkazib berilgan',
  cancelled: 'Bekor qilingan',
};

const ORDER_STATUS_VARIANT: Record<OrderStatus, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
  new: 'neutral',
  accepted: 'primary',
  preparing: 'warning',
  delivering: 'warning',
  delivered: 'success',
  cancelled: 'danger',
};

const money = (n: number) => n.toLocaleString('uz-UZ') + " so'm";

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

  const [ordersPage, setOrdersPage] = useState(0);

  // Distinct from the ['admin', 'users', 'detail', phone] key above — that one
  // resolves *this* user's profile via search, this one paginates their order
  // history via a different endpoint, so they must not collide.
  const ordersQuery = useQuery<OrdersPage>({
    queryKey: ['admin', 'users', 'orders', id, ordersPage],
    queryFn: async () =>
      (
        await api.get(`/admin/users/${id}/orders`, {
          params: { limit: ORDERS_PAGE_SIZE, offset: ordersPage * ORDERS_PAGE_SIZE },
        })
      ).data,
    enabled: !!id,
  });
  const orders = ordersQuery.data?.items ?? [];
  const ordersTotal = ordersQuery.data?.total ?? 0;

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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="size-5 text-primary" />
                <h2 className="text-sm font-semibold">Buyurtmalar tarixi</h2>
              </div>
              {ordersTotal > 0 && (
                <span className="text-xs text-muted-foreground">{ordersTotal} ta buyurtma</span>
              )}
            </div>

            {ordersQuery.isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Yuklanmoqda…</p>
            ) : ordersQuery.isError ? (
              <p className="mt-3 text-sm text-destructive">
                {extractErrorMessage(ordersQuery.error)} —{' '}
                <button className="underline" onClick={() => ordersQuery.refetch()}>qayta urinish</button>
              </p>
            ) : orders.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Bu foydalanuvchida buyurtmalar yo&apos;q.</p>
            ) : (
              <>
                <div className="mt-3 space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground">#{o.orderNumber}</span>
                          <Badge variant={ORDER_STATUS_VARIANT[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                          {o.channel === 'in_store' && <Badge variant="neutral">Do&apos;konda</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleString('uz-UZ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {o.shop?.name ?? "Do'kon o'chirilgan"}
                      </p>
                      <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-xs text-muted-foreground">
                        {o.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between gap-2">
                            <span className="truncate">
                              {it.productName} × {it.quantity}
                              {it.returnedQuantity > 0 ? ` (${it.returnedQuantity} qaytarilgan)` : ''}
                            </span>
                            <span className="shrink-0">{money(it.lineTotal)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-end border-t border-border pt-2">
                        <span className="text-sm font-bold text-foreground">{money(o.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <Pagination page={ordersPage} pageSize={ORDERS_PAGE_SIZE} total={ordersTotal} onPage={setOrdersPage} />
                </div>
              </>
            )}
          </Card>

          {user.isSellerApproved && <SellerProfilePanel userId={user.id} />}
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

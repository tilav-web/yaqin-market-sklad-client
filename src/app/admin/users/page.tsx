'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, ExternalLink, Search, Send, ShieldCheck, ShieldOff, UserCheck, UserX, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useReducer, useState } from 'react';

import { NotifComposeForm } from '@/components/admin/notif-compose-form';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { stripHtml } from '@/lib/notif-utils';
import { useAdminNotifStore } from '@/stores/admin-notif';

/* ─── Types ─── */
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
interface Template { id: string; name: string; title: string; body: string; richBody?: string; imageUrl?: string }

type RoleFilter = 'all' | 'customers' | 'sellers' | 'admins';

const PAGE_SIZE = 20;

/* ─── Reducer ─── */
interface UsersState {
  search: string;
  submitted: string;
  page: number;
  roleFilter: RoleFilter;
  selectedIds: Set<string>;
  selectAllMode: boolean;
  showNotifModal: boolean;
}

type UsersAction =
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SUBMIT_SEARCH' }
  | { type: 'SET_PAGE'; value: number }
  | { type: 'SET_ROLE'; value: RoleFilter }
  | { type: 'TOGGLE_USER'; id: string }
  | { type: 'TOGGLE_PAGE_ALL'; ids: string[] }
  | { type: 'SELECT_ALL_MODE' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'OPEN_MODAL' }
  | { type: 'CLOSE_MODAL' };

const USERS_INIT: UsersState = {
  search: '', submitted: '', page: 0,
  roleFilter: 'all', selectedIds: new Set(), selectAllMode: false, showNotifModal: false,
};

function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.value };
    case 'SUBMIT_SEARCH':
      return { ...state, submitted: state.search.trim(), page: 0 };
    case 'SET_PAGE':
      return { ...state, page: action.value };
    case 'SET_ROLE':
      return { ...state, roleFilter: action.value, page: 0, selectedIds: new Set(), selectAllMode: false };
    case 'TOGGLE_USER': {
      const next = new Set(state.selectedIds);
      next.has(action.id) ? next.delete(action.id) : next.add(action.id);
      return { ...state, selectedIds: next };
    }
    case 'TOGGLE_PAGE_ALL': {
      const allSelected = action.ids.every((id) => state.selectedIds.has(id));
      const next = new Set(state.selectedIds);
      action.ids.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return { ...state, selectedIds: next, selectAllMode: false };
    }
    case 'SELECT_ALL_MODE':
      return { ...state, selectAllMode: true };
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set(), selectAllMode: false };
    case 'OPEN_MODAL':
      return { ...state, showNotifModal: true };
    case 'CLOSE_MODAL':
      return { ...state, showNotifModal: false };
    default:
      return state;
  }
}

const ROLE_TO_AUDIENCE: Partial<Record<RoleFilter, 'all' | 'sellers' | 'customers'>> = {
  all: 'all', sellers: 'sellers', customers: 'customers',
};

/* ─── Quick-send modal ─── */
function SendNotifModal({
  mode, userIds, audience, userCount, onClose,
}: {
  mode: 'specific' | 'audience';
  userIds?: string[];
  audience?: 'all' | 'sellers' | 'customers';
  userCount: number;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [richBody, setRichBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imgLoading, setImgLoading] = useState(false);
  const [deepLink, setDeepLink] = useState('/notifications');
  const [selectedTplId, setSelectedTplId] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const templatesQuery = useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: async () => (await api.get<Template[]>('/admin/notifications/templates')).data,
  });
  const templates = templatesQuery.data ?? [];

  const send = useMutation({
    mutationFn: async () => {
      const plainBody = stripHtml(richBody).slice(0, 512) || title;
      const payload: Record<string, unknown> = {
        title: title.trim(), body: plainBody, richBody: richBody || undefined,
        ...(imageUrl ? { imageUrl } : {}),
        ...(deepLink && deepLink !== '/notifications' ? { deepLink } : {}),
      };
      if (mode === 'audience') payload.audience = audience;
      else { payload.audience = 'specific'; payload.userIds = userIds; }
      await api.post('/admin/notifications/send', payload);
    },
    onSuccess: () => setResult({ ok: true, msg: `${userCount} ta foydalanuvchiga yuborildi ✓` }),
    onError: (e) => setResult({ ok: false, msg: extractErrorMessage(e) }),
  });

  const applyTemplate = (t: Template) => {
    setSelectedTplId(t.id); setTitle(t.title);
    setRichBody(t.richBody ?? t.body); setImageUrl(t.imageUrl ?? '');
  };

  const recipientLabel = mode === 'audience'
    ? audience === 'sellers' ? 'Barcha sotuvchilarga'
    : audience === 'customers' ? 'Barcha mijozlarga'
    : 'Hammaga'
    : `${userCount} ta foydalanuvchiga`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-semibold">Bildirishnoma yuborish</p>
            <p className="text-xs text-muted-foreground mt-0.5">{recipientLabel}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <NotifComposeForm
            title={title}
            onTitleChange={setTitle}
            richBody={richBody}
            onRichBodyChange={setRichBody}
            imageUrl={imageUrl}
            onImageUrlChange={setImageUrl}
            imgLoading={imgLoading}
            onImgLoadingChange={setImgLoading}
            deepLink={deepLink}
            onDeepLinkChange={setDeepLink}
            templates={templates}
            selectedTplId={selectedTplId}
            onApplyTemplate={applyTemplate}
          />

          {result && (
            <p className={`rounded-lg px-3 py-2 text-sm font-medium border ${result.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-destructive border-red-200'}`}>
              {result.msg}
            </p>
          )}
        </div>

        <div className="border-t border-border px-5 py-4 flex gap-2">
          {result?.ok
            ? <Button className="flex-1" onClick={onClose}>Yopish</Button>
            : (
              <>
                <Button variant="outline" onClick={onClose} className="flex-1">Bekor</Button>
                <Button className="flex-1" disabled={!title.trim() || !richBody || imgLoading || send.isPending}
                  onClick={() => send.mutate()}>
                  <Send className="size-4" />
                  {send.isPending ? 'Yuborilmoqda…' : recipientLabel}
                </Button>
              </>
            )
          }
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function UsersAdminPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const setNotifTarget = useAdminNotifStore((s) => s.setTarget);
  const [state, dispatch] = useReducer(usersReducer, USERS_INIT);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', state.submitted, state.roleFilter, state.page],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: state.page * PAGE_SIZE };
      if (state.submitted) params.search = state.submitted;
      if (state.roleFilter === 'sellers') params.sellerOnly = 'true';
      if (state.roleFilter === 'customers') params.customerOnly = 'true';
      if (state.roleFilter === 'admins') params.adminOnly = 'true';
      return (await api.get<UsersPage>('/admin/users', { params })).data;
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
  const pageIds = users.map((u) => u.id);
  const pageAllSelected = users.length > 0 && pageIds.every((id) => state.selectedIds.has(id));
  const canSelectAllMode = state.roleFilter !== 'admins';
  const showSelectAllBanner = pageAllSelected && total > PAGE_SIZE && !state.selectAllMode && canSelectAllMode;
  const selectionCount = state.selectAllMode ? total : state.selectedIds.size;
  const hasSelection = state.selectedIds.size > 0 || state.selectAllMode;

  const openFullEditor = () => {
    const audience: 'all' | 'sellers' | 'customers' | 'specific' = state.selectAllMode
      ? (ROLE_TO_AUDIENCE[state.roleFilter] ?? 'all')
      : 'specific';
    setNotifTarget(audience, [...state.selectedIds], state.selectAllMode);
    router.push('/admin/notifications');
  };

  const roleFilterBtns: { key: RoleFilter; label: string }[] = [
    { key: 'all', label: 'Barchasi' },
    { key: 'customers', label: 'Mijozlar' },
    { key: 'sellers', label: 'Sotuvchilar' },
    { key: 'admins', label: 'Adminlar' },
  ];

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        eyebrow="Hisoblar"
        title="Foydalanuvchilar"
        description="Foydalanuvchilarni boshqarish va bildirishnoma yuborish."
      />

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'SUBMIT_SEARCH' }); }}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={state.search}
              onChange={(e) => dispatch({ type: 'SET_SEARCH', value: e.target.value })}
              placeholder="Ism yoki telefon…" className="pl-9 w-64" />
          </div>
          <Button type="submit" variant="outline">Qidirish</Button>
        </form>

        <div className="flex rounded-lg border border-border overflow-hidden">
          {roleFilterBtns.map((b) => (
            <button key={b.key} type="button"
              onClick={() => dispatch({ type: 'SET_ROLE', value: b.key })}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-r last:border-r-0 border-border
                ${state.roleFilter === b.key ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selection action bar */}
      {hasSelection && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="text-sm font-semibold text-primary">
              {state.selectAllMode ? `Barcha ${total} ta tanlandi` : `${state.selectedIds.size} ta tanlangan`}
            </span>
            <Button size="sm" onClick={() => dispatch({ type: 'OPEN_MODAL' })}>
              <Bell className="size-3.5" /> Tez yuborish
            </Button>
            <Button size="sm" variant="outline" onClick={openFullEditor}>
              <ExternalLink className="size-3.5" /> Batafsil tuzish
            </Button>
            <button onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
              className="ml-auto text-sm text-muted-foreground hover:text-foreground">
              Bekor
            </button>
          </div>

          {showSelectAllBanner && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
              <span>Faqat bu sahifadagi {state.selectedIds.size} ta tanlandi.</span>
              <button className="font-semibold underline hover:no-underline"
                onClick={() => dispatch({ type: 'SELECT_ALL_MODE' })}>
                Barcha {total} ta{state.roleFilter !== 'all' ? ` ${state.roleFilter === 'sellers' ? 'sotuvchi' : 'mijoz'}` : ' foydalanuvchi'}ni tanlash
              </button>
            </div>
          )}
        </div>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-11 px-4 py-3">
                <input type="checkbox" checked={pageAllSelected}
                  onChange={() => dispatch({ type: 'TOGGLE_PAGE_ALL', ids: pageIds })}
                  className="rounded border-border cursor-pointer" />
              </th>
              <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
              <th className="px-4 py-3 font-semibold">Telefon</th>
              <th className="px-4 py-3 font-semibold">Rollar</th>
              <th className="px-4 py-3 font-semibold">Holat</th>
              <th className="px-4 py-3 text-right font-semibold">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {usersQuery.isLoading ? (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda…</td></tr>
            ) : usersQuery.isError ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-destructive">
                  {extractErrorMessage(usersQuery.error)} —{' '}
                  <button className="underline" onClick={() => usersQuery.refetch()}>qayta urinish</button>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Foydalanuvchi topilmadi</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}
                className={`border-b border-border last:border-0 transition-colors cursor-pointer
                  ${state.selectedIds.has(u.id) ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
                onClick={() => dispatch({ type: 'TOGGLE_USER', id: u.id })}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={state.selectedIds.has(u.id)}
                    onChange={() => dispatch({ type: 'TOGGLE_USER', id: u.id })}
                    className="rounded border-border cursor-pointer" />
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">{u.name || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.isAdmin ? <Badge variant="warning">Admin</Badge> : null}
                    {u.isSellerApproved ? <Badge variant="neutral">Sotuvchi</Badge> : null}
                    {!u.isAdmin && !u.isSellerApproved ? <span className="text-xs text-muted-foreground">Mijoz</span> : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                    {u.status === 'active' ? 'Faol' : 'Bloklangan'}
                  </Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" size="sm" disabled={setAdmin.isPending}
                      onClick={() => {
                        if (confirm(`${u.name || u.phone} uchun admin huquqini ${u.isAdmin ? 'olib tashlaysizmi' : 'beriladimi'}?`))
                          setAdmin.mutate({ id: u.id, isAdmin: !u.isAdmin });
                      }}>
                      {u.isAdmin ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
                      {u.isAdmin ? 'Admindan olish' : 'Admin qilish'}
                    </Button>
                    <Button variant={u.status === 'active' ? 'ghost' : 'outline'} size="sm" disabled={setStatus.isPending}
                      onClick={() => {
                        const blocking = u.status === 'active';
                        if (confirm(`${u.name || u.phone} ni ${blocking ? 'bloklaysizmi' : 'blokdan chiqarasizmi'}?`))
                          setStatus.mutate({ id: u.id, blocked: blocking });
                      }}>
                      {u.status === 'active' ? <UserX className="size-4 text-destructive" /> : <UserCheck className="size-4 text-success" />}
                      {u.status === 'active' ? 'Bloklash' : 'Chiqarish'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Pagination page={state.page} pageSize={PAGE_SIZE} total={total}
        onPage={(p) => dispatch({ type: 'SET_PAGE', value: p })} />

      {state.showNotifModal && (
        <SendNotifModal
          mode={state.selectAllMode ? 'audience' : 'specific'}
          audience={state.selectAllMode ? (ROLE_TO_AUDIENCE[state.roleFilter] ?? 'all') : undefined}
          userIds={state.selectAllMode ? undefined : [...state.selectedIds]}
          userCount={selectionCount}
          onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        />
      )}
    </div>
  );
}

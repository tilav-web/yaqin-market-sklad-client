'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, ChevronDown, ChevronUp, Edit2, Plus, Search, Send, Trash2, Users, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { NotifAudience, useAdminNotifStore } from '@/stores/admin-notif';

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then((m) => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="min-h-[160px] animate-pulse rounded-lg border border-border bg-muted/30" /> },
);

/* ─── Types ─── */
interface Template { id: string; name: string; title: string; body: string; richBody?: string; imageUrl?: string }
interface AdminUser { id: string; phone: string; name: string | null; isSellerApproved: boolean; isAdmin: boolean }
interface UsersPage { items: AdminUser[]; total: number }

const PAGE_SIZE = 15;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
async function uploadImageFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  return (await api.post<{ url: string }>('/uploads/image', form)).data.url;
}

/* ─── Audience reducer ─── */
interface AudienceState {
  audience: NotifAudience;
  userSearch: string;
  submittedSearch: string;
  roleFilter: '' | 'seller' | 'customer';
  userPage: number;
  selectedIds: Set<string>;
}
type AudienceAction =
  | { type: 'SET_AUDIENCE'; value: NotifAudience }
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SUBMIT_SEARCH'; value: string }
  | { type: 'SET_ROLE'; value: '' | 'seller' | 'customer' }
  | { type: 'SET_PAGE'; value: number }
  | { type: 'TOGGLE_USER'; id: string }
  | { type: 'TOGGLE_PAGE_ALL'; ids: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'PRESET'; audience: NotifAudience; ids: string[] };

const AUDIENCE_INIT: AudienceState = {
  audience: 'all', userSearch: '', submittedSearch: '', roleFilter: '', userPage: 0, selectedIds: new Set(),
};

function audienceReducer(state: AudienceState, action: AudienceAction): AudienceState {
  switch (action.type) {
    case 'SET_AUDIENCE':
      return { ...state, audience: action.value, selectedIds: new Set() };
    case 'SET_SEARCH':
      return { ...state, userSearch: action.value };
    case 'SUBMIT_SEARCH':
      return { ...state, submittedSearch: action.value, userPage: 0 };
    case 'SET_ROLE':
      return { ...state, roleFilter: action.value, userPage: 0 };
    case 'SET_PAGE':
      return { ...state, userPage: action.value };
    case 'TOGGLE_USER': {
      const next = new Set(state.selectedIds);
      next.has(action.id) ? next.delete(action.id) : next.add(action.id);
      return { ...state, selectedIds: next };
    }
    case 'TOGGLE_PAGE_ALL': {
      const allSelected = action.ids.every((id) => state.selectedIds.has(id));
      const next = new Set(state.selectedIds);
      action.ids.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return { ...state, selectedIds: next };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set() };
    case 'PRESET':
      return { ...state, audience: action.audience, selectedIds: new Set(action.ids) };
    default:
      return state;
  }
}

/* ─── Template manager reducer ─── */
interface TplState {
  showManager: boolean;
  showNew: boolean;
  newName: string;
  newTitle: string;
  newRichBody: string;
  newImageUrl: string;
  newImgLoading: boolean;
}
type TplAction =
  | { type: 'TOGGLE_MANAGER' }
  | { type: 'TOGGLE_NEW' }
  | { type: 'SET_NEW'; field: 'newName' | 'newTitle' | 'newRichBody' | 'newImageUrl'; value: string }
  | { type: 'SET_NEW_IMG_LOADING'; value: boolean }
  | { type: 'CLOSE_NEW' };

const TPL_INIT: TplState = {
  showManager: false, showNew: false,
  newName: '', newTitle: '', newRichBody: '', newImageUrl: '', newImgLoading: false,
};

function tplReducer(state: TplState, action: TplAction): TplState {
  switch (action.type) {
    case 'TOGGLE_MANAGER': return { ...state, showManager: !state.showManager, showNew: false };
    case 'TOGGLE_NEW': return { ...state, showNew: !state.showNew, showManager: false };
    case 'SET_NEW': return { ...state, [action.field]: action.value };
    case 'SET_NEW_IMG_LOADING': return { ...state, newImgLoading: action.value };
    case 'CLOSE_NEW': return { ...state, showNew: false, newName: '', newTitle: '', newRichBody: '', newImageUrl: '' };
    default: return state;
  }
}

/* ─── ImgPreview ─── */
function ImgPreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${API_URL}${url}`} alt="" className="h-12 w-12 rounded object-cover border border-border" />
      <span className="text-xs font-medium text-green-600">Yuklandi ✓</span>
      <button type="button" onClick={onRemove} className="ml-auto text-xs text-destructive">O'chirish</button>
    </div>
  );
}

/* ─── TemplateManager ─── */
function TemplateManager({
  templates, onRefresh, onSelect, selectedId,
}: {
  templates: Template[];
  onRefresh: () => void;
  onSelect: (t: Template) => void;
  selectedId: string | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ name: '', title: '', richBody: '', imageUrl: '' });
  const [editImgLoading, setEditImgLoading] = useState(false);

  const updateTpl = useMutation({
    mutationFn: async (id: string) => {
      const body = stripHtml(editFields.richBody).slice(0, 512) || editFields.title;
      await api.patch(`/admin/notifications/templates/${id}`, {
        name: editFields.name.trim(), title: editFields.title.trim(), body,
        richBody: editFields.richBody || undefined, imageUrl: editFields.imageUrl || undefined,
      });
    },
    onSuccess: () => { onRefresh(); setEditingId(null); },
  });

  const deleteTpl = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/notifications/templates/${id}`); },
    onSuccess: () => { onRefresh(); setExpandedId(null); setEditingId(null); },
  });

  if (templates.length === 0)
    return <p className="text-sm text-muted-foreground py-2">Shablon yo'q.</p>;

  return (
    <div className="space-y-1.5">
      {templates.map((t) => {
        const isExp = expandedId === t.id;
        const isEd = editingId === t.id;
        return (
          <div key={t.id} className={`rounded-lg border overflow-hidden transition-colors ${selectedId === t.id ? 'border-primary' : 'border-border'}`}>
            <button className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
              onClick={() => { setExpandedId(isExp ? null : t.id); if (isEd) setEditingId(null); }}>
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.title}</p>
              </div>
              {isExp ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
            </button>

            {isExp && !isEd && (
              <div className="border-t border-border px-3 py-3 space-y-2 bg-muted/10 text-sm">
                <p className="font-semibold">{t.title}</p>
                {t.richBody
                  ? <div className="prose prose-sm max-w-none [&_h1]:text-base [&_h1]:font-bold [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-primary [&_img]:rounded [&_img]:max-h-32"
                      dangerouslySetInnerHTML={{ __html: t.richBody }} />
                  : <p className="text-muted-foreground">{t.body}</p>}
                {t.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${API_URL}${t.imageUrl}`} alt="" className="h-20 rounded object-cover border border-border" />
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" onClick={() => { onSelect(t); setExpandedId(null); }}><Send className="size-3.5" /> Tanlash</Button>
                  <Button size="sm" variant="outline"
                    onClick={() => { setEditingId(t.id); setEditFields({ name: t.name, title: t.title, richBody: t.richBody ?? t.body, imageUrl: t.imageUrl ?? '' }); }}>
                    <Edit2 className="size-3.5" /> Tahrirlash
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"
                    disabled={deleteTpl.isPending}
                    onClick={() => { if (confirm(`"${t.name}" o'chirilsinmi?`)) deleteTpl.mutate(t.id); }}>
                    <Trash2 className="size-3.5" /> O'chirish
                  </Button>
                </div>
              </div>
            )}

            {isExp && isEd && (
              <div className="border-t border-border px-3 py-3 space-y-2 bg-muted/10">
                <Input value={editFields.name} onChange={(e) => setEditFields((p) => ({ ...p, name: e.target.value }))} placeholder="Shablon nomi" />
                <Input value={editFields.title} onChange={(e) => setEditFields((p) => ({ ...p, title: e.target.value }))} placeholder="Sarlavha" />
                <RichTextEditor value={editFields.richBody} onChange={(v) => setEditFields((p) => ({ ...p, richBody: v }))} />
                <div>
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setEditImgLoading(true);
                      try { const u = await uploadImageFile(f); setEditFields((p) => ({ ...p, imageUrl: u })); }
                      finally { setEditImgLoading(false); }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground" />
                  {editImgLoading && <p className="mt-1 text-xs text-muted-foreground">Yuklanmoqda…</p>}
                  {editFields.imageUrl && !editImgLoading && <ImgPreview url={editFields.imageUrl} onRemove={() => setEditFields((p) => ({ ...p, imageUrl: '' }))} />}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!editFields.name.trim() || !editFields.title.trim() || editImgLoading || updateTpl.isPending} onClick={() => updateTpl.mutate(t.id)}>Saqlash</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Bekor</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ─── */
function NotificationsInner() {
  const qc = useQueryClient();

  /* Zustand draft — persists across navigation */
  const draft = useAdminNotifStore();
  const { patchDraft, resetDraft, clearTarget } = draft;

  /* Audience reducer */
  const [aud, audDispatch] = useReducer(audienceReducer, AUDIENCE_INIT);

  /* Template manager reducer */
  const [tpl, tplDispatch] = useReducer(tplReducer, TPL_INIT);

  /* Local-only state */
  const [imgLoading, setImgLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const composeRef = useRef<HTMLDivElement>(null);

  /* Pre-fill audience from users page (Zustand target) */
  useEffect(() => {
    if (draft.userIds.length > 0 || draft.selectAll) {
      audDispatch({
        type: 'PRESET',
        audience: draft.audience,
        ids: draft.userIds,
      });
      clearTarget();
    }
  // only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Queries */
  const templatesQuery = useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: async () => (await api.get<Template[]>('/admin/notifications/templates')).data,
  });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', aud.submittedSearch, aud.roleFilter, aud.userPage],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: aud.userPage * PAGE_SIZE };
      if (aud.submittedSearch) params.search = aud.submittedSearch;
      if (aud.roleFilter === 'seller') params.sellerOnly = 'true';
      if (aud.roleFilter === 'customer') params.customerOnly = 'true';
      return (await api.get<UsersPage>('/admin/users', { params })).data;
    },
    enabled: aud.audience === 'specific',
  });

  const templates = templatesQuery.data ?? [];
  const users = usersQuery.data?.items ?? [];
  const userTotal = usersQuery.data?.total ?? 0;

  /* Mutations */
  const send = useMutation({
    mutationFn: async () => {
      const plainBody = stripHtml(draft.richBody).slice(0, 512) || draft.title;
      const payload: Record<string, unknown> = {
        title: draft.title.trim(), body: plainBody, richBody: draft.richBody || undefined, audience: aud.audience,
        ...(draft.imageUrl ? { imageUrl: draft.imageUrl } : {}),
        ...(draft.deepLink && draft.deepLink !== '/notifications' ? { deepLink: draft.deepLink } : {}),
      };
      if (aud.audience === 'specific') payload.userIds = [...aud.selectedIds];
      return (await api.post<{ registered: number; pushedTokens: number }>('/admin/notifications/send', payload)).data;
    },
    onSuccess: (r) => {
      setResult({ ok: true, msg: `Yuborildi — ${r.registered} foydalanuvchi, ${r.pushedTokens} qurilma` });
      resetDraft();
      audDispatch({ type: 'SET_AUDIENCE', value: 'all' });
    },
    onError: (e) => setResult({ ok: false, msg: extractErrorMessage(e) }),
  });

  const createTpl = useMutation({
    mutationFn: async () => {
      const body = stripHtml(tpl.newRichBody).slice(0, 512) || tpl.newTitle;
      await api.post('/admin/notifications/templates', {
        name: tpl.newName.trim(), title: tpl.newTitle.trim(), body,
        richBody: tpl.newRichBody || undefined, imageUrl: tpl.newImageUrl || undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'templates'] }); tplDispatch({ type: 'CLOSE_NEW' }); },
  });

  const applyTemplate = useCallback((t: Template) => {
    patchDraft({ selectedTplId: t.id, title: t.title, richBody: t.richBody ?? t.body, imageUrl: t.imageUrl ?? '' });
    composeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [patchDraft]);

  const pageIds = users.map((u) => u.id);
  const pageAllSelected = users.length > 0 && pageIds.every((id) => aud.selectedIds.has(id));

  const recipientLabel = aud.audience === 'all' ? 'Hammaga'
    : aud.audience === 'sellers' ? 'Barcha sotuvchilarga'
    : aud.audience === 'customers' ? 'Barcha mijozlarga'
    : aud.selectedIds.size === 0 ? 'Foydalanuvchi tanlanmagan'
    : `${aud.selectedIds.size} ta foydalanuvchiga`;

  const canSend = draft.title.trim() && draft.richBody && !imgLoading &&
    (aud.audience !== 'specific' || aud.selectedIds.size > 0);

  const audienceBtns: { key: NotifAudience; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'Hammaga' },
    { key: 'sellers', label: 'Sotuvchilar' },
    { key: 'customers', label: 'Mijozlar' },
    { key: 'specific', label: 'Tanlash', icon: <Users className="size-3.5" /> },
  ];

  return (
    <div className="space-y-5 p-6 max-w-4xl">
      <PageHeader title="Bildirishnomalar" description="Push xabar yuborish" />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* ── Left ── */}
        <div className="space-y-4">

          {/* Audience */}
          <Card className="p-4 space-y-3">
            <p className="text-sm font-semibold">Kimga?</p>
            <div className="flex flex-wrap gap-2">
              {audienceBtns.map((b) => (
                <button key={b.key} type="button"
                  onClick={() => audDispatch({ type: 'SET_AUDIENCE', value: b.key })}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors
                    ${aud.audience === b.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background hover:bg-muted'}`}>
                  {b.icon}{b.label}
                </button>
              ))}
            </div>

            {aud.audience === 'specific' && (
              <div className="space-y-2 pt-1">
                <form className="flex gap-2"
                  onSubmit={(e) => { e.preventDefault(); audDispatch({ type: 'SUBMIT_SEARCH', value: aud.userSearch.trim() }); }}>
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={aud.userSearch}
                      onChange={(e) => audDispatch({ type: 'SET_SEARCH', value: e.target.value })}
                      placeholder="Ism yoki telefon…" className="pl-8 h-8 text-sm" />
                  </div>
                  <select value={aud.roleFilter}
                    onChange={(e) => audDispatch({ type: 'SET_ROLE', value: e.target.value as '' | 'seller' | 'customer' })}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm">
                    <option value="">Barchasi</option>
                    <option value="seller">Sotuvchilar</option>
                    <option value="customer">Mijozlar</option>
                  </select>
                  <Button type="submit" size="sm" variant="outline">Qidirish</Button>
                </form>

                {aud.selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-1.5 text-xs">
                    <span className="font-semibold text-primary">{aud.selectedIds.size} ta tanlangan</span>
                    <button onClick={() => audDispatch({ type: 'CLEAR_SELECTION' })} className="ml-auto text-muted-foreground hover:text-foreground">
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}

                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        <th className="w-9 px-3 py-2">
                          <input type="checkbox" checked={pageAllSelected}
                            onChange={() => audDispatch({ type: 'TOGGLE_PAGE_ALL', ids: pageIds })}
                            className="rounded border-border" />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Ism</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Telefon</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersQuery.isLoading ? (
                        <tr><td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">Yuklanmoqda…</td></tr>
                      ) : users.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">Topilmadi</td></tr>
                      ) : users.map((u) => (
                        <tr key={u.id}
                          className={`border-b border-border last:border-0 cursor-pointer transition-colors
                            ${aud.selectedIds.has(u.id) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                          onClick={() => audDispatch({ type: 'TOGGLE_USER', id: u.id })}>
                          <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={aud.selectedIds.has(u.id)}
                              onChange={() => audDispatch({ type: 'TOGGLE_USER', id: u.id })}
                              className="rounded border-border" />
                          </td>
                          <td className="px-3 py-2.5 font-medium">{u.name || '—'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground text-xs">{u.phone}</td>
                          <td className="px-3 py-2.5">
                            {u.isAdmin ? <Badge variant="warning">Admin</Badge>
                              : u.isSellerApproved ? <Badge variant="neutral">Sotuvchi</Badge>
                              : <span className="text-xs text-muted-foreground">Mijoz</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={aud.userPage} pageSize={PAGE_SIZE} total={userTotal}
                  onPage={(p) => audDispatch({ type: 'SET_PAGE', value: p })} />
              </div>
            )}
          </Card>

          {/* Templates */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Shablonlar</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => tplDispatch({ type: 'TOGGLE_NEW' })}>
                  <Plus className="size-3.5" /> Yangi
                </Button>
                <Button size="sm" variant="ghost" onClick={() => tplDispatch({ type: 'TOGGLE_MANAGER' })}>
                  {tpl.showManager ? 'Yopish' : 'Boshqarish'}
                </Button>
              </div>
            </div>

            {!tpl.showManager && !tpl.showNew && (
              <div className="flex flex-wrap gap-2">
                {templates.length === 0
                  ? <p className="text-xs text-muted-foreground">Shablon yo'q</p>
                  : templates.map((t) => (
                    <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap
                        ${draft.selectedTplId === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background hover:bg-muted'}`}>
                      <Bell className="size-3" />{t.name}
                    </button>
                  ))}
              </div>
            )}

            {tpl.showNew && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Yangi shablon</p>
                <Input value={tpl.newName} onChange={(e) => tplDispatch({ type: 'SET_NEW', field: 'newName', value: e.target.value })} placeholder="Shablon nomi" />
                <Input value={tpl.newTitle} onChange={(e) => tplDispatch({ type: 'SET_NEW', field: 'newTitle', value: e.target.value })} placeholder="Sarlavha" />
                <RichTextEditor value={tpl.newRichBody} onChange={(v) => tplDispatch({ type: 'SET_NEW', field: 'newRichBody', value: v })} />
                <div>
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      tplDispatch({ type: 'SET_NEW_IMG_LOADING', value: true });
                      try { const u = await uploadImageFile(f); tplDispatch({ type: 'SET_NEW', field: 'newImageUrl', value: u }); }
                      finally { tplDispatch({ type: 'SET_NEW_IMG_LOADING', value: false }); }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground" />
                  {tpl.newImgLoading && <p className="mt-1 text-xs text-muted-foreground">Yuklanmoqda…</p>}
                  {tpl.newImageUrl && !tpl.newImgLoading && <ImgPreview url={tpl.newImageUrl} onRemove={() => tplDispatch({ type: 'SET_NEW', field: 'newImageUrl', value: '' })} />}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!tpl.newName.trim() || !tpl.newTitle.trim() || !tpl.newRichBody || tpl.newImgLoading || createTpl.isPending} onClick={() => createTpl.mutate()}>Saqlash</Button>
                  <Button size="sm" variant="outline" onClick={() => tplDispatch({ type: 'CLOSE_NEW' })}>Bekor</Button>
                </div>
              </div>
            )}

            {tpl.showManager && (
              <TemplateManager
                templates={templates}
                onRefresh={() => qc.invalidateQueries({ queryKey: ['admin', 'templates'] })}
                onSelect={(t) => { applyTemplate(t); tplDispatch({ type: 'TOGGLE_MANAGER' }); }}
                selectedId={draft.selectedTplId}
              />
            )}
          </Card>
        </div>

        {/* ── Right: Compose (Zustand draft) ── */}
        <div ref={composeRef}>
          <Card className="p-4 space-y-4 sticky top-6">
            <p className="text-sm font-semibold">Xabar matni</p>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Sarlavha</label>
              <Input value={draft.title} onChange={(e) => patchDraft({ title: e.target.value })}
                placeholder="Aksiya boshlandi!" maxLength={128} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Matn</label>
              <RichTextEditor value={draft.richBody} onChange={(v) => patchDraft({ richBody: v })} />
              {draft.richBody && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  <span className="font-medium">Preview:</span> {stripHtml(draft.richBody).slice(0, 80)}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Rasm (ixtiyoriy)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setImgLoading(true); patchDraft({ imageUrl: '' });
                  try { patchDraft({ imageUrl: await uploadImageFile(f) }); } catch { /* ignore */ }
                  finally { setImgLoading(false); }
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground" />
              {imgLoading && <p className="mt-1 text-xs text-muted-foreground">Yuklanmoqda…</p>}
              {draft.imageUrl && !imgLoading && <ImgPreview url={draft.imageUrl} onRemove={() => patchDraft({ imageUrl: '' })} />}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Bosganda ochiluvchi sahifa</label>
              <select value={draft.deepLink} onChange={(e) => patchDraft({ deepLink: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {[
                  { value: '/notifications', label: 'Bildirishnomalar' },
                  { value: '/', label: 'Bosh sahifa' },
                  { value: '/orders', label: 'Buyurtmalar' },
                  { value: '/(tabs)/map', label: 'Xarita' },
                  { value: '/(tabs)/search', label: 'Qidiruv' },
                  { value: '/(tabs)/carts', label: 'Savat' },
                  { value: '/shops', label: "Do'konlar" },
                  { value: '/seller-application', label: 'Sotuvchi arizasi' },
                ].map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {result && (
              <p className={`text-sm font-medium ${result.ok ? 'text-green-600' : 'text-destructive'}`}>{result.msg}</p>
            )}

            <Button className="w-full" disabled={!canSend || send.isPending} onClick={() => send.mutate()}>
              <Send className="size-4" />
              {send.isPending ? 'Yuborilmoqda…' : `Yuborish → ${recipientLabel}`}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense>
      <NotificationsInner />
    </Suspense>
  );
}

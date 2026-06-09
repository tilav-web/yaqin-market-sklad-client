'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Edit2, Plus, Send, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then((m) => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="min-h-[180px] animate-pulse rounded-lg border border-border bg-muted/30" /> },
);

interface Template {
  id: string;
  name: string;
  title: string;
  body: string;
  richBody?: string;
  imageUrl?: string;
}

type Audience = 'all' | 'sellers' | 'customers' | 'specific';

const DEEP_LINKS: { value: string; label: string }[] = [
  { value: '/notifications', label: 'Bildirishnomalar sahifasi (standart)' },
  { value: '/', label: 'Bosh sahifa' },
  { value: '/orders', label: 'Buyurtmalar' },
  { value: '/(tabs)/map', label: 'Xarita' },
  { value: '/(tabs)/search', label: 'Qidiruv' },
  { value: '/(tabs)/carts', label: 'Savat' },
  { value: '/shops', label: "Barcha do'konlar" },
  { value: '/seller-application', label: "Sotuvchi bo'lish arizasi" },
];

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: 'all', label: "Hammaga (ro'yxatdan o'tmaganlar ham)" },
  { key: 'sellers', label: 'Sotuvchilar' },
  { key: 'customers', label: 'Mijozlar' },
  { key: 'specific', label: 'Tanlangan (telefon raqamlar)' },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function uploadImageFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<{ url: string }>('/uploads/image', form);
  return res.data.url;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function ImagePreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${API_URL}${url}`} alt="preview" className="h-12 w-12 rounded object-cover border border-border" />
      <p className="text-xs font-medium text-green-600">Yuklandi ✓</p>
      <button type="button" onClick={onRemove} className="ml-auto text-xs text-destructive">O'chirish</button>
    </div>
  );
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const composeRef = useRef<HTMLDivElement>(null);

  /* ── Compose form ── */
  const [audience, setAudience] = useState<Audience>('all');
  const [title, setTitle] = useState('');
  const [richBody, setRichBody] = useState('');
  const [phones, setPhones] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [deepLink, setDeepLink] = useState('/notifications');
  const [result, setResult] = useState<string | null>(null);

  /* ── New template form ── */
  const [showNewForm, setShowNewForm] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplTitle, setTplTitle] = useState('');
  const [tplRichBody, setTplRichBody] = useState('');
  const [tplImageUrl, setTplImageUrl] = useState('');
  const [tplImageUploading, setTplImageUploading] = useState(false);

  /* ── Template list UI state ── */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ name: string; title: string; richBody: string; imageUrl: string }>({
    name: '', title: '', richBody: '', imageUrl: '',
  });
  const [editImageUploading, setEditImageUploading] = useState(false);

  /* ── Queries & mutations ── */
  const templatesQuery = useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: async () => (await api.get<Template[]>('/admin/notifications/templates')).data,
  });

  const send = useMutation({
    mutationFn: async () => {
      const phoneList = phones.split(/[\n,]/).map((p) => p.trim()).filter(Boolean);
      const plainBody = stripHtml(richBody).slice(0, 512) || title;
      const res = await api.post<{ registered: number; pushedTokens: number }>('/admin/notifications/send', {
        title: title.trim(), body: plainBody, richBody: richBody || undefined, audience,
        ...(audience === 'specific' ? { phones: phoneList } : {}),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        ...(deepLink && deepLink !== '/notifications' ? { deepLink } : {}),
      });
      return res.data;
    },
    onSuccess: (r) => {
      setResult(`Yuborildi — ${r.registered} foydalanuvchi, ${r.pushedTokens} qurilma`);
      setTitle(''); setRichBody(''); setPhones(''); setImageUrl(''); setImageUploading(false);
      setDeepLink('/notifications');
    },
    onError: (e) => setResult(`Xatolik: ${extractErrorMessage(e)}`),
  });

  const createTpl = useMutation({
    mutationFn: async () => {
      const plainBody = stripHtml(tplRichBody).slice(0, 512) || tplTitle;
      await api.post('/admin/notifications/templates', {
        name: tplName.trim(), title: tplTitle.trim(), body: plainBody,
        richBody: tplRichBody || undefined, imageUrl: tplImageUrl || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      setTplName(''); setTplTitle(''); setTplRichBody(''); setTplImageUrl(''); setTplImageUploading(false);
      setShowNewForm(false);
    },
  });

  const updateTpl = useMutation({
    mutationFn: async (id: string) => {
      const plainBody = stripHtml(editFields.richBody).slice(0, 512) || editFields.title;
      await api.patch(`/admin/notifications/templates/${id}`, {
        name: editFields.name.trim(), title: editFields.title.trim(), body: plainBody,
        richBody: editFields.richBody || undefined, imageUrl: editFields.imageUrl || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      setEditingId(null);
    },
  });

  const deleteTpl = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/notifications/templates/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      setExpandedId(null); setEditingId(null);
    },
  });

  /* ── Helpers ── */
  const applyTemplate = (t: Template) => {
    setTitle(t.title);
    setRichBody(t.richBody ?? t.body);
    setImageUrl(t.imageUrl ?? '');
    composeRef.current?.scrollIntoView({ behavior: 'smooth' });
    setResult(null);
  };

  const startEdit = (t: Template) => {
    setEditingId(t.id);
    setEditFields({ name: t.name, title: t.title, richBody: t.richBody ?? t.body, imageUrl: t.imageUrl ?? '' });
    setEditImageUploading(false);
  };

  const uploadFor = (
    setter: (u: string) => void,
    setLoading: (v: boolean) => void,
  ) => async (file: File) => {
    setLoading(true);
    setter('');
    try { setter(await uploadImageFile(file)); } catch (e) { setResult(`Rasm yuklanmadi: ${extractErrorMessage(e)}`); }
    finally { setLoading(false); }
  };

  const plainPreview = stripHtml(richBody).slice(0, 100);
  const canSend = title.trim() && richBody && (audience !== 'specific' || phones.trim()) && !imageUploading;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader title="Bildirishnomalar" description="Foydalanuvchilarga push bildirishnoma yuborish" />

      {/* ── Compose ── */}
      <Card className="space-y-4 p-5" ref={composeRef}>
        <div>
          <label className="mb-1 block text-sm font-medium">Kimga</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </div>

        {audience === 'specific' && (
          <div>
            <label className="mb-1 block text-sm font-medium">Telefon raqamlar (har qatorda yoki vergul bilan)</label>
            <textarea value={phones} onChange={(e) => setPhones(e.target.value)} rows={3}
              placeholder="+998901234567&#10;+998907778899"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Sarlavha</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Aksiya boshlandi!" maxLength={128} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Matn</label>
          <RichTextEditor value={richBody} onChange={setRichBody} />
          {plainPreview && (
            <p className="mt-1.5 truncate text-xs text-muted-foreground">
              <span className="font-medium">Push preview:</span> {plainPreview}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Rasm (ixtiyoriy)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFor(setImageUrl, setImageUploading)(f); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground" />
          {imageUploading && <p className="mt-1 text-xs text-muted-foreground">Yuklanmoqda…</p>}
          {imageUrl && !imageUploading && <ImagePreview url={imageUrl} onRemove={() => setImageUrl('')} />}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Bildirishnomaga bosganda qaysi sahifa ochilsin</label>
          <select value={deepLink} onChange={(e) => setDeepLink(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {DEEP_LINKS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        {result && <p className="text-sm font-medium text-primary">{result}</p>}

        <Button disabled={!canSend || send.isPending} onClick={() => send.mutate()}>
          <Send className="size-4" />
          {send.isPending ? 'Yuborilmoqda…' : 'Yuborish'}
        </Button>
      </Card>

      {/* ── Templates ── */}
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Shablonlar</h3>
          <Button variant="outline" size="sm" onClick={() => setShowNewForm((v) => !v)}>
            <Plus className="size-4" />
            Yangi shablon
          </Button>
        </div>

        {/* New template form */}
        {showNewForm && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Yangi shablon</p>
            <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Shablon nomi" />
            <Input value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} placeholder="Sarlavha" />
            <RichTextEditor value={tplRichBody} onChange={setTplRichBody} />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Rasm (ixtiyoriy)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFor(setTplImageUrl, setTplImageUploading)(f); }}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground" />
              {tplImageUploading && <p className="mt-1 text-xs text-muted-foreground">Yuklanmoqda…</p>}
              {tplImageUrl && !tplImageUploading && <ImagePreview url={tplImageUrl} onRemove={() => setTplImageUrl('')} />}
            </div>
            <div className="flex gap-2">
              <Button size="sm"
                disabled={!tplName.trim() || !tplTitle.trim() || !tplRichBody || tplImageUploading || createTpl.isPending}
                onClick={() => createTpl.mutate()}>
                Saqlash
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewForm(false)}>Bekor</Button>
            </div>
          </div>
        )}

        {/* Template list */}
        <div className="space-y-2">
          {(templatesQuery.data ?? []).map((t) => {
            const isExpanded = expandedId === t.id;
            const isEditing = editingId === t.id;

            return (
              <div key={t.id} className="rounded-lg border border-border overflow-hidden">
                {/* Header row */}
                <button
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => { setExpandedId(isExpanded ? null : t.id); if (isEditing) setEditingId(null); }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.title} — {stripHtml(t.richBody ?? t.body).slice(0, 60)}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
                </button>

                {/* Expanded: view mode */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/10">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Sarlavha</p>
                      <p className="text-sm font-semibold">{t.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Matn</p>
                      {t.richBody ? (
                        <div
                          className="prose prose-sm max-w-none text-sm [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-primary [&_a]:underline [&_img]:rounded [&_img]:max-h-40"
                          dangerouslySetInnerHTML={{ __html: t.richBody }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{t.body}</p>
                      )}
                    </div>
                    {t.imageUrl && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Rasm</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${API_URL}${t.imageUrl}`} alt="template" className="h-24 rounded object-cover border border-border" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" onClick={() => { applyTemplate(t); setExpandedId(null); }}>
                        <Send className="size-3.5" />
                        Yuborish uchun ishlatish
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                        <Edit2 className="size-3.5" />
                        Tahrirlash
                      </Button>
                      <Button size="sm" variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteTpl.isPending}
                        onClick={() => { if (confirm(`"${t.name}" shablonini o'chirish?`)) deleteTpl.mutate(t.id); }}>
                        <Trash2 className="size-3.5" />
                        O'chirish
                      </Button>
                    </div>
                  </div>
                )}

                {/* Expanded: edit mode */}
                {isExpanded && isEditing && (
                  <div className="border-t border-border px-3 py-3 space-y-2 bg-muted/10">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tahrirlash</p>
                    <Input value={editFields.name} onChange={(e) => setEditFields((p) => ({ ...p, name: e.target.value }))} placeholder="Shablon nomi" />
                    <Input value={editFields.title} onChange={(e) => setEditFields((p) => ({ ...p, title: e.target.value }))} placeholder="Sarlavha" />
                    <RichTextEditor value={editFields.richBody} onChange={(v) => setEditFields((p) => ({ ...p, richBody: v }))} />
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Rasm (ixtiyoriy)</label>
                      <input type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadFor(
                            (u) => setEditFields((p) => ({ ...p, imageUrl: u })),
                            setEditImageUploading,
                          )(f);
                        }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground" />
                      {editImageUploading && <p className="mt-1 text-xs text-muted-foreground">Yuklanmoqda…</p>}
                      {editFields.imageUrl && !editImageUploading && (
                        <ImagePreview url={editFields.imageUrl} onRemove={() => setEditFields((p) => ({ ...p, imageUrl: '' }))} />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm"
                        disabled={!editFields.name.trim() || !editFields.title.trim() || editImageUploading || updateTpl.isPending}
                        onClick={() => updateTpl.mutate(t.id)}>
                        Saqlash
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Bekor</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(templatesQuery.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Shablon yo'q. Tez-tez yuboriladigan xabarlar uchun shablon qo'shing.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

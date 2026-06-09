'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

import dynamic from 'next/dynamic';

import { PageHeader } from '@/components/admin/page-header';

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then((m) => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="min-h-[180px] animate-pulse rounded-lg border border-border bg-muted/30" /> },
);
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  title: string;
  body: string;
  richBody?: string;
}

type Audience = 'all' | 'sellers' | 'customers' | 'specific';

const DEEP_LINKS: { value: string; label: string }[] = [
  { value: '/notifications', label: 'Bildirishnomalar sahifasi (standart)' },
  { value: '/', label: 'Bosh sahifa' },
  { value: '/orders', label: 'Buyurtmalar' },
  { value: '/(tabs)/map', label: 'Xarita' },
  { value: '/(tabs)/search', label: 'Qidiruv' },
  { value: '/(tabs)/carts', label: 'Savat' },
  { value: '/shops', label: 'Barcha do\'konlar' },
  { value: '/seller-application', label: 'Sotuvchi bo\'lish arizasi' },
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

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [audience, setAudience] = useState<Audience>('all');
  const [title, setTitle] = useState('');
  const [richBody, setRichBody] = useState('');
  const [phones, setPhones] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('/notifications');
  const [result, setResult] = useState<string | null>(null);

  // Template form
  const [tplName, setTplName] = useState('');
  const [tplTitle, setTplTitle] = useState('');
  const [tplRichBody, setTplRichBody] = useState('');
  const [showTplForm, setShowTplForm] = useState(false);

  const templatesQuery = useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: async () => (await api.get<Template[]>('/admin/notifications/templates')).data,
  });

  const send = useMutation({
    mutationFn: async () => {
      const phoneList = phones
        .split(/[\n,]/)
        .map((p) => p.trim())
        .filter(Boolean);
      const plainBody = stripHtml(richBody).slice(0, 512) || title;
      const res = await api.post<{ registered: number; pushedTokens: number }>('/admin/notifications/send', {
        title: title.trim(),
        body: plainBody,
        richBody: richBody || undefined,
        audience,
        ...(audience === 'specific' ? { phones: phoneList } : {}),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        ...(deepLink && deepLink !== '/notifications' ? { deepLink } : {}),
      });
      return res.data;
    },
    onSuccess: (r) => {
      setResult(`Yuborildi — ${r.registered} foydalanuvchi, ${r.pushedTokens} qurilma`);
      setTitle('');
      setRichBody('');
      setPhones('');
      setImageUrl('');
      setDeepLink('/notifications');
    },
    onError: (e) => setResult(`Xatolik: ${extractErrorMessage(e)}`),
  });

  const createTpl = useMutation({
    mutationFn: async () => {
      const plainBody = stripHtml(tplRichBody).slice(0, 512) || tplTitle;
      await api.post('/admin/notifications/templates', {
        name: tplName.trim(),
        title: tplTitle.trim(),
        body: plainBody,
        richBody: tplRichBody || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      setTplName('');
      setTplTitle('');
      setTplRichBody('');
      setShowTplForm(false);
    },
  });

  const deleteTpl = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/notifications/templates/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'templates'] }),
  });

  const useTemplate = (t: Template) => {
    setTitle(t.title);
    setRichBody(t.richBody ?? t.body);
  };

  const plainPreview = stripHtml(richBody).slice(0, 100);
  const canSend = title.trim() && richBody && (audience !== 'specific' || phones.trim());

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader title="Bildirishnomalar" description="Foydalanuvchilarga push bildirishnoma yuborish" />

      {/* Compose */}
      <Card className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Kimga</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {AUDIENCES.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {audience === 'specific' && (
          <div>
            <label className="mb-1 block text-sm font-medium">Telefon raqamlar (har qatorda yoki vergul bilan)</label>
            <textarea
              value={phones}
              onChange={(e) => setPhones(e.target.value)}
              rows={3}
              placeholder="+998901234567&#10;+998907778899"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
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
          <label className="mb-1 block text-sm font-medium">Rasm URL (ixtiyoriy)</label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/banner.jpg"
            type="url"
            maxLength={512}
          />
          <p className="mt-1 text-xs text-muted-foreground">Bildirishnomada ko'rinadigan rasm (reklamalar uchun)</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Bildirishnomaga bosganda qaysi sahifa ochilsin</label>
          <select
            value={deepLink}
            onChange={(e) => setDeepLink(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {DEEP_LINKS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {result && <p className="text-sm font-medium text-primary">{result}</p>}

        <Button disabled={!canSend || send.isPending} onClick={() => send.mutate()}>
          <Send className="size-4" />
          {send.isPending ? 'Yuborilmoqda…' : 'Yuborish'}
        </Button>
      </Card>

      {/* Templates */}
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Shablonlar</h3>
          <Button variant="outline" size="sm" onClick={() => setShowTplForm((v) => !v)}>
            <Plus className="size-4" />
            Yangi shablon
          </Button>
        </div>

        {showTplForm && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Shablon nomi" />
            <Input value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} placeholder="Sarlavha" />
            <RichTextEditor value={tplRichBody} onChange={setTplRichBody} />
            <Button
              size="sm"
              disabled={!tplName.trim() || !tplTitle.trim() || !tplRichBody || createTpl.isPending}
              onClick={() => createTpl.mutate()}>
              Saqlash
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {(templatesQuery.data ?? []).map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <button className="min-w-0 flex-1 text-left" onClick={() => useTemplate(t)}>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.title} — {stripHtml(t.richBody ?? t.body)}</p>
              </button>
              <button className="text-destructive" onClick={() => deleteTpl.mutate(t.id)}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {(templatesQuery.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Shablon yo'q. Tez-tez yuboriladigan xabarlar uchun shablon qo'shing.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

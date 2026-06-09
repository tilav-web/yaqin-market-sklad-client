'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  title: string;
  body: string;
}

type Audience = 'all' | 'sellers' | 'customers' | 'specific';

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: 'all', label: 'Hammaga (ro‘yxatdan o‘tmaganlar ham)' },
  { key: 'sellers', label: 'Sotuvchilar' },
  { key: 'customers', label: 'Mijozlar' },
  { key: 'specific', label: 'Tanlangan (telefon raqamlar)' },
];

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [audience, setAudience] = useState<Audience>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [phones, setPhones] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [result, setResult] = useState<string | null>(null);

  // Template form
  const [tplName, setTplName] = useState('');
  const [tplTitle, setTplTitle] = useState('');
  const [tplBody, setTplBody] = useState('');
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
      const res = await api.post<{ registered: number; pushedTokens: number }>('/admin/notifications/send', {
        title: title.trim(),
        body: body.trim(),
        audience,
        ...(audience === 'specific' ? { phones: phoneList } : {}),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        ...(deepLink.trim() ? { deepLink: deepLink.trim() } : {}),
      });
      return res.data;
    },
    onSuccess: (r) => {
      setResult(`Yuborildi — ${r.registered} foydalanuvchi, ${r.pushedTokens} qurilma`);
      setTitle('');
      setBody('');
      setPhones('');
      setImageUrl('');
      setDeepLink('');
    },
    onError: (e) => setResult(`Xatolik: ${extractErrorMessage(e)}`),
  });

  const createTpl = useMutation({
    mutationFn: async () => {
      await api.post('/admin/notifications/templates', { name: tplName.trim(), title: tplTitle.trim(), body: tplBody.trim() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      setTplName('');
      setTplTitle('');
      setTplBody('');
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
    setBody(t.body);
  };

  const canSend = title.trim() && body.trim() && (audience !== 'specific' || phones.trim());

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
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={512}
            placeholder="Bildirishnoma matni"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
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
          <label className="mb-1 block text-sm font-medium">Havola (deeplink, ixtiyoriy)</label>
          <Input
            value={deepLink}
            onChange={(e) => setDeepLink(e.target.value)}
            placeholder="/orders yoki /notifications"
            maxLength={256}
          />
          <p className="mt-1 text-xs text-muted-foreground">Bildirishnomaga bosganda qaysi sahifa ochilsin. Standart: /notifications</p>
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
            <textarea
              value={tplBody}
              onChange={(e) => setTplBody(e.target.value)}
              rows={2}
              placeholder="Matn"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button size="sm" disabled={!tplName.trim() || !tplTitle.trim() || !tplBody.trim() || createTpl.isPending} onClick={() => createTpl.mutate()}>
              Saqlash
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {(templatesQuery.data ?? []).map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <button className="min-w-0 flex-1 text-left" onClick={() => useTemplate(t)}>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.title} — {t.body}</p>
              </button>
              <button className="text-destructive" onClick={() => deleteTpl.mutate(t.id)}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {(templatesQuery.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Shablon yo‘q. Tez-tez yuboriladigan xabarlar uchun shablon qo‘shing.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';

import { sanitizeHtml } from '@/lib/sanitize';
import { stripHtml, uploadImageFile } from '@/lib/notif-utils';

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then((m) => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="min-h-[140px] animate-pulse rounded-lg border border-border bg-muted/30" /> },
);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Single source of truth for "where does this notification deep-link to?" —
 * this used to be copy-pasted independently in notifications/page.tsx (8
 * options) and users/page.tsx's SendNotifModal (6 options, missing /shops
 * and /seller-application), so the two drifted out of sync. Import this
 * instead of redeclaring the list.
 */
export const DEEP_LINK_OPTIONS: { value: string; label: string }[] = [
  { value: '/notifications', label: 'Bildirishnomalar' },
  { value: '/', label: 'Bosh sahifa' },
  { value: '/orders', label: 'Buyurtmalar' },
  { value: '/(tabs)/map', label: 'Xarita' },
  { value: '/(tabs)/search', label: 'Qidiruv' },
  { value: '/(tabs)/carts', label: 'Savat' },
  { value: '/shops', label: "Do'konlar" },
  { value: '/seller-application', label: 'Sotuvchi arizasi' },
];

export interface NotifTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  richBody?: string;
  imageUrl?: string;
}

interface NotifComposeFormProps {
  title: string;
  onTitleChange: (v: string) => void;
  richBody: string;
  onRichBodyChange: (v: string) => void;
  imageUrl: string;
  onImageUrlChange: (v: string) => void;
  imgLoading: boolean;
  onImgLoadingChange: (v: boolean) => void;
  deepLink: string;
  onDeepLinkChange: (v: string) => void;
  /** Optional quick-select template chips rendered above the fields. */
  templates?: NotifTemplate[];
  selectedTplId?: string | null;
  onApplyTemplate?: (t: NotifTemplate) => void;
}

/**
 * Shared "compose" fields for a push notification / template — title, rich
 * text body, optional image, and deep-link destination. Used by both the
 * full notifications page and the quick-send modal on the users page so
 * they can no longer drift out of sync (see DEEP_LINK_OPTIONS above).
 */
export function NotifComposeForm({
  title, onTitleChange,
  richBody, onRichBodyChange,
  imageUrl, onImageUrlChange,
  imgLoading, onImgLoadingChange,
  deepLink, onDeepLinkChange,
  templates, selectedTplId, onApplyTemplate,
}: NotifComposeFormProps) {
  return (
    <div className="space-y-4">
      {templates && templates.length > 0 && onApplyTemplate && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shablonlar</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button key={t.id} type="button" onClick={() => onApplyTemplate(t)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
                  ${selectedTplId === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background hover:bg-muted'}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Sarlavha</label>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Aksiya boshlandi!"
          maxLength={128}
          className="h-9 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-1 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Matn</label>
        <RichTextEditor value={richBody} onChange={onRichBodyChange} />
        {richBody && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            <span className="font-medium">Preview:</span> {stripHtml(sanitizeHtml(richBody)).slice(0, 80)}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Rasm (ixtiyoriy)</label>
        <input type="file" accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            onImgLoadingChange(true); onImageUrlChange('');
            try { onImageUrlChange(await uploadImageFile(f)); }
            catch { /* ignore — admin can retry the file input */ }
            finally { onImgLoadingChange(false); }
          }}
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground" />
        {imgLoading && <p className="mt-1 text-xs text-muted-foreground">Yuklanmoqda…</p>}
        {imageUrl && !imgLoading && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${API_URL}${imageUrl}`} alt="" className="h-12 w-12 rounded object-cover border border-border" />
            <span className="text-xs font-medium text-green-600">Yuklandi ✓</span>
            <button type="button" onClick={() => onImageUrlChange('')} className="ml-auto text-xs text-destructive">O&apos;chirish</button>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Bosganda ochiluvchi sahifa</label>
        <select value={deepLink} onChange={(e) => onDeepLinkChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {DEEP_LINK_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>
    </div>
  );
}

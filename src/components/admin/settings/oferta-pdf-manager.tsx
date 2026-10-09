'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, extractErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast';
import { Setting } from './types';

export function OfertaPdfManager() {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ['admin', 'settings'],
  });

  const ofertaPdfSetting = settings.find((s) => s.key === 'oferta_pdf_url');
  const currentPdfUrl = ofertaPdfSetting?.value;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post<{ url: string }>('/admin/settings/upload-oferta-pdf', fd);
      toast.success('Ommaviy oferta PDF shartnomasi muvaffaqiyatli yuklandi!');
      setFile(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
    } catch (err) {
      toast.error(extractErrorMessage(err) || 'PDF faylni yuklashda xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  const fullPdfUrl = currentPdfUrl
    ? (currentPdfUrl.startsWith('http')
        ? currentPdfUrl
        : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.yaqin-market.uz'}${currentPdfUrl}`)
    : null;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Ommaviy Oferta PDF Shartnomasi</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Sotuvchilar uchun
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mobil ilova va veb-saytda sotuvchilarga ko&apos;rsatiladigan rasmiy muhrlangan PDF shartnoma.
            </p>
          </div>
        </div>

        {fullPdfUrl && (
          <a
            href={fullPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0">
            <ExternalLink className="size-3.5 text-primary" />
            Joriy PDFni ko&apos;rish
          </a>
        )}
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <span className="text-xs font-bold text-foreground">Hozirgi holat:</span>
          {currentPdfUrl ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="size-4 shrink-0" />
                Rasmiy PDF shartnoma yuklangan
              </div>
              <p className="text-muted-foreground font-mono text-[11px] truncate">
                {currentPdfUrl}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">
                Foydalanuvchilar ilovada ushbu faylni yuklab olmasdan, ilovaning o&apos;zida to&apos;g&apos;ridan-to&apos;g&apos;ri ochib ko&apos;rishadi.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <AlertTriangle className="size-4 shrink-0" />
                PDF fayl hali yuklanmagan
              </div>
              <p className="text-muted-foreground text-[11px]">
                Hozircha ilovada standart matn ko&apos;rinmoqda. Rasmiy muhrlangan PDF faylni yuklasangiz, sotuvchilar uni ilovada ko&apos;rishlari mumkin bo&apos;ladi.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleUpload} className="space-y-3">
          <label className="block text-xs font-bold text-foreground">
            Yangi PDF faylni yuklash / yangilash:
          </label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
          />
          {file && (
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Tanlangan: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <Button
            type="submit"
            disabled={!file || uploading}
            size="sm"
            className="w-full h-10 rounded-xl gap-2 text-xs font-bold">
            <Upload className="size-3.5" />
            {uploading ? 'Yuklanmoqda...' : 'PDF Shartnomani Saqlash'}
          </Button>
        </form>
      </div>
    </div>
  );
}

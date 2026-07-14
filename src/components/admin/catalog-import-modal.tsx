'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';

interface PreviewRow {
  rowNumber: number;
  name: string;
  barcode?: string;
  brand?: string;
  categoryId?: string;
  unitType?: string;
  unitSize?: number;
  isVerified?: boolean;
  warnings: string[];
}

interface PreviewResult {
  willCreate: number;
  errors: { row: number; message: string }[];
  rows: PreviewRow[];
}

interface ConfirmResult {
  created: number;
  skipped: number;
  failed: { row: number; message: string }[];
}

const UNIT_LABEL: Record<string, string> = { piece: 'dona', kg: 'kg', liter: 'litr', gram: 'g', pack: 'paket' };

/**
 * Admin-side bulk catalog import — separate from the seller's own inventory
 * Excel import (that one prices/stocks a shop's variants; this one only
 * creates shared GlobalProduct master rows, no price/stock).
 */
export function CatalogImportModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [downloadErr, setDownloadErr] = useState('');

  const downloadTemplate = useMutation({
    mutationFn: () => downloadFile('/admin/catalog/import/template', 'katalog-shabloni.xlsx'),
    onError: (e) => setDownloadErr(extractErrorMessage(e)),
  });

  const uploadPreview = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<PreviewResult>('/admin/catalog/import/preview', form);
      return res.data;
    },
    onSuccess: (data) => { setPreview(data); setResult(null); },
  });

  const confirm = useMutation({
    mutationFn: async () => {
      if (!preview) return;
      // The server DTO doesn't declare `warnings` (preview-only, display
      // concern) — the global ValidationPipe has forbidNonWhitelisted:true,
      // so it must be stripped before sending back (same pattern the
      // seller-side Excel import client uses).
      const rows = preview.rows.map(({ warnings: _warnings, ...row }) => row);
      const res = await api.post<ConfirmResult>('/admin/catalog/import/confirm', { rows });
      return res.data;
    },
    onSuccess: (data) => {
      if (!data) return;
      setResult(data);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ['admin', 'catalog'] });
      qc.invalidateQueries({ queryKey: ['admin', 'catalog-stats'] });
    },
  });

  const pickFile = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPreview.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Ommaviy import</h2>
            <p className="text-xs text-muted-foreground">
              Excel fayl orqali bir nechta mahsulotni birdaniga katalogga qo&apos;shish
            </p>
          </div>
          <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        {!preview && !result && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-4">
              <div>
                <p className="text-sm font-medium">1. Shablonni yuklab oling</p>
                <p className="text-xs text-muted-foreground">Ustunlarni to&apos;ldirib qayta yuklaysiz</p>
              </div>
              <Button variant="outline" size="sm" disabled={downloadTemplate.isPending} onClick={() => downloadTemplate.mutate()}>
                <Download className="size-4" /> Shablon
              </Button>
            </div>
            {downloadErr && <p className="text-sm text-destructive">{downloadErr}</p>}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-4">
              <div>
                <p className="text-sm font-medium">2. To&apos;ldirilgan faylni yuklang</p>
                <p className="text-xs text-muted-foreground">.xlsx format, maksimal 5 MB</p>
              </div>
              <Button size="sm" disabled={uploadPreview.isPending} onClick={pickFile}>
                <Upload className="size-4" /> {uploadPreview.isPending ? 'Tekshirilmoqda…' : 'Fayl tanlash'}
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={onFileChange} />
            </div>
            {uploadPreview.isError && (
              <p className="text-sm text-destructive">{extractErrorMessage(uploadPreview.error)}</p>
            )}
          </div>
        )}

        {preview && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-primary/8 px-3 py-2 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              {preview.willCreate} ta mahsulot qo&apos;shishga tayyor
            </div>

            {preview.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <AlertTriangle className="size-4" /> {preview.errors.length} qatorda xato — bular o&apos;tkazib yuboriladi
                </p>
                <ul className="mt-1.5 space-y-0.5 text-xs text-destructive">
                  {preview.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>Qator {e.row}: {e.message}</li>
                  ))}
                  {preview.errors.length > 20 && <li>… yana {preview.errors.length - 20} ta</li>}
                </ul>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Qator</th>
                    <th className="px-3 py-2 font-semibold">Nomi</th>
                    <th className="px-3 py-2 font-semibold">Barkod</th>
                    <th className="px-3 py-2 font-semibold">Birlik</th>
                    <th className="px-3 py-2 font-semibold">Ogohlantirish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.rows.map((r) => (
                    <tr key={r.rowNumber}>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.rowNumber}</td>
                      <td className="px-3 py-1.5 font-medium">{r.name}{r.brand ? ` (${r.brand})` : ''}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{r.barcode ?? '—'}</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">
                        {r.unitSize ?? 1} {UNIT_LABEL[r.unitType ?? 'piece']}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-amber-700">
                        {r.warnings.length > 0 ? r.warnings.join('; ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {confirm.isError && <p className="text-sm text-destructive">{extractErrorMessage(confirm.error)}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>Bekor qilish</Button>
              <Button
                size="sm"
                disabled={preview.willCreate === 0 || confirm.isPending}
                onClick={() => confirm.mutate()}>
                {confirm.isPending ? 'Saqlanmoqda…' : `${preview.willCreate} ta mahsulotni qo'shish`}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="size-4" />
              {result.created} ta yaratildi{result.skipped > 0 ? `, ${result.skipped} ta o'tkazib yuborildi (barkod mavjud)` : ''}
            </div>
            {result.failed.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive">{result.failed.length} ta qatorda xato yuz berdi</p>
                <ul className="mt-1.5 space-y-0.5 text-xs text-destructive">
                  {result.failed.map((f, i) => <li key={i}>Qator {f.row}: {f.message}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" onClick={onClose}>Yopish</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

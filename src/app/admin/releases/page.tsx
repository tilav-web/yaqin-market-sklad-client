'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Smartphone, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { I18nInput, I18nValue } from '@/components/ui/i18n-input';
import { api, extractErrorMessage } from '@/lib/api';
import { getLocalizedText } from '@/lib/transliteration';
import { toast } from '@/stores/toast';

interface Release {
  id: string;
  version: string;
  notes: string | { uz: string; kr?: string; ru?: string } | null;
  sizeBytes: number;
  isLatest: boolean;
  createdAt: string;
}

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ReleasesPage() {
  const qc = useQueryClient();
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState<I18nValue>({ uz: '', kr: '', ru: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploadErr, setUploadErr] = useState('');
  const [removeErr, setRemoveErr] = useState('');
  const [pendingRemove, setPendingRemove] = useState<Release | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const releasesQuery = useQuery({
    queryKey: ['admin', 'releases'],
    queryFn: async () => {
      const res = await api.get<Release[]>('/admin/app-releases');
      return res.data;
    },
  });

  const reset = () => {
    setVersion('');
    setNotes({ uz: '', kr: '', ru: '' });
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const upload = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('version', version.trim());
      if (notes.uz.trim() || notes.ru?.trim()) {
        form.append('notes', notes.uz.trim());
      }
      form.append('file', file as File);
      await api.post('/admin/app-releases', form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'releases'] });
      reset();
      setUploadErr('');
      toast.success('Yangi versiya yuklandi');
    },
    onError: (e) => setUploadErr(extractErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/app-releases/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'releases'] });
      setRemoveErr('');
      setPendingRemove(null);
      toast.success("Versiya o'chirildi");
    },
    onError: (e) => setRemoveErr(extractErrorMessage(e)),
  });

  const releases = releasesQuery.data ?? [];
  const versionValid = /^\d+\.\d+\.\d+$/.test(version.trim());
  const canUpload = versionValid && !!file && !upload.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ilova versiyalari (APK)"
        description="Yangi APK versiyasini yuklang — sayt yuklab olish tugmasi eng so'nggi versiyani beradi."
      />

      <Card className="space-y-4 p-5 bg-card border-border shadow-xs rounded-xl">
        <h2 className="text-xs font-bold text-foreground">Yangi versiya yuklash</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Versiya *</label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.3"
              className="h-8.5 text-xs font-mono"
            />
            {version.trim().length > 0 && !versionValid && (
              <p className="text-[0.7rem] text-destructive">X.Y.Z formatida bo&apos;lishi kerak (masalan 1.2.3)</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">APK fayl *</label>
            <input
              ref={fileRef}
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>

        <I18nInput
          label="Izoh / O'zgarishlar (ixtiyoriy)"
          placeholder="Nima yangiliklar qo'shildi…"
          value={notes}
          onChange={setNotes}
        />

        {file ? <p className="text-xs text-muted-foreground">Tanlangan: {file.name} · {mb(file.size)}</p> : null}
        {uploadErr && <p className="text-xs text-destructive">{uploadErr}</p>}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            size="sm"
            disabled={!canUpload}
            onClick={() => upload.mutate()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Upload className="size-3.5 mr-1" />
            {upload.isPending ? 'Yuklanmoqda…' : 'Yuklash'}
          </Button>
        </div>
      </Card>

      {removeErr && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{removeErr}</p>
      )}

      <Card className="overflow-hidden bg-card border-border shadow-xs rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[0.7rem] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Versiya</th>
              <th className="px-4 py-2.5 font-semibold">Hajmi</th>
              <th className="px-4 py-2.5 font-semibold">Izoh</th>
              <th className="px-4 py-2.5 font-semibold">Sana</th>
              <th className="px-4 py-2.5 text-right font-semibold">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {releases.map((r) => {
              const notesStr = getLocalizedText(r.notes, 'uz') || '—';
              return (
                <tr key={r.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-bold text-foreground">
                      <Smartphone className="size-3.5 text-muted-foreground" />
                      {r.version}
                      {r.isLatest ? <Badge variant="success" className="text-[0.65rem]">So&apos;nggi</Badge> : null}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{mb(r.sizeBytes)}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{notesStr}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        disabled={remove.isPending}
                        onClick={() => { remove.reset(); setRemoveErr(''); setPendingRemove(r); }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {releasesQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">Yuklanmoqda…</td>
              </tr>
            ) : null}
            {!releasesQuery.isLoading && releases.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">Hozircha birorta ham APK yuklanmagan</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <ConfirmDialog
        open={!!pendingRemove}
        title="Versiyani o'chirish"
        description={
          <p>
            v<span className="font-semibold text-foreground">{pendingRemove?.version}</span> versiyasini o&apos;chirmoqchimisiz?
          </p>
        }
        confirmLabel="Ha, o'chirish"
        pending={remove.isPending}
        error={removeErr}
        onConfirm={() => pendingRemove && remove.mutate(pendingRemove.id)}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}

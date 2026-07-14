'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Smartphone, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast';

interface Release {
  id: string;
  version: string;
  notes: string | null;
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
  const [notes, setNotes] = useState('');
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
    setNotes('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const upload = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('version', version.trim());
      if (notes.trim()) form.append('notes', notes.trim());
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
  // Mirrors the server's CreateReleaseDto — X.Y.Z only, so an admin doesn't
  // find out the format is wrong only after uploading the (large) APK file.
  const versionValid = /^\d+\.\d+\.\d+$/.test(version.trim());
  const canUpload = versionValid && !!file && !upload.isPending;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Mobil ilova"
        title="Ilova versiyalari (APK)"
        description="Yangi APK versiyasini yuklang — sayt yuklab olish tugmasi eng so'nggi versiyani beradi."
      />

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold text-foreground">Yangi versiya yuklash</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Versiya</label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.3" />
            {version.trim().length > 0 && !versionValid && (
              <p className="text-xs text-destructive">X.Y.Z formatida bo&apos;lishi kerak (masalan 1.2.3)</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">APK fayl</label>
            <input
              ref={fileRef}
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Izoh (ixtiyoriy)</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nima o'zgardi…" />
        </div>
        {file ? <p className="text-xs text-muted-foreground">Tanlangan: {file.name} · {mb(file.size)}</p> : null}
        {uploadErr && <p className="text-xs text-destructive">{uploadErr}</p>}
        <div className="flex justify-end">
          <Button disabled={!canUpload} onClick={() => upload.mutate()}>
            <Upload className="size-4" />
            {upload.isPending ? 'Yuklanmoqda…' : 'Yuklash'}
          </Button>
        </div>
      </Card>

      {removeErr && (
        <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{removeErr}</p>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Versiya</th>
              <th className="px-5 py-3 font-semibold">Hajmi</th>
              <th className="px-5 py-3 font-semibold">Izoh</th>
              <th className="px-5 py-3 font-semibold">Sana</th>
              <th className="px-5 py-3 text-right font-semibold">Amal</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                    <Smartphone className="size-4 text-muted-foreground" />
                    {r.version}
                    {r.isLatest ? <Badge variant="success">So&apos;nggi</Badge> : null}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{mb(r.sizeBytes)}</td>
                <td className="max-w-xs truncate px-5 py-3 text-muted-foreground">{r.notes || '—'}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={remove.isPending}
                      onClick={() => { remove.reset(); setRemoveErr(''); setPendingRemove(r); }}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {releasesQuery.isLoading ? (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda…</td></tr>
            ) : null}
            {releasesQuery.isError ? (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-destructive">
                {extractErrorMessage(releasesQuery.error)} —{' '}
                <button className="underline" onClick={() => releasesQuery.refetch()}>qayta urinish</button>
              </td></tr>
            ) : null}
            {!releasesQuery.isLoading && !releasesQuery.isError && releases.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Hali versiya yuklanmagan</td></tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <ConfirmDialog
        open={!!pendingRemove}
        title="Versiyani o'chirish"
        description={pendingRemove && (
          <div className="space-y-1">
            <p>Versiya: <span className="font-semibold text-foreground">{pendingRemove.version}</span></p>
            {pendingRemove.isLatest && (
              <p className="mt-2 text-destructive">
                Bu hozirgi &quot;so&apos;nggi&quot; versiya — o&apos;chirilgach, qolganlar orasidan eng yuqori versiya raqami avtomatik so&apos;nggi deb belgilanadi.
              </p>
            )}
          </div>
        )}
        confirmLabel="Ha, o'chirish"
        pending={remove.isPending}
        error={removeErr}
        onConfirm={() => pendingRemove && remove.mutate(pendingRemove.id)}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast';

interface Setting { key: string; value: string; description: string | null; updatedAt: string }

const LABEL: Record<string, string> = {
  commission_rate_default: 'Standart komissiya (%)',
  debt_due_days: 'Qarz muddati (kun)',
  settlement_hours: 'Settlement vaqti (soat)',
};

/** Mirrors the server's validation in SettingsService.set() — every setting is a non-negative number, commission is additionally capped at 100. */
function isValidSettingValue(key: string, value: string): boolean {
  // Number('') is 0, not NaN — an emptied field would otherwise read as a
  // "valid" zero and silently save (e.g. commission dropping to 0%).
  if (value.trim() === '') return false;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return false;
  if (key === 'commission_rate_default' && n > 100) return false;
  return true;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useQuery<Setting[]>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => (await api.get('/admin/settings')).data,
  });

  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`/admin/settings/${key}`, { value }),
    onSuccess: (_, { key }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setEditing((prev) => { const next = { ...prev }; delete next[key]; return next; });
      toast.success('Sozlama saqlandi');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Yuklanmoqda…</div>;

  if (isError) {
    return (
      <div className="p-6 text-sm text-destructive">
        {extractErrorMessage(error)} —{' '}
        <button className="underline" onClick={() => refetch()}>qayta urinish</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PageHeader title="Sozlamalar" description="Komissiya, qarz, settlement parametrlari" />
      <div className="mt-6 space-y-3">
        {(data ?? []).map((s) => {
          const val = editing[s.key] ?? s.value;
          const dirty = editing[s.key] !== undefined;
          const valid = isValidSettingValue(s.key, val);
          return (
            <Card key={s.key} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{LABEL[s.key] ?? s.key}</p>
                  {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                </div>
                <input
                  type="number"
                  min={0}
                  max={s.key === 'commission_rate_default' ? 100 : undefined}
                  className="w-28 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
                  value={val}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))}
                />
                <Button
                  size="sm"
                  disabled={!dirty || !valid || save.isPending}
                  onClick={() => save.mutate({ key: s.key, value: val })}
                >
                  <Save className="size-3" />
                  Saqlash
                </Button>
              </div>
              {dirty && !valid && (
                <p className="text-xs text-destructive">
                  Qiymat manfiy bo&apos;lmagan raqam bo&apos;lishi kerak
                  {s.key === 'commission_rate_default' ? ' (0-100 oralig\'ida)' : ''}
                </p>
              )}
              {s.key === 'commission_rate_default' && (
                <p className="text-xs text-muted-foreground">
                  Bu qiymat faqat yangi buyurtmalarga ta&apos;sir qiladi — allaqachon yaratilgan buyurtmalar eski stavkada qoladi.
                </p>
              )}
            </Card>
          );
        })}
      </div>
      {save.isError && (
        <p className="mt-3 text-sm text-destructive">{extractErrorMessage(save.error)}</p>
      )}
    </div>
  );
}

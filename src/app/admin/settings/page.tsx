'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface Setting { key: string; value: string; description: string | null; updatedAt: string }

const LABEL: Record<string, string> = {
  commission_rate_default: 'Standart komissiya (%)',
  debt_due_days: 'Qarz muddati (kun)',
  settlement_hours: 'Settlement vaqti (soat)',
};

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
    },
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
          return (
            <Card key={s.key} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{LABEL[s.key] ?? s.key}</p>
                {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
              </div>
              <input
                className="w-28 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
                value={val}
                onChange={(e) => setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))}
              />
              <Button
                size="sm"
                disabled={!dirty || save.isPending}
                onClick={() => save.mutate({ key: s.key, value: val })}
              >
                <Save className="size-3" />
                Saqlash
              </Button>
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

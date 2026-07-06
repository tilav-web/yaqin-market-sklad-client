'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { api, extractErrorMessage } from '@/lib/api';

import { ConfirmDialog } from './confirm-dialog';

/**
 * Self-contained "Hal qilish" action for a single OrderComplaint — owns its own
 * dialog/mutation state so it can be dropped into both the complaints queue
 * page and the shop-scoped complaints panel without duplicating the mutation
 * wiring in either place. Resolution note is required (server also validates
 * this via ResolveComplaintDto), matching the required-reason pattern already
 * used for debt forgiveness / admin promotion dialogs.
 */
export function ResolveComplaintButton({
  complaintId,
  invalidateKeys,
}: {
  complaintId: string;
  invalidateKeys: unknown[][];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  const resolve = useMutation({
    mutationFn: async (text: string) => {
      await api.post(`/admin/complaints/${complaintId}/resolve`, { resolution: text });
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      setOpen(false);
      setResolution('');
    },
  });

  const close = () => {
    if (resolve.isPending) return;
    setOpen(false);
    setResolution('');
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Hal qilish
      </Button>
      <ConfirmDialog
        open={open}
        title="Shikoyatni hal qilish"
        description="Shikoyat holati 'yopilgan'ga o'zgaradi. Hal qilish izohi majburiy va keyinchalik ko'rinib turadi."
        confirmLabel="Hal qilindi deb belgilash"
        destructive={false}
        pending={resolve.isPending}
        confirmDisabled={!resolution.trim()}
        error={resolve.isError ? extractErrorMessage(resolve.error) : ''}
        onConfirm={() => resolve.mutate(resolution.trim())}
        onCancel={close}>
        <textarea
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          rows={3}
          placeholder="Hal qilish tafsilotlari (majburiy)…"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
      </ConfirmDialog>
    </>
  );
}

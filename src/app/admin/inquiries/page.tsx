'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Phone } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function InquiriesPage() {
  const qc = useQueryClient();

  const inquiriesQuery = useQuery({
    queryKey: ['admin', 'inquiries'],
    queryFn: async () => {
      const res = await api.get<Inquiry[]>('/admin/contact');
      return res.data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/contact/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'inquiries'] }),
    onError: (e) => alert(extractErrorMessage(e)),
  });

  const inquiries = inquiriesQuery.data ?? [];
  const unread = inquiries.filter((i) => !i.isRead).length;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Aloqa"
        title="Murojaatlar"
        description={
          unread > 0
            ? `${unread} ta o'qilmagan murojaat — saytdan qoldirilgan.`
            : "Saytdagi 'Biz bilan bog'laning' formasidan kelgan murojaatlar."
        }
      />

      {inquiriesQuery.isLoading ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">Yuklanmoqda…</Card>
      ) : inquiriesQuery.isError ? (
        <Card className="py-16 text-center text-sm text-destructive">
          {extractErrorMessage(inquiriesQuery.error)} —{' '}
          <button className="underline" onClick={() => inquiriesQuery.refetch()}>qayta urinish</button>
        </Card>
      ) : inquiries.length === 0 ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">Hozircha murojaat yo&apos;q</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {inquiries.map((i) => (
            <Card
              key={i.id}
              className={`space-y-3 p-5 ${i.isRead ? '' : 'border-primary/40 bg-primary/[0.03]'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{i.name}</p>
                  <a
                    href={`tel:${i.phone}`}
                    className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Phone className="size-3.5" />
                    {i.phone}
                  </a>
                </div>
                {i.isRead ? (
                  <Badge variant="neutral">O&apos;qilgan</Badge>
                ) : (
                  <Badge variant="success">Yangi</Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{i.message}</p>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(i.createdAt).toLocaleString('uz-UZ')}
                </span>
                {!i.isRead ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(i.id)}>
                    <Check className="size-4" />
                    O&apos;qildi
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

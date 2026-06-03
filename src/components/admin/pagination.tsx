'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total <= pageSize) return null;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <p className="text-sm text-muted-foreground">
        {from}–{to} / {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" />
          Oldingi
        </Button>
        <span className="text-sm font-medium text-foreground">
          {page + 1} / {lastPage + 1}
        </span>
        <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => onPage(page + 1)}>
          Keyingi
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

'use client';

import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';

import { cn } from '@/lib/cn';
import { type ToastItem, useToastStore } from '@/stores/toast';

const AUTO_DISMISS_MS = 3500;

function ToastRow({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [item.id, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm',
        item.variant === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
      )}>
      {item.variant === 'success' ? (
        <CheckCircle2 className="size-4 shrink-0" />
      ) : (
        <XCircle className="size-4 shrink-0" />
      )}
      <p className="text-sm font-medium">{item.message}</p>
      <button
        onClick={() => dismiss(item.id)}
        className="ml-2 shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/** Mounted once in admin/layout.tsx — any page calls toast.success()/toast.error() from lib/toast. */
export function Toaster() {
  const items = useToastStore((s) => s.items);
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </div>
  );
}

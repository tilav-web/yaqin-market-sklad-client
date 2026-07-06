'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Amount / seller / consequence details the admin must see before confirming. */
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (red). Defaults to true. */
  destructive?: boolean;
  pending?: boolean;
  /** Disables the confirm button regardless of `pending` — e.g. a required reason field left empty. */
  confirmDisabled?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra content rendered between the description and the buttons — e.g. a required reason field. */
  children?: React.ReactNode;
}

/**
 * Shared confirmation modal for high-stakes / real-money actions (force
 * settle/refund, withdrawal approve/reject, debt forgive/extend, admin
 * promote/demote) — matches the visual pattern already used by the seller
 * application approve/reject dialogs (fixed inset-0 + bg-foreground/40 +
 * backdrop-blur + Card), so it doesn't introduce a new UI pattern. Unlike a
 * bare `confirm()`, it forces the amount/seller/consequence to be rendered
 * on screen before the admin can click through.
 */
export function ConfirmDialog({
  open, title, description, confirmLabel = 'Tasdiqlash', cancelLabel = 'Bekor qilish',
  destructive = true, pending, confirmDisabled, error, onConfirm, onCancel, children,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {description && <div className="mt-2 text-sm text-muted-foreground">{description}</div>}
        {children && <div className="mt-4">{children}</div>}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            size="sm"
            disabled={pending || confirmDisabled}
            onClick={onConfirm}>
            {pending ? 'Bajarilmoqda…' : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

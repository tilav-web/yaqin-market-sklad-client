import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { ResolveComplaintButton } from './resolve-complaint-button';

/**
 * Matches OrderComplaint (server/src/complaints/entities/order-complaint.entity.ts)
 * as returned by GET /admin/complaints and GET /admin/shops/:id/complaints — raw
 * IDs only, no joined customer/shop names (the service queries the table directly
 * without relations), so this card surfaces orderId/customerId/shopId as-is —
 * same "raw id, no name join" pattern already used for sellerId on the debts page.
 */
export interface AdminComplaint {
  id: string;
  orderId: string;
  customerId: string;
  shopId: string;
  reason: string;
  description: string | null;
  status: 'open' | 'resolved';
  resolution: string | null;
  resolvedByAdminId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export function ComplaintCard({
  complaint,
  showShopId = true,
  invalidateKeys,
}: {
  complaint: AdminComplaint;
  /** Hide the shopId line when the card is already rendered inside a shop-scoped panel. */
  showShopId?: boolean;
  /** Query keys to invalidate after a successful resolve — queue list and/or shop-scoped panel. */
  invalidateKeys: unknown[][];
}) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={complaint.status === 'open' ? 'warning' : 'success'}>
              {complaint.status === 'open' ? 'Ochiq' : 'Yopilgan'}
            </Badge>
            <span className="text-sm font-semibold text-foreground">{complaint.reason}</span>
          </div>
          {complaint.description && (
            <p className="mt-1 text-sm text-muted-foreground">{complaint.description}</p>
          )}
        </div>
        {complaint.status === 'open' && (
          <ResolveComplaintButton complaintId={complaint.id} invalidateKeys={invalidateKeys} />
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Buyurtma: <span className="font-mono">{complaint.orderId}</span>
        </span>
        <span>
          Mijoz: <span className="font-mono">{complaint.customerId}</span>
        </span>
        {showShopId && (
          <span>
            Do&apos;kon: <span className="font-mono">{complaint.shopId}</span>
          </span>
        )}
        <span>{new Date(complaint.createdAt).toLocaleString('uz-UZ')}</span>
      </div>

      {complaint.status === 'resolved' && complaint.resolution && (
        <div className="rounded-lg bg-muted/30 p-2.5 text-xs">
          <p className="font-medium text-foreground">Yechim:</p>
          <p className="mt-0.5 text-muted-foreground">{complaint.resolution}</p>
          {complaint.resolvedAt && (
            <p className="mt-1 text-muted-foreground">
              {new Date(complaint.resolvedAt).toLocaleString('uz-UZ')}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

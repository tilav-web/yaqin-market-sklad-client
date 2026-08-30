'use client';

import {
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  Inbox,
  MessageSquareWarning,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import React, { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useEscapeKey } from '@/lib/use-escape-key';

export interface NotificationCounts {
  applications?: number;
  complaints?: number;
  risk?: number;
  inquiries?: number;
}

export function NotificationPopover({
  counts,
}: {
  counts: NotificationCounts;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEscapeKey(isOpen, () => setIsOpen(false));

  const total =
    (counts.applications ?? 0) +
    (counts.complaints ?? 0) +
    (counts.risk ?? 0) +
    (counts.inquiries ?? 0);

  const notifications = [
    {
      id: 'complaints',
      title: 'Ochiq shikoyatlar',
      count: counts.complaints ?? 0,
      href: '/admin/complaints',
      icon: MessageSquareWarning,
      color: 'text-amber-500 bg-amber-500/10',
      description: 'Mijozlar tomonidan qoldirilgan hal qilinmagan e\'tirozlar',
    },
    {
      id: 'risk',
      title: 'Xavf signallari (Anti-Fraud)',
      count: counts.risk ?? 0,
      href: '/admin/risk',
      icon: ShieldAlert,
      color: 'text-rose-500 bg-rose-500/10',
      description: 'Kuryer va lokatsiyadagi anomaliya va xavflar',
    },
    {
      id: 'applications',
      title: 'Do\'kon arizalari',
      count: counts.applications ?? 0,
      href: '/admin/applications',
      icon: FileText,
      color: 'text-blue-500 bg-blue-500/10',
      description: 'Kutilayotgan yangi sotuvchilar ro\'yxati',
    },
    {
      id: 'inquiries',
      title: 'Yangi murojaatlar',
      count: counts.inquiries ?? 0,
      href: '/admin/inquiries',
      icon: Inbox,
      color: 'text-emerald-500 bg-emerald-500/10',
      description: 'Aloqa bo\'limidan kelgan yangi xabarlar',
    },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
        title="Bildirishnomalar">
        <Bell className="size-4" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground shadow-sm animate-pulse">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                <h4 className="text-sm font-bold">Bildirishnomalar</h4>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {total > 0 ? `${total} ta muhim holat` : 'Hammasi tinch'}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {total === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-foreground">Hozirda yangi signallar yo&apos;q</p>
                  <p className="text-[0.7rem] text-muted-foreground mt-0.5">Barcha buyurtma va arizalar ko&apos;rib chiqilgan</p>
                </div>
              ) : (
                notifications
                  .filter((n) => n.count > 0)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-muted/60">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                          <Icon className="size-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-bold text-primary-foreground">
                              {item.count}
                            </span>
                          </div>
                          <p className="text-[0.7rem] text-muted-foreground truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground/60 shrink-0" />
                      </Link>
                    );
                  })
              )}
            </div>

            <div className="border-t border-border bg-muted/40 p-2 text-center">
              <Link
                href="/admin/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-primary hover:underline">
                Barcha xabarnomalarni ko&apos;rish →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

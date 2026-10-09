'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Building2,
  DollarSign,
  KeyRound,
  Receipt,
  Search,
  ShieldAlert,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { EconomicsCalculator } from '@/components/admin/settings/economics-calculator';
import { OfertaPdfManager } from '@/components/admin/settings/oferta-pdf-manager';
import { SettingCard } from '@/components/admin/settings/setting-card';
import {
  HIDDEN_FROM_GRID_KEYS,
  SETTINGS_METADATA,
} from '@/components/admin/settings/settings-metadata';
import { SoliqEimzoManager } from '@/components/admin/settings/soliq-eimzo-manager';
import {
  Setting,
  SettingsTab,
  SoliqStatus,
} from '@/components/admin/settings/types';
import { Button } from '@/components/ui/button';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';

const EMPTY_SETTINGS: Setting[] = [];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('finance');
  const [searchQuery, setSearchQuery] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const { data: soliqStatus } = useQuery<SoliqStatus>({
    queryKey: ['admin', 'soliq', 'status'],
    queryFn: async () => (await api.get('/admin/settings/soliq/status')).data,
    staleTime: 30_000,
  });

  const { data, isLoading, isError, error, refetch } = useQuery<Setting[]>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => (await api.get('/admin/settings')).data,
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      key,
      value,
      force,
    }: {
      key: string;
      value: string;
      force?: boolean;
    }) => {
      const res = await api.put(`/admin/settings/${key}`, force ? { value, force } : { value });
      return res.data;
    },
    onSuccess: (updated: Setting) => {
      toast.success(`Sozlama saqlandi: ${updated.key}`);
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setEditing((prev) => {
        const next = { ...prev };
        delete next[updated.key];
        return next;
      });
    },
    onError: (err: unknown, vars) => {
      const msg = extractErrorMessage(err);
      const isWarn = msg.toLowerCase().includes('ogohlantirish');
      if (isWarn) {
        const { key, value } = vars;
        if (window.confirm(`${msg}\n\nBaribir saqlashni tasdiqlaysizmi?`)) {
          saveMutation.mutate({ key, value, force: true });
        }
      } else {
        toast.error(msg);
      }
    },
  });

  const settingsList = data ?? EMPTY_SETTINGS;

  const tabItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return settingsList.filter((s) => {
      if (HIDDEN_FROM_GRID_KEYS.has(s.key)) return false;

      const meta = SETTINGS_METADATA[s.key];
      if (!meta) return false;

      if (q) {
        const matchLabel = (meta.label || s.key).toLowerCase().includes(q);
        const matchDesc = (s.description || meta.hint || '').toLowerCase().includes(q);
        const matchKey = s.key.toLowerCase().includes(q);
        return matchLabel || matchDesc || matchKey;
      }
      return meta.tab === activeTab;
    });
  }, [settingsList, activeTab, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="size-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">
          Tizim sozlamalari yuklanmoqda…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-sm font-medium text-destructive">{extractErrorMessage(error)}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Qayta urinish
        </Button>
      </div>
    );
  }

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType; count: number }[] = [
    {
      id: 'finance',
      label: 'Moliya & Komissiyalar',
      icon: DollarSign,
      count: settingsList.filter(
        (s) => !HIDDEN_FROM_GRID_KEYS.has(s.key) && SETTINGS_METADATA[s.key]?.tab === 'finance',
      ).length,
    },
    {
      id: 'legal',
      label: 'Yuridik & Soliq (E-IMZO)',
      icon: Building2,
      count: settingsList.filter(
        (s) => !HIDDEN_FROM_GRID_KEYS.has(s.key) && SETTINGS_METADATA[s.key]?.tab === 'legal',
      ).length,
    },
    {
      id: 'fiscal',
      label: 'Fiskal & Cheklar',
      icon: Receipt,
      count: settingsList.filter(
        (s) => !HIDDEN_FROM_GRID_KEYS.has(s.key) && SETTINGS_METADATA[s.key]?.tab === 'fiscal',
      ).length,
    },
    {
      id: 'risk',
      label: 'Anti-Fraud & Xavfsizlik',
      icon: ShieldAlert,
      count: settingsList.filter(
        (s) => !HIDDEN_FROM_GRID_KEYS.has(s.key) && SETTINGS_METADATA[s.key]?.tab === 'risk',
      ).length,
    },
    {
      id: 'inventory',
      label: 'Ombor & Mahsulotlar',
      icon: Boxes,
      count: settingsList.filter(
        (s) => !HIDDEN_FROM_GRID_KEYS.has(s.key) && SETTINGS_METADATA[s.key]?.tab === 'inventory',
      ).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tizim Sozlamalari"
        description="Platforma komissiyalari, soliq va E-IMZO integratsiyasi, fiskallash va xavfsizlik chegaralari"
        breadcrumbs={[{ label: 'Sozlamalar' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Sozlamalardan qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-60 rounded-xl border border-border bg-card pl-9 pr-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        }
      />

      {/* Missing E-IMZO Key Alert Banner */}
      {!soliqStatus?.hasKey && !searchQuery && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-600 dark:text-amber-400 shrink-0">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  <span>MChJ E-IMZO kaliti yuklanmagan</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.62rem] font-bold text-amber-700 dark:text-amber-300">
                    Amal talab etiladi
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Yangi sotuvchilar STIR ma&apos;lumotlarini Davlat Soliq bazasidan avtomatik
                  tekshirish uchun &quot;Yuridik &amp; Soliq (E-IMZO)&quot; bo&apos;limiga kiring va
                  kalitni yuklang.
                </p>
              </div>
            </div>
            {activeTab !== 'legal' && (
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveTab('legal')}
                className="gap-1.5 font-bold text-xs shrink-0 rounded-xl shadow-xs">
                <KeyRound className="size-3.5" />
                Kalitni yuklash →
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Segmented Tab Navigation */}
      {!searchQuery && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}>
                <Icon className="size-4" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-[0.62rem] font-bold',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Special Contextual Widgets */}
      {activeTab === 'finance' && !searchQuery && (
        <EconomicsCalculator commissionDraft={editing.commission_rate_default} />
      )}

      {activeTab === 'legal' && !searchQuery && (
        <>
          <OfertaPdfManager />
          <SoliqEimzoManager />
        </>
      )}

      {/* Settings Grid Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {tabItems.map((s) => {
          const meta = SETTINGS_METADATA[s.key];
          const val = editing[s.key] ?? s.value;
          const dirty = editing[s.key] !== undefined;
          const isRevealed = Boolean(showSecret[s.key]);

          return (
            <SettingCard
              key={s.key}
              setting={s}
              meta={meta}
              value={val}
              isDirty={dirty}
              isSecretRevealed={isRevealed}
              isSavePending={saveMutation.isPending}
              onValueChange={(newVal) =>
                setEditing((prev) => ({ ...prev, [s.key]: newVal }))
              }
              onToggleSecret={() =>
                setShowSecret((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
              }
              onSave={() => saveMutation.mutate({ key: s.key, value: val })}
            />
          );
        })}
      </div>
    </div>
  );
}

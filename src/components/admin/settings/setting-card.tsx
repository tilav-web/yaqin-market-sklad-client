'use client';

import React from 'react';
import { Eye, EyeOff, HelpCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { Setting, SettingMeta } from './types';

export interface SettingCardProps {
  setting: Setting;
  meta?: SettingMeta;
  value: string;
  isDirty: boolean;
  isSecretRevealed: boolean;
  isSavePending: boolean;
  onValueChange: (newValue: string) => void;
  onToggleSecret: () => void;
  onSave: () => void;
}

export function SettingCard({
  setting,
  meta,
  value,
  isDirty,
  isSecretRevealed,
  isSavePending,
  onValueChange,
  onToggleSecret,
  onSave,
}: SettingCardProps) {
  const Icon = meta?.icon || HelpCircle;
  const label = meta?.label || setting.key;
  const category = meta?.category || 'Tizim Parametri';
  const hint = meta?.hint || setting.description || 'Platforma konfiguratsiyasi.';
  const isSecret = meta?.isSecret;

  return (
    <Card
      className={cn(
        'flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-xs',
        isDirty
          ? 'border-primary/50 bg-primary/[0.02] shadow-md'
          : 'border-border/80 bg-card hover:border-border',
      )}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                {category}
              </p>
              <h4 className="text-sm font-bold text-foreground">
                {label}
              </h4>
            </div>
          </div>
          {isDirty && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
              O&apos;zgardi
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          {hint}
        </p>
      </div>

      {/* Form Input Row */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {meta?.options ? (
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}>
              {meta.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : isSecret ? (
            <div className="relative flex items-center">
              <input
                type={isSecretRevealed ? 'text' : 'password'}
                className="w-full rounded-xl border border-border bg-background pl-3 pr-8 py-2 text-xs font-mono font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                placeholder="Kalit kiritilmagan"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
              />
              <button
                type="button"
                onClick={onToggleSecret}
                className="absolute right-2 text-muted-foreground hover:text-foreground">
                {isSecretRevealed ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="relative flex items-center">
              <input
                type="number"
                min={meta?.min ?? 0}
                max={meta?.max}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
              />
              {meta?.unit && (
                <span className="absolute right-3 text-[0.7rem] font-bold text-muted-foreground pointer-events-none">
                  {meta.unit}
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          size="sm"
          disabled={!isDirty || isSavePending}
          onClick={onSave}
          className="h-9 gap-1.5 rounded-xl px-3.5 text-xs font-bold shrink-0">
          <Save className="size-3.5" />
          Saqlash
        </Button>
      </div>
    </Card>
  );
}

'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { cyrillicToLatin, latinToCyrillic } from '@/lib/transliteration';

export interface I18nValue {
  uz: string;
  kr?: string;
  ru?: string;
}

interface I18nInputProps {
  value: I18nValue;
  onChange: (value: { uz: string; kr: string; ru: string }) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  label?: string;
  className?: string;
}

export function I18nInput({
  value,
  onChange,
  placeholder = '',
  required = false,
  multiline = false,
  rows = 3,
  label,
  className,
}: I18nInputProps) {
  const [activeLang, setActiveLang] = useState<'uz' | 'kr' | 'ru'>('uz');
  const [autoTranslit, setAutoTranslit] = useState(true);

  const uz = value.uz || '';
  const kr = value.kr || '';
  const ru = value.ru || '';

  const handleUzChange = (newUz: string) => {
    const newKr = autoTranslit ? latinToCyrillic(newUz) : kr;
    onChange({ uz: newUz, kr: newKr, ru });
  };

  const handleKrChange = (newKr: string) => {
    const newUz = autoTranslit ? cyrillicToLatin(newKr) : uz;
    onChange({ uz: newUz, kr: newKr, ru });
  };

  const handleRuChange = (newRu: string) => {
    onChange({ uz, kr, ru: newRu });
  };

  return (
    <div className={cn('space-y-1.5 text-xs', className)}>
      {/* Top Header with Language Tabs */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="font-semibold text-foreground flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-primary">*</span>}
          </label>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* Language Switcher Badges */}
          <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-[0.65rem] font-medium">
            <button
              type="button"
              onClick={() => setActiveLang('uz')}
              className={cn(
                'px-2 py-0.5 rounded-md transition-colors',
                activeLang === 'uz'
                  ? 'bg-background text-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              🇺🇿 Lotin
            </button>
            <button
              type="button"
              onClick={() => setActiveLang('kr')}
              className={cn(
                'px-2 py-0.5 rounded-md transition-colors',
                activeLang === 'kr'
                  ? 'bg-background text-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              🇺🇿 Кирилл
            </button>
            <button
              type="button"
              onClick={() => setActiveLang('ru')}
              className={cn(
                'px-2 py-0.5 rounded-md transition-colors',
                activeLang === 'ru'
                  ? 'bg-background text-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              🇷🇺 Русский
            </button>
          </div>

          {/* Auto Transliteration Indicator */}
          {activeLang !== 'ru' && (
            <button
              type="button"
              onClick={() => setAutoTranslit(!autoTranslit)}
              title={autoTranslit ? 'Avtomatik transliteratsiya yoqilgan' : 'Avtomatik transliteratsiya o\'chiq'}
              className={cn(
                'p-1 rounded-md border text-[0.65rem] flex items-center gap-1 transition-colors',
                autoTranslit
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted border-border text-muted-foreground',
              )}>
              <Sparkles className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Input / Textarea for active language */}
      <div>
        {activeLang === 'uz' && (
          <div>
            {multiline ? (
              <textarea
                value={uz}
                onChange={(e) => handleUzChange(e.target.value)}
                placeholder={placeholder || "O'zbekcha (Lotin) kiritish…"}
                required={required}
                rows={rows}
                className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            ) : (
              <Input
                value={uz}
                onChange={(e) => handleUzChange(e.target.value)}
                placeholder={placeholder || "O'zbekcha (Lotin) kiritish…"}
                required={required}
                className="h-8.5 text-xs"
              />
            )}
          </div>
        )}

        {activeLang === 'kr' && (
          <div>
            {multiline ? (
              <textarea
                value={kr}
                onChange={(e) => handleKrChange(e.target.value)}
                placeholder={placeholder || 'Ўзбекча (Кирилл) киритиш…'}
                rows={rows}
                className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            ) : (
              <Input
                value={kr}
                onChange={(e) => handleKrChange(e.target.value)}
                placeholder={placeholder || 'Ўзбекча (Кирилл) киритиш…'}
                className="h-8.5 text-xs"
              />
            )}
          </div>
        )}

        {activeLang === 'ru' && (
          <div>
            {multiline ? (
              <textarea
                value={ru}
                onChange={(e) => handleRuChange(e.target.value)}
                placeholder={placeholder || 'Русский текст…'}
                rows={rows}
                className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            ) : (
              <Input
                value={ru}
                onChange={(e) => handleRuChange(e.target.value)}
                placeholder={placeholder || 'Русский текст…'}
                className="h-8.5 text-xs"
              />
            )}
          </div>
        )}
      </div>

      {/* Language completion indicator */}
      <div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
        <span className={cn('flex items-center gap-1', uz ? 'text-emerald-500 font-medium' : '')}>
          • Lotin: {uz ? 'kiritildi' : "bo'sh"}
        </span>
        <span className={cn('flex items-center gap-1', kr ? 'text-emerald-500 font-medium' : '')}>
          • Кирилл: {kr ? 'kiritildi' : "bo'sh"}
        </span>
        <span className={cn('flex items-center gap-1', ru ? 'text-emerald-500 font-medium' : '')}>
          • Русский: {ru ? 'kiritildi' : "bo'sh"}
        </span>
      </div>
    </div>
  );
}

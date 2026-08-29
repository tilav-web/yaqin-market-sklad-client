'use client';

import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

export interface SearchSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  onCreateNew?: (searchQuery: string) => void;
  createNewLabel?: string;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Tanlang…',
  searchPlaceholder = 'Qidirish…',
  emptyText = 'Topilmadi',
  disabled = false,
  allowClear = true,
  className,
  onCreateNew,
  createNewLabel = 'Yangi qo\'shish',
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase())) ||
      (o.badge && o.badge.toLowerCase().includes(search.toLowerCase())),
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full text-xs', className)}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs transition-colors cursor-pointer',
          isOpen && 'border-primary ring-1 ring-primary/30',
          disabled && 'cursor-not-allowed opacity-50 bg-muted',
        )}>
        <div className="flex-1 truncate">
          {selectedOption ? (
            <span className="font-medium text-foreground">
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="ml-1.5 text-muted-foreground text-[0.7rem]">
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
          <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[220px] rounded-lg border border-border bg-card p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95">
          {/* Search Box */}
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <input
              id={searchInputId}
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-7.5 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-2.5 text-center text-xs text-muted-foreground">{emptyText}</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(opt.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(opt.value);
                      }
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted',
                    )}>
                    <div className="min-w-0 flex-1 truncate">
                      <p className="truncate leading-tight">{opt.label}</p>
                      {opt.sublabel && (
                        <p className="truncate text-[0.65rem] text-muted-foreground">{opt.sublabel}</p>
                      )}
                    </div>
                    {opt.badge && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="size-3.5 ml-2 text-primary shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Create New Trigger (Red Underline) */}
          {onCreateNew && (
            <div className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew(search.trim());
                }}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-primary font-semibold underline underline-offset-2 hover:bg-primary/10 transition-colors">
                <Plus className="size-3.5 shrink-0" />
                <span className="truncate">
                  {search.trim() ? `+ "${search.trim()}" yangi qo'shish` : `+ ${createNewLabel}`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

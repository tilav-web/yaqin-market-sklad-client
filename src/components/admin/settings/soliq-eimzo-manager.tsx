'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCode,
  KeyRound,
  RefreshCw,
  Save,
  ShieldCheck,
  Upload,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast';
import { SoliqStatus } from './types';

export function SoliqEimzoManager() {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [operatorTin, setOperatorTin] = useState('313296455');
  const [manualToken, setManualToken] = useState('');
  const [testTin, setTestTin] = useState('313296455');
  const [uploading, setUploading] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: unknown;
  } | null>(null);

  const { data: status, refetch: refetchStatus } = useQuery<SoliqStatus>({
    queryKey: ['admin', 'soliq', 'status'],
    queryFn: async () => (await api.get('/admin/settings/soliq/status')).data,
  });

  const handleUploadKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Iltimos, E-IMZO (.pfx / .p12) kalit faylini tanlang');
      return;
    }
    if (!password) {
      toast.error('Kalit parolini kiriting');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      if (operatorTin) formData.append('operatorTin', operatorTin);

      const res = await api.post('/admin/settings/soliq/upload-key', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message || 'Kalit muvaffaqiyatli yuklandi');
      setFile(null);
      setPassword('');
      refetchStatus();
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'soliq', 'status'] });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveToken = async () => {
    if (!manualToken.trim()) {
      toast.error("Token bo'sh bo'lishi mumkin emas");
      return;
    }
    setSavingToken(true);
    try {
      const res = await api.post('/admin/settings/soliq/set-token', {
        token: manualToken,
      });
      toast.success(res.data.message || 'Token saqlandi');
      setManualToken('');
      refetchStatus();
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'soliq', 'status'] });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingToken(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.get('/admin/settings/soliq/test', {
        params: { tin: testTin },
      });
      setTestResult(res.data);
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      const msg = extractErrorMessage(err);
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Status Overview Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-foreground">
                  Davlat Soliq (my.soliq.uz) &amp; E-IMZO Integratsiyasi
                </h4>
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[0.68rem] font-bold">
                  Operator: &quot;TILAV&quot; MCHJ ({status?.operatorTin || '313296455'})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Yangi sotuvchilar (do&apos;konlar) ro&apos;yxatdan o&apos;tganda ularning STIR ma&apos;lumotlarini Davlat Soliq bazasidan
                to&apos;g&apos;ridan-to&apos;g&apos;ri MChJ E-IMZO kaliti orqali bepul va avtomatik tekshirish tizimi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <input
              type="text"
              value={testTin}
              onChange={(e) => setTestTin(e.target.value)}
              placeholder="STIR (313296455)"
              className="h-9 w-32 rounded-xl border border-border bg-background px-2.5 text-xs font-mono font-medium outline-none focus:border-primary/50"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={testing}
              onClick={runTest}
              className="h-9 gap-1.5 rounded-xl border-border px-3 text-xs font-semibold">
              <RefreshCw
                className={cn('size-3.5', testing && 'animate-spin')}
              />
              Ulanishni tekshirish
            </Button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border',
              status?.hasKey
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            )}>
            {status?.hasKey ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <AlertTriangle className="size-3.5" />
            )}
            {status?.hasKey
              ? `E-IMZO Kaliti: Yuklangan (${status.keyFileName} • ${(status.keyFileSize / 1024).toFixed(1)} KB)`
              : 'E-IMZO Kaliti: Yuklanmagan'}
          </span>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border',
              status?.hasPassword
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border',
            )}>
            <ShieldCheck className="size-3.5" />
            {status?.hasPassword
              ? 'Kalit Paroli: Saqlangan (AES-256 shifrlangan)'
              : 'Kalit Paroli: Kiritilmagan'}
          </span>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border',
              status?.hasToken && !status?.isTokenExpired
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-primary/10 text-primary border-primary/20',
            )}>
            <Zap className="size-3.5" />
            {status?.hasToken && !status?.isTokenExpired
              ? `Jonli Sessiya: Faol (${status.tokenPreview})`
              : 'Soliq Integratsiyasi: Tayyor & Faol'}
          </span>
        </div>

        {/* Official E-IMZO State Certificate Passport */}
        {status?.certificate && (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15 mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Davlat E-IMZO Sertifikati (Rasmiy Pasport)
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Check className="size-3" /> Yuridik Tasdiqlangan (Faol)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-background/80 p-2.5 border border-border/60">
                <span className="text-[10px] font-medium text-muted-foreground block">Tashkilot nomi</span>
                <span className="font-bold text-foreground truncate block">
                  {status.certificate.companyName}
                </span>
              </div>
              <div className="rounded-xl bg-background/80 p-2.5 border border-border/60">
                <span className="text-[10px] font-medium text-muted-foreground block">Rahbar (Direktor)</span>
                <span className="font-bold text-foreground truncate block">
                  {status.certificate.directorName}
                </span>
              </div>
              <div className="rounded-xl bg-background/80 p-2.5 border border-border/60">
                <span className="text-[10px] font-medium text-muted-foreground block">STIR (INN)</span>
                <span className="font-mono font-bold text-foreground">
                  {status.certificate.tin}
                </span>
              </div>
              <div className="rounded-xl bg-background/80 p-2.5 border border-border/60">
                <span className="text-[10px] font-medium text-muted-foreground block">JShShIR (PINFL)</span>
                <span className="font-mono font-bold text-foreground">
                  {status.certificate.pinfl}
                </span>
              </div>
              <div className="rounded-xl bg-background/80 p-2.5 border border-border/60 sm:col-span-2">
                <span className="text-[10px] font-medium text-muted-foreground block">Yuridik manzil</span>
                <span className="font-medium text-foreground">
                  {status.certificate.region}
                </span>
              </div>
              <div className="rounded-xl bg-background/80 p-2.5 border border-border/60 sm:col-span-2">
                <span className="text-[10px] font-medium text-muted-foreground block">Amal qilish muddati</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {status.certificate.validFrom} — {status.certificate.validTo}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Test Result Display */}
        {testResult && (
          <div
            className={cn(
              'mt-4 rounded-2xl p-4 text-xs border transition-all shadow-xs',
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                : 'bg-destructive/10 border-destructive/20 text-destructive',
            )}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {testResult.success ? (
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="size-5 text-destructive shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>

            {testResult.success && Boolean(testResult.data) && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-500/20 text-xs">
                <div className="bg-background/80 rounded-xl p-2.5 border border-emerald-500/10">
                  <span className="text-[10px] text-muted-foreground block font-medium">Korxona nomi</span>
                  <span className="font-bold text-foreground truncate block">
                    {((testResult.data as Record<string, unknown>).companyName as string) || '"TILAV" MCHJ'}
                  </span>
                </div>
                <div className="bg-background/80 rounded-xl p-2.5 border border-emerald-500/10">
                  <span className="text-[10px] text-muted-foreground block font-medium">Tekshirilgan STIR</span>
                  <span className="font-bold font-mono text-foreground">
                    {((testResult.data as Record<string, unknown>).stir as string) || testTin}
                  </span>
                </div>
                <div className="bg-background/80 rounded-xl p-2.5 border border-emerald-500/10">
                  <span className="text-[10px] text-muted-foreground block font-medium">Tashkiliy shakli</span>
                  <span className="font-bold text-foreground">
                    {((testResult.data as Record<string, unknown>).entityType as string) || 'MChJ'}
                  </span>
                </div>
                <div className="bg-background/80 rounded-xl p-2.5 border border-emerald-500/10">
                  <span className="text-[10px] text-muted-foreground block font-medium">Serverdagi Kalit</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {((testResult.data as Record<string, unknown>).keyFileName as string) || 'soliq_eimzo_key.pfx'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Key Upload and Token Management Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Form A: Upload .pfx Key and Password */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <FileCode className="size-4 text-primary" />
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  1. MChJ E-IMZO Kalitini Yuklash
                </h5>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Asosiy
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O&apos;zingizning MChJ nomidagi E-IMZO kalit faylini (.pfx / .p12) va uning parolini kiriting.
              Fayl serverda xavfsiz papkada saqlanadi, paroli esa AES-256-GCM algoritmi bilan shifrlanadi.
            </p>

            <form onSubmit={handleUploadKey} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  E-IMZO Kalit Fayli (.pfx / .p12)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="eimzo-file-input"
                    accept=".pfx,.p12"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                {file && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Tanlangan fayl: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                    Kalit Paroli
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Kalit paroli..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs outline-none focus:border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                      {showPassword ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                    Operator STIRi
                  </label>
                  <input
                    type="text"
                    placeholder="313296455"
                    value={operatorTin}
                    onChange={(e) => setOperatorTin(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={uploading || !file || !password}
                className="w-full h-10 rounded-xl gap-2 text-xs font-bold shadow-xs">
                <Upload className="size-4" />
                {uploading ? 'Yuklanmoqda...' : 'Kalit va Parolni Saqlash'}
              </Button>
            </form>
          </div>
        </div>

        {/* Form B: Update Soliq Session Token */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  2. Soliq Sessiya Tokeni (Ixtiyoriy)
                </h5>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                Majburiy emas
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              E-IMZO kalitingiz allaqachon serverga yuklangan va tizim sotuvchilar STIRini avtomatik tekshirishga tayyor. Ushbu Bearer token faqatgina my.soliq.uz bilan jonli sessiya bog&apos;lash uchun ixtiyoriy qo&apos;shimcha hisoblanadi. Kiritmasangiz ham tizim to&apos;liq ishlaydi.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  Soliq Bearer Token
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono outline-none focus:border-primary/50 custom-scrollbar resize-none"
                />
              </div>

              {status?.hasToken && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 rounded-xl px-3 py-1.5">
                  <span>Joriy token: {status.tokenPreview}</span>
                  <span>Muddati: {status.tokenExpiresAt?.slice(0, 10) || 'Faol'}</span>
                </div>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={savingToken || !manualToken.trim()}
                onClick={handleSaveToken}
                className="w-full h-10 rounded-xl gap-1.5 text-xs font-semibold">
                <Save className="size-3.5" />
                {savingToken ? 'Saqlanmoqda...' : 'Tokenni Yangilash'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

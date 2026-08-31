'use client';

import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, KeyRound, Lock, Phone, ShieldCheck, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { api, extractErrorMessage, tokenStore } from '@/lib/api';

type Stage = 'login' | 'forgot_request' | 'forgot_reset';

export default function LoginPage() {
  const router = useRouter();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [stage, setStage] = useState<Stage>('login');
  const [identifier, setIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{
        admin: { id: string; username: string; role: string; firstName: string; lastName: string };
        tokens: { accessToken: string; refreshToken: string };
      }>('/admin/auth/login', {
        username: username.trim(),
        password,
      });
      return res.data;
    },
    onSuccess: (data) => {
      tokenStore.save(data.tokens.accessToken, data.tokens.refreshToken);
      router.replace('/admin/dashboard');
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  // Forgot Password Request OTP Mutation
  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{
        success: boolean;
        message: string;
        maskedPhone: string;
      }>('/admin/auth/forgot-password/request', {
        identifier: identifier.trim(),
      });
      return res.data;
    },
    onSuccess: (data) => {
      setMaskedPhone(data.maskedPhone);
      setStage('forgot_reset');
      setError(null);
      setSuccessMsg(data.message);
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) {
        throw new Error('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Yangi parollar bir-biriga mos kelmadi');
      }
      const res = await api.post<{ success: boolean; message: string }>(
        '/admin/auth/forgot-password/reset',
        {
          identifier: identifier.trim(),
          code: resetCode.trim(),
          newPassword,
        },
      );
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message);
      setStage('login');
      setError(null);
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    loginMutation.mutate();
  };

  const handleRequestOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    requestOtpMutation.mutate();
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    resetPasswordMutation.mutate();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background p-6 text-foreground selection:bg-primary selection:text-primary-foreground overflow-hidden">
      {/* Brand ambient lights (Yaqin Market Red / Crimson theme) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md p-8 bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl">
        {/* Brand Logo & Header */}
        <div className="mb-6 flex items-center gap-3.5">
          <div className="size-12 rounded-2xl overflow-hidden shadow-lg border border-primary/20 bg-card p-1.5 flex items-center justify-center relative">
            <Image
              src="/logo.png"
              alt="Yaqin Market"
              fill
              className="object-contain p-1.5"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">
                Yaqin<span className="text-primary">Market</span>
              </h1>
              <span className="text-[0.62rem] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                Admin
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Boshqaruv va xodimlar paneli</p>
          </div>
        </div>

        {/* Global Notifications */}
        {error ? (
          <div className="mb-5 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive font-medium animate-in fade-in">
            {error}
          </div>
        ) : null}

        {successMsg ? (
          <div className="mb-5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium animate-in fade-in flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : null}

        {/* STAGE 1: Standard Username + Password Login */}
        {stage === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superadmin"
                  autoFocus
                  required
                  className="pl-9 bg-background/80 border-input focus-visible:border-primary focus-visible:ring-primary/20 text-foreground placeholder:text-muted-foreground h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Parol
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStage('forgot_request');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                  Parolni unutdingizmi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-9 pr-10 bg-background/80 border-input focus-visible:border-primary focus-visible:ring-primary/20 text-foreground placeholder:text-muted-foreground h-10 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 rounded-lg shadow-lg shadow-primary/25 mt-2 transition-all text-xs"
              disabled={!username.trim() || !password || loginMutation.isPending}>
              {loginMutation.isPending ? 'Kirilmoqda…' : 'Tizimga kirish'}
            </Button>
          </form>
        )}

        {/* STAGE 2: Forgot Password - Request SMS OTP */}
        {stage === 'forgot_request' && (
          <form onSubmit={handleRequestOtpSubmit} className="space-y-4">
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-primary">
              Profilga biriktirilgan <strong>Username</strong> yoki <strong>Telefon raqamingizni</strong> kiriting. Sizga parolni tiklash uchun SMS kod yuboriladi.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Username yoki Telefon
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="superadmin yoki +998901234567"
                  autoFocus
                  required
                  className="pl-9 bg-background/80 border-input focus-visible:border-primary focus-visible:ring-primary/20 text-foreground placeholder:text-muted-foreground h-10 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 rounded-lg shadow-lg shadow-primary/25 text-xs"
              disabled={!identifier.trim() || requestOtpMutation.isPending}>
              {requestOtpMutation.isPending ? 'SMS yuborilmoqda…' : 'SMS tasdiq kodini olish'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground text-xs"
              onClick={() => {
                setStage('login');
                setError(null);
                setSuccessMsg(null);
              }}>
              Orqaga (Kirish oynasiga)
            </Button>
          </form>
        )}

        {/* STAGE 3: Forgot Password - Verify OTP & Set New Password */}
        {stage === 'forgot_reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="rounded-lg bg-muted/60 border border-border p-3 text-xs text-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-primary font-semibold">
                <Phone className="size-3.5" />
                <span>SMS yuborildi</span>
              </div>
              <p className="text-muted-foreground text-[0.7rem]">Raqam: {maskedPhone || identifier}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                6 xonali SMS kod
              </label>
              <InputOTP
                maxLength={6}
                value={resetCode}
                onChange={setResetCode}
                inputMode="numeric"
                autoFocus
                containerClassName="justify-center">
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="border-border bg-background text-foreground text-base" />
                  <InputOTPSlot index={1} className="border-border bg-background text-foreground text-base" />
                  <InputOTPSlot index={2} className="border-border bg-background text-foreground text-base" />
                  <InputOTPSlot index={3} className="border-border bg-background text-foreground text-base" />
                  <InputOTPSlot index={4} className="border-border bg-background text-foreground text-base" />
                  <InputOTPSlot index={5} className="border-border bg-background text-foreground text-base" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Yangi Parol
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  required
                  className="pl-9 pr-10 bg-background/80 border-input focus-visible:border-primary focus-visible:ring-primary/20 text-foreground placeholder:text-muted-foreground h-10 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Yangi Parolni Tasdiqlang
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Parolni qayta kiriting"
                  required
                  className="pl-9 bg-background/80 border-input focus-visible:border-primary focus-visible:ring-primary/20 text-foreground placeholder:text-muted-foreground h-10 text-xs font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 rounded-lg shadow-lg shadow-primary/25 text-xs"
              disabled={resetCode.length !== 6 || !newPassword || resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? 'Yangilanmoqda…' : 'Parolni yangilash va kirish'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground text-xs"
              onClick={() => {
                setStage('forgot_request');
                setError(null);
              }}>
              Boshqa raqam/username kiritish
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}

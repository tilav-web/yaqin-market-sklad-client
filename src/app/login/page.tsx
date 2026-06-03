'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage, tokenStore } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState<string | null>(null);

  const requestOtp = useMutation({
    mutationFn: async () => {
      await api.post('/auth/request-otp', { phone: `+998${phone.replace(/\D/g, '')}` });
    },
    onSuccess: () => setStage('otp'),
    onError: (e) => setError(extractErrorMessage(e)),
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/verify-otp',
        { phone: `+998${phone.replace(/\D/g, '')}`, code },
      );
      tokenStore.save(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    },
    onSuccess: () => router.replace('/admin/applications'),
    onError: (e) => setError(extractErrorMessage(e)),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-xl font-extrabold text-primary-foreground shadow-sm">
            Y
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Yaqin Market</h1>
            <p className="text-xs text-muted-foreground">Admin panel</p>
          </div>
        </div>

        {stage === 'phone' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Telefon raqam</label>
              <div className="flex gap-2">
                <div className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 text-sm font-semibold text-foreground">
                  +998
                </div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="90 123 45 67"
                  autoFocus
                  inputMode="tel"
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              className="w-full"
              disabled={phone.replace(/\D/g, '').length !== 9 || requestOtp.isPending}
              onClick={() => {
                setError(null);
                requestOtp.mutate();
              }}>
              {requestOtp.isPending ? 'Yuborilmoqda…' : 'OTP yuborish'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tasdiq kodi</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                autoFocus
                inputMode="numeric"
                className="h-12 text-center text-2xl font-bold tracking-[0.3em]"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              className="w-full"
              disabled={code.length !== 6 || verifyOtp.isPending}
              onClick={() => {
                setError(null);
                verifyOtp.mutate();
              }}>
              {verifyOtp.isPending ? 'Tekshirilmoqda…' : 'Kirish'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setStage('phone');
                setCode('');
                setError(null);
              }}>
              Telefon raqamni o&apos;zgartirish
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}

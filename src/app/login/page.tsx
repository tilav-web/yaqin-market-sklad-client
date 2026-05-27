'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-md border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#0046AD] border-4 border-[#E1251B] flex items-center justify-center text-white font-extrabold text-xl">
            Y
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0046AD]">Yaqin Market</h1>
            <p className="text-xs text-slate-600">Admin panel</p>
          </div>
        </div>

        {stage === 'phone' ? (
          <>
            <label className="block text-sm font-semibold mb-2">Telefon raqam</label>
            <div className="flex gap-2 mb-4">
              <div className="px-3 py-3 bg-slate-100 rounded-md font-semibold border border-slate-200">
                +998
              </div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="90 123 45 67"
                className="flex-1 px-4 py-3 rounded-md bg-slate-50 border border-slate-200 text-lg"
                autoFocus
                inputMode="tel"
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button
              disabled={phone.replace(/\D/g, '').length !== 9 || requestOtp.isPending}
              onClick={() => {
                setError(null);
                requestOtp.mutate();
              }}
              className="w-full bg-[#0046AD] text-white font-bold py-3 rounded-md disabled:opacity-50">
              {requestOtp.isPending ? 'Yuborilmoqda…' : 'OTP yuborish'}
            </button>
          </>
        ) : (
          <>
            <label className="block text-sm font-semibold mb-2">Tasdiq kodi</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 text-2xl tracking-widest text-center font-bold mb-4"
              autoFocus
              inputMode="numeric"
            />
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button
              disabled={code.length !== 6 || verifyOtp.isPending}
              onClick={() => {
                setError(null);
                verifyOtp.mutate();
              }}
              className="w-full bg-[#E1251B] text-white font-bold py-3 rounded-md disabled:opacity-50">
              {verifyOtp.isPending ? 'Tekshirilmoqda…' : 'Kirish'}
            </button>
            <button
              onClick={() => {
                setStage('phone');
                setCode('');
                setError(null);
              }}
              className="w-full text-slate-600 text-sm py-2 mt-2">
              Telefon raqamni o&apos;zgartirish
            </button>
          </>
        )}
      </div>
    </main>
  );
}

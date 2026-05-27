'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { api, extractErrorMessage } from '@/lib/api';

interface SellerApplication {
  id: string;
  shopName: string;
  shopAddress: string;
  shopLatitude: number;
  shopLongitude: number;
  shopPhotos: string[];
  stir: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
  };
}

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const appsQuery = useQuery({
    queryKey: ['admin', 'applications', filter],
    queryFn: async () => {
      const res = await api.get<SellerApplication[]>('/sellers/admin/applications', {
        params: filter === 'all' ? {} : { status: filter },
      });
      return res.data;
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/sellers/admin/applications/${id}/approve`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'applications'] }),
    onError: (e) => alert(extractErrorMessage(e)),
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.post(`/sellers/admin/applications/${id}/reject`, { reason });
    },
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
    },
    onError: (e) => alert(extractErrorMessage(e)),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1 text-[#0046AD]">Seller arizalari</h1>
      <p className="text-slate-600 text-sm mb-4">Sotuvchi bo&apos;lish arizalarini tasdiqlang yoki rad eting</p>

      <div className="flex gap-2 mb-4">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${
              filter === s ? 'bg-[#0046AD] text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}>
            {s === 'pending'
              ? 'Kutilmoqda'
              : s === 'approved'
                ? 'Tasdiqlandi'
                : s === 'rejected'
                  ? 'Rad etildi'
                  : 'Hammasi'}
          </button>
        ))}
      </div>

      {appsQuery.isLoading ? (
        <p>Yuklanmoqda...</p>
      ) : appsQuery.data && appsQuery.data.length > 0 ? (
        <div className="grid gap-4">
          {appsQuery.data.map((app) => (
            <div key={app.id} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                {app.shopPhotos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.shopPhotos[0]}
                    alt={app.shopName}
                    className="w-32 h-32 object-cover rounded-md bg-slate-100"
                  />
                ) : (
                  <div className="w-32 h-32 bg-slate-100 rounded-md flex items-center justify-center text-4xl">
                    🏪
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{app.shopName}</h2>
                      <p className="text-sm text-slate-600 mt-1">{app.shopAddress}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        📍 {app.shopLatitude.toFixed(5)}, {app.shopLongitude.toFixed(5)}
                      </p>
                      {app.stir && <p className="text-xs text-slate-500">STIR: {app.stir}</p>}
                      <p className="text-xs text-slate-500 mt-2">
                        Foydalanuvchi: {app.user.name ?? '—'} ({app.user.phone})
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(app.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        app.status === 'pending'
                          ? 'bg-amber-500'
                          : app.status === 'approved'
                            ? 'bg-green-500'
                            : 'bg-red-600'
                      }`}>
                      {app.status === 'pending'
                        ? 'Kutilmoqda'
                        : app.status === 'approved'
                          ? 'Tasdiqlandi'
                          : 'Rad etildi'}
                    </span>
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => approve.mutate(app.id)}
                        disabled={approve.isPending}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50">
                        ✓ Tasdiqlash
                      </button>
                      <button
                        onClick={() => setRejectingId(app.id)}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700">
                        ✗ Rad etish
                      </button>
                    </div>
                  )}

                  {app.status === 'rejected' && app.rejectionReason && (
                    <p className="mt-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                      Sabab: {app.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-600">Arizalar yo&apos;q</p>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-3">Arizani rad etish</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rad etish sababi"
              className="w-full p-3 border border-slate-300 rounded-md mb-3"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-slate-600">
                Bekor qilish
              </button>
              <button
                disabled={!rejectReason || reject.isPending}
                onClick={() => reject.mutate({ id: rejectingId, reason: rejectReason })}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50">
                Rad etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

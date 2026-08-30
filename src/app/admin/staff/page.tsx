'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  KeyRound,
  Pencil,
  Plus,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { AdminRole, MeAdmin, ROLE_LABELS } from '../layout';

interface StaffUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  role: AdminRole;
  isActive: boolean;
  isProtected: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface StaffListResponse {
  items: StaffUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function StaffManagementPage() {
  const qc = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<StaffUser | null>(null);
  const [resetPassUser, setResetPassUser] = useState<StaffUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Current admin query to check permissions
  const meQuery = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => (await api.get<MeAdmin>('/admin/auth/me')).data,
  });
  const isSuperAdmin = meQuery.data?.role === 'super_admin';

  // Staff List Query
  const staffQuery = useQuery({
    queryKey: ['admin', 'staff', { search, role: roleFilter, page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const res = await api.get<StaffListResponse>('/admin/staff', { params });
      return res.data;
    },
  });

  // Create Staff Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: {
      username: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      role: AdminRole;
    }) => {
      const res = await api.post('/admin/staff', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setCreateModalOpen(false);
      setSuccess('Yangi xodim muvaffaqiyatli qo\'shildi');
      setTimeout(() => setSuccess(null), 4000);
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  // Update Staff Mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { username?: string; firstName?: string; lastName?: string; phone?: string; email?: string; role?: AdminRole };
    }) => {
      const res = await api.patch(`/admin/staff/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
      qc.invalidateQueries({ queryKey: ['admin-auth', 'me'] });
      qc.invalidateQueries({ queryKey: ['admin', 'me'] });
      setEditModalUser(null);
      setSuccess('Xodim ma\'lumotlari yangilandi');
      setTimeout(() => setSuccess(null), 4000);
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/admin/staff/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: (e) => alert(extractErrorMessage(e)),
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await api.post(`/admin/staff/${id}/reset-password`, { newPassword });
      return res.data;
    },
    onSuccess: () => {
      setResetPassUser(null);
      setSuccess('Xodim paroli yangilandi');
      setTimeout(() => setSuccess(null), 4000);
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Platforma Xodimlari (Staff)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Admin panelga kiruvchi xodimlar, ularning rollari va xavfsizlik sozlamalari
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            onClick={() => {
              setError(null);
              setCreateModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-xs font-semibold h-9 rounded-lg">
            <Plus className="size-4 mr-1.5" /> Yangi Xodim Qo&apos;shish
          </Button>
        )}
      </div>

      {/* Global Alerts */}
      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-medium flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="p-3 bg-card border-border flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Username, ism yoki telefon bo'yicha qidirish…"
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">Barcha Rollar</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </Card>

      {/* Staff Table */}
      <Card className="bg-card border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[0.65rem] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Xodim</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Telefon / Aloqa</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Oxirgi Kirish</th>
                {isSuperAdmin && <th className="px-4 py-3 text-right">Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : staffQuery.data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Hech qanday xodim topilmadi.
                  </td>
                </tr>
              ) : (
                staffQuery.data?.items.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || { label: u.role, color: 'bg-muted text-foreground' };
                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[0.7rem] uppercase">
                            {u.firstName[0]}
                            {u.lastName[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground">
                                {u.firstName} {u.lastName}
                              </p>
                              {u.isProtected && (
                                <span className="inline-flex items-center gap-1 text-[0.6rem] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shadow-xs">
                                  👑 Root
                                </span>
                              )}
                            </div>
                            {u.email && <p className="text-[0.65rem] text-muted-foreground">{u.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground">@{u.username}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold border',
                            roleMeta.color,
                          )}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-mono">
                        {u.phone || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold',
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400',
                          )}>
                          {u.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[0.7rem]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('uz-UZ') : 'Hali kirmagan'}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              title="Tahrirlash"
                              onClick={() => {
                                setError(null);
                                setEditModalUser(u);
                              }}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              title="Parolni o'zgartirish"
                              onClick={() => {
                                setError(null);
                                setResetPassUser(u);
                              }}>
                              <KeyRound className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={u.isProtected}
                              className={cn(
                                'size-7',
                                u.isProtected
                                  ? 'opacity-30 cursor-not-allowed text-muted-foreground'
                                  : u.isActive
                                    ? 'text-muted-foreground hover:text-destructive'
                                    : 'text-muted-foreground hover:text-emerald-400',
                              )}
                              title={
                                u.isProtected
                                  ? "Asosiy SuperAdminni nofaol qilib bo'lmaydi"
                                  : u.isActive
                                    ? 'Nofaol qilish'
                                    : 'Faollashtirish'
                              }
                              onClick={() =>
                                toggleStatusMutation.mutate({ id: u.id, isActive: !u.isActive })
                              }>
                              {u.isActive ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE STAFF MODAL */}
      {createModalOpen && (
        <CreateStaffModal
          onClose={() => setCreateModalOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={error}
        />
      )}

      {/* EDIT STAFF MODAL */}
      {editModalUser && (
        <EditStaffModal
          user={editModalUser}
          onClose={() => setEditModalUser(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editModalUser.id, payload: data })}
          isLoading={updateMutation.isPending}
          error={error}
        />
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPassUser && (
        <ResetPasswordModal
          user={resetPassUser}
          onClose={() => setResetPassUser(null)}
          onSubmit={(newPassword) =>
            resetPasswordMutation.mutate({ id: resetPassUser.id, newPassword })
          }
          isLoading={resetPasswordMutation.isPending}
          error={error}
        />
      )}
    </div>
  );
}

/* ---------------- CREATE MODAL ---------------- */
function CreateStaffModal({
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    role: AdminRole;
  }) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('moderator');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username: username.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      role,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 bg-card border-border shadow-2xl rounded-xl">
        <h2 className="text-base font-bold text-foreground mb-4">Yangi Xodim Qo&apos;shish</h2>

        {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Ism *</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alisher"
                required
                className="h-8.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Familiya *</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Usmonov"
                required
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Username (Login) *</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alisher_mod"
                required
                className="h-8.5 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Dastlabki Parol *</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-8.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Telefon raqam (2FA uchun)</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="h-8.5 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alisher@yaqin.uz"
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Xodim Roli *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground">
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Bekor qilish
            </Button>
            <Button type="submit" size="sm" disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? 'Qo\'shilmoqda…' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ---------------- EDIT MODAL ---------------- */
function EditStaffModal({
  user,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  user: StaffUser;
  onClose: () => void;
  onSubmit: (data: { username?: string; firstName?: string; lastName?: string; phone?: string; email?: string; role?: AdminRole }) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [username, setUsername] = useState(user.username);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState<AdminRole>(user.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username: username.trim().toLowerCase().replace(/\s+/g, ''),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      role,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 bg-card border-border shadow-2xl rounded-xl">
        <h2 className="text-base font-bold text-foreground mb-1">Xodimni Tahrirlash</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Xodimning username, ism, familiya va kirish huquqlarini o&apos;zgartirish
        </p>

        {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Username (Login) *</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="username"
              required
              minLength={3}
              className="h-8.5 text-xs font-mono"
            />
            <p className="text-[0.65rem] text-muted-foreground">
              Super Admin sifatida xodimning login (username) nomini istalgan vaqtda o&apos;zgartirishingiz mumkin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Ism</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-8.5 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Familiya</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-8.5 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Telefon raqam</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8.5 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8.5 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground">Rol</label>
              {user.isProtected && (
                <span className="text-[0.65rem] text-amber-400 font-semibold">
                  👑 Asosiy Superadmin roli o&apos;zgarmas
                </span>
              )}
            </div>
            <select
              value={role}
              disabled={user.isProtected}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className={cn(
                'w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground',
                user.isProtected && 'opacity-60 cursor-not-allowed bg-muted',
              )}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Bekor qilish
            </Button>
            <Button type="submit" size="sm" disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? 'Saqlanmoqda…' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ---------------- RESET PASSWORD MODAL ---------------- */
function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  user: StaffUser;
  onClose: () => void;
  onSubmit: (newPass: string) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    onSubmit(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-6 bg-card border-border shadow-2xl rounded-xl">
        <h2 className="text-base font-bold text-foreground mb-1">Parolni Qayta O&apos;rnatish</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Xodim: <strong>{user.firstName} {user.lastName}</strong> (@{user.username})
        </p>

        {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Yangi Parol</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Kamida 6 ta belgi"
              required
              minLength={6}
              autoFocus
              className="h-8.5 text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Bekor qilish
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || newPassword.length < 6}
              className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {isLoading ? 'Yangilanmoqda…' : 'Parolni O\'rnatish'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

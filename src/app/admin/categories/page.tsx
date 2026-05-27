'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { api, extractErrorMessage } from '@/lib/api';

interface Category {
  id: string;
  slug: string;
  nameUzLatn: string;
  nameUzCyrl: string;
  nameRu: string;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [nameUzLatn, setNameUzLatn] = useState('');
  const [nameUzCyrl, setNameUzCyrl] = useState('');
  const [nameRu, setNameRu] = useState('');

  const treeQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const res = await api.get<Category[]>('/categories/admin/all');
      return res.data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.post('/categories', {
        slug,
        nameUzLatn,
        nameUzCyrl,
        nameRu,
        parentId: parentId ?? undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setCreating(false);
      setSlug('');
      setNameUzLatn('');
      setNameUzCyrl('');
      setNameRu('');
      setParentId(null);
    },
    onError: (e) => alert(extractErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0046AD]">Kategoriyalar</h1>
          <p className="text-slate-600 text-sm">Mahsulot kategoriyalari daraxti</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-[#0046AD] text-white font-semibold rounded-md">
          + Yangi kategoriya
        </button>
      </div>

      <div className="bg-white rounded-lg p-4 border border-slate-200">
        {treeQuery.data && treeQuery.data.length > 0 ? (
          <CategoryList items={treeQuery.data} onAddChild={(id) => { setParentId(id); setCreating(true); }} onDelete={(id) => remove.mutate(id)} />
        ) : (
          <p className="text-slate-600">Kategoriya yo&apos;q</p>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-3">
            <h2 className="text-lg font-bold">Yangi kategoriya</h2>
            {parentId && (
              <p className="text-xs text-slate-600">Ota kategoriya ID: {parentId}</p>
            )}
            <Input label="Slug (URL)" value={slug} onChange={setSlug} placeholder="oziq-ovqat" />
            <Input label="Nomi (lotin)" value={nameUzLatn} onChange={setNameUzLatn} placeholder="Oziq-ovqat" />
            <Input label="Nomi (kirill)" value={nameUzCyrl} onChange={setNameUzCyrl} placeholder="Озиқ-овқат" />
            <Input label="Nomi (русский)" value={nameRu} onChange={setNameRu} placeholder="Продукты" />
            <div className="flex gap-2 justify-end pt-3">
              <button
                onClick={() => {
                  setCreating(false);
                  setParentId(null);
                }}
                className="px-4 py-2 text-slate-600">
                Bekor
              </button>
              <button
                disabled={!slug || !nameUzLatn || !nameUzCyrl || !nameRu || create.isPending}
                onClick={() => create.mutate()}
                className="px-4 py-2 bg-[#0046AD] text-white rounded-md disabled:opacity-50">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryList({
  items,
  depth = 0,
  onAddChild,
  onDelete,
}: {
  items: Category[];
  depth?: number;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {items.map((c) => (
        <li key={c.id}>
          <div
            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50"
            style={{ paddingLeft: 12 + depth * 24 }}>
            <div>
              <span className="font-semibold">{c.nameUzLatn}</span>
              <span className="text-xs text-slate-500 ml-2">/{c.slug}</span>
              {!c.isActive && (
                <span className="ml-2 text-xs bg-slate-200 px-2 py-0.5 rounded">O&apos;chirilgan</span>
              )}
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => onAddChild(c.id)} className="text-[#0046AD] hover:underline">
                + Pastki
              </button>
              <button
                onClick={() => {
                  if (confirm(`"${c.nameUzLatn}" ni o'chirasizmi?`)) onDelete(c.id);
                }}
                className="text-red-600 hover:underline">
                O&apos;chirish
              </button>
            </div>
          </div>
          {c.children && c.children.length > 0 && (
            <CategoryList items={c.children} depth={depth + 1} onAddChild={onAddChild} onDelete={onDelete} />
          )}
        </li>
      ))}
    </ul>
  );
}

function Input({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-md"
      />
    </div>
  );
}

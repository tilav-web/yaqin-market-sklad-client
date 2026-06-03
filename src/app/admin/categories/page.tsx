'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
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

  const closeForm = () => {
    setCreating(false);
    setParentId(null);
    setSlug('');
    setNameUzLatn('');
    setNameUzCyrl('');
    setNameRu('');
  };

  const create = useMutation({
    mutationFn: async () => {
      await api.post('/categories', { slug, nameUzLatn, nameUzCyrl, nameRu, parentId: parentId ?? undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      closeForm();
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
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Katalog"
        title="Kategoriyalar"
        description="Mahsulot kategoriyalari daraxti — uch tilda."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Yangi kategoriya
          </Button>
        }
      />

      <Card className="p-3">
        {treeQuery.data && treeQuery.data.length > 0 ? (
          <CategoryList
            items={treeQuery.data}
            onAddChild={(id) => {
              setParentId(id);
              setCreating(true);
            }}
            onDelete={(id) => remove.mutate(id)}
          />
        ) : (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">Kategoriya yo&apos;q</p>
        )}
      </Card>

      {creating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md space-y-3 p-6">
            <h2 className="text-lg font-bold text-foreground">Yangi kategoriya</h2>
            {parentId ? (
              <p className="text-xs text-muted-foreground">Ota kategoriya tanlangan</p>
            ) : null}
            <Field label="Slug (URL)">
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="oziq-ovqat" />
            </Field>
            <Field label="Nomi (lotin)">
              <Input value={nameUzLatn} onChange={(e) => setNameUzLatn(e.target.value)} placeholder="Oziq-ovqat" />
            </Field>
            <Field label="Nomi (kirill)">
              <Input value={nameUzCyrl} onChange={(e) => setNameUzCyrl(e.target.value)} placeholder="Озиқ-овқат" />
            </Field>
            <Field label="Nomi (русский)">
              <Input value={nameRu} onChange={(e) => setNameRu(e.target.value)} placeholder="Продукты" />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={closeForm}>
                Bekor
              </Button>
              <Button
                size="sm"
                disabled={!slug || !nameUzLatn || !nameUzCyrl || !nameRu || create.isPending}
                onClick={() => create.mutate()}>
                Saqlash
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
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
    <ul className="space-y-0.5">
      {items.map((c) => (
        <li key={c.id}>
          <div
            className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
            style={{ paddingLeft: 12 + depth * 22 }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{c.nameUzLatn}</span>
              <span className="text-xs text-muted-foreground">/{c.slug}</span>
              {!c.isActive ? <Badge variant="neutral">O&apos;chirilgan</Badge> : null}
            </div>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="sm" onClick={() => onAddChild(c.id)}>
                <Plus className="size-3.5" />
                Pastki
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  if (confirm(`"${c.nameUzLatn}" ni o'chirasizmi?`)) onDelete(c.id);
                }}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
          {c.children && c.children.length > 0 ? (
            <CategoryList items={c.children} depth={depth + 1} onAddChild={onAddChild} onDelete={onDelete} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

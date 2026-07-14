'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useReducer, useState } from 'react';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';
import { useEscapeKey } from '@/lib/use-escape-key';
import { toast } from '@/stores/toast';

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

/* ─── Create form reducer ─── */
interface FormState {
  open: boolean;
  parentId: string | null;
  slug: string;
  nameUzLatn: string;
  nameUzCyrl: string;
  nameRu: string;
  editing: Category | null;
}

type FormAction =
  | { type: 'OPEN_CREATE'; parentId?: string }
  | { type: 'CLOSE' }
  | { type: 'SET'; field: 'slug' | 'nameUzLatn' | 'nameUzCyrl' | 'nameRu'; value: string }
  | { type: 'OPEN_EDIT'; category: Category }
  | { type: 'CLOSE_EDIT' };

const FORM_INIT: FormState = {
  open: false, parentId: null, slug: '', nameUzLatn: '', nameUzCyrl: '', nameRu: '', editing: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'OPEN_CREATE':
      return { ...state, open: true, parentId: action.parentId ?? null };
    case 'CLOSE':
      return { ...FORM_INIT, editing: state.editing };
    case 'SET':
      return { ...state, [action.field]: action.value };
    case 'OPEN_EDIT':
      return { ...state, editing: action.category };
    case 'CLOSE_EDIT':
      return { ...state, editing: null };
    default:
      return state;
  }
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [form, dispatch] = useReducer(formReducer, FORM_INIT);
  const [formErr, setFormErr] = useState('');
  const [listErr, setListErr] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  useEscapeKey(form.open, () => dispatch({ type: 'CLOSE' }));
  useEscapeKey(!!form.editing, () => dispatch({ type: 'CLOSE_EDIT' }));

  const treeQuery = useQuery({
    queryKey: ['admin', 'categories', 'all'],
    queryFn: async () => (await api.get<Category[]>('/categories/admin/all')).data,
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.post('/categories', {
        slug: form.slug, nameUzLatn: form.nameUzLatn, nameUzCyrl: form.nameUzCyrl,
        nameRu: form.nameRu, parentId: form.parentId ?? undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories', 'all'] });
      dispatch({ type: 'CLOSE' });
      setFormErr('');
      toast.success('Kategoriya yaratildi');
    },
    onError: (e) => setFormErr(extractErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/categories/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories', 'all'] });
      setPendingDelete(null);
      toast.success("Kategoriya o'chirildi");
    },
    onError: (e) => setListErr(extractErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Category> }) => {
      await api.patch(`/categories/${id}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories', 'all'] });
      toast.success('Saqlandi');
    },
    onError: (e) => setListErr(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Katalog"
        title="Kategoriyalar"
        description="Mahsulot kategoriyalari daraxti — uch tilda."
        actions={
          <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
            <Plus className="size-4" />
            Yangi kategoriya
          </Button>
        }
      />

      <Card className="p-3">
        {listErr && !form.editing && (
          <p className="mb-2 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{listErr}</p>
        )}
        {treeQuery.isError ? (
          <p className="px-3 py-10 text-center text-sm text-destructive">
            {extractErrorMessage(treeQuery.error)} —{' '}
            <button className="underline" onClick={() => treeQuery.refetch()}>qayta urinish</button>
          </p>
        ) : treeQuery.data && treeQuery.data.length > 0 ? (
          <CategoryList
            items={treeQuery.data}
            onAddChild={(id) => { setListErr(''); dispatch({ type: 'OPEN_CREATE', parentId: id }); }}
            onEdit={(c) => { setListErr(''); dispatch({ type: 'OPEN_EDIT', category: c }); }}
            onToggleActive={(c) => update.mutate({ id: c.id, patch: { isActive: !c.isActive } })}
            onDelete={(c) => { setListErr(''); setPendingDelete(c); }}
          />
        ) : (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            {treeQuery.isLoading ? 'Yuklanmoqda…' : "Kategoriya yo'q"}
          </p>
        )}
      </Card>

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md space-y-3 p-6">
            <h2 className="text-lg font-bold text-foreground">Yangi kategoriya</h2>
            {form.parentId && <p className="text-xs text-muted-foreground">Ota kategoriya tanlangan</p>}
            <Field label="Slug (URL)">
              <Input value={form.slug} onChange={(e) => dispatch({ type: 'SET', field: 'slug', value: e.target.value })} placeholder="oziq-ovqat" />
            </Field>
            <Field label="Nomi (lotin)">
              <Input value={form.nameUzLatn} onChange={(e) => dispatch({ type: 'SET', field: 'nameUzLatn', value: e.target.value })} placeholder="Oziq-ovqat" />
            </Field>
            <Field label="Nomi (kirill)">
              <Input value={form.nameUzCyrl} onChange={(e) => dispatch({ type: 'SET', field: 'nameUzCyrl', value: e.target.value })} placeholder="Озиқ-овқат" />
            </Field>
            <Field label="Nomi (русский)">
              <Input value={form.nameRu} onChange={(e) => dispatch({ type: 'SET', field: 'nameRu', value: e.target.value })} placeholder="Продукты" />
            </Field>
            {formErr && <p className="text-xs text-destructive">{formErr}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => { dispatch({ type: 'CLOSE' }); setFormErr(''); }}>Bekor</Button>
              <Button size="sm"
                disabled={!form.slug || !form.nameUzLatn || !form.nameUzCyrl || !form.nameRu || create.isPending}
                onClick={() => create.mutate()}>
                Saqlash
              </Button>
            </div>
          </Card>
        </div>
      )}

      {form.editing && (
        <EditCategoryModal
          category={form.editing}
          pending={update.isPending}
          error={listErr}
          onClose={() => { dispatch({ type: 'CLOSE_EDIT' }); setListErr(''); }}
          onSave={(patch) => update.mutate({ id: form.editing!.id, patch }, {
            onSuccess: () => { dispatch({ type: 'CLOSE_EDIT' }); setListErr(''); },
          })}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Kategoriyani o'chirish"
        description={pendingDelete && (
          <div className="space-y-1">
            <p>Kategoriya: <span className="font-semibold text-foreground">{pendingDelete.nameUzLatn}</span></p>
            {pendingDelete.children && pendingDelete.children.length > 0 && (
              <p className="mt-2 text-destructive">
                Bu kategoriyaning {pendingDelete.children.length} ta pastki kategoriyasi bor — ular o&apos;chirilmaydi, lekin ota-kategoriyasiz (ildiz darajasida) qoladi.
              </p>
            )}
          </div>
        )}
        confirmLabel="Ha, o'chirish"
        pending={remove.isPending}
        error={listErr}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function CategoryList({
  items, depth = 0, onAddChild, onEdit, onToggleActive, onDelete,
}: {
  items: Category[];
  depth?: number;
  onAddChild: (id: string) => void;
  onEdit: (c: Category) => void;
  onToggleActive: (c: Category) => void;
  onDelete: (c: Category) => void;
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
              {!c.isActive && <Badge variant="neutral">O&apos;chirilgan</Badge>}
            </div>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="sm" onClick={() => onToggleActive(c)}>
                {c.isActive ? 'Yashirish' : "Ko'rsatish"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAddChild(c.id)}>
                <Plus className="size-3.5" /> Pastki
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(c)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm"
                onClick={() => onDelete(c)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
          {c.children && c.children.length > 0 && (
            <CategoryList items={c.children} depth={depth + 1}
              onAddChild={onAddChild} onEdit={onEdit} onToggleActive={onToggleActive} onDelete={onDelete} />
          )}
        </li>
      ))}
    </ul>
  );
}

/* ─── Edit modal — own reducer ─── */
interface EditState { slug: string; nameUzLatn: string; nameUzCyrl: string; nameRu: string; sortOrder: string }
type EditAction = { type: 'SET'; field: keyof EditState; value: string };

function editReducer(state: EditState, action: EditAction): EditState {
  return { ...state, [action.field]: action.value };
}

function EditCategoryModal({ category, pending, error, onClose, onSave }: {
  category: Category;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSave: (patch: Partial<Category>) => void;
}) {
  const [state, dispatch] = useReducer(editReducer, {
    slug: category.slug,
    nameUzLatn: category.nameUzLatn,
    nameUzCyrl: category.nameUzCyrl,
    nameRu: category.nameRu,
    sortOrder: String(category.sortOrder),
  });
  const set = (field: keyof EditState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'SET', field, value: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md space-y-3 p-6">
        <h2 className="text-lg font-bold text-foreground">Kategoriyani tahrirlash</h2>
        <Field label="Slug (URL)"><Input value={state.slug} onChange={set('slug')} /></Field>
        <Field label="Nomi (lotin)"><Input value={state.nameUzLatn} onChange={set('nameUzLatn')} /></Field>
        <Field label="Nomi (kirill)"><Input value={state.nameUzCyrl} onChange={set('nameUzCyrl')} /></Field>
        <Field label="Nomi (русский)"><Input value={state.nameRu} onChange={set('nameRu')} /></Field>
        <Field label="Tartib raqami"><Input type="number" value={state.sortOrder} onChange={set('sortOrder')} /></Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Bekor</Button>
          <Button size="sm"
            disabled={!state.slug || !state.nameUzLatn || !state.nameUzCyrl || !state.nameRu || pending}
            onClick={() => onSave({ slug: state.slug, nameUzLatn: state.nameUzLatn, nameUzCyrl: state.nameUzCyrl, nameRu: state.nameRu, sortOrder: Number(state.sortOrder) || 0 })}>
            Saqlash
          </Button>
        </div>
      </Card>
    </div>
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

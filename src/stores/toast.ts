import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastStore {
  items: ToastItem[];
  push: (message: string, variant: ToastVariant) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (message, variant) =>
    set((s) => ({ items: [...s.items, { id: nextId++, message, variant }] })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Call from anywhere (mutation onSuccess/onError) — no hook needed. */
export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
};

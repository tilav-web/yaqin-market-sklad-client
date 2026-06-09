import { create } from 'zustand';

export type NotifAudience = 'all' | 'sellers' | 'customers' | 'specific';

/** Fields that belong to the compose form — persist across navigation. */
interface DraftFields {
  title: string;
  richBody: string;
  imageUrl: string;
  deepLink: string;
  selectedTplId: string | null;
}

/** Pre-selected target set from the users page. */
interface TargetFields {
  audience: NotifAudience;
  /** string[] because Set is not serialisable; convert to Set<string> in components. */
  userIds: string[];
  selectAll: boolean;
}

interface AdminNotifStore extends DraftFields, TargetFields {
  patchDraft: (p: Partial<DraftFields>) => void;
  setTarget: (audience: NotifAudience, userIds: string[], selectAll: boolean) => void;
  clearTarget: () => void;
  resetDraft: () => void;
}

const DRAFT_INIT: DraftFields = {
  title: '',
  richBody: '',
  imageUrl: '',
  deepLink: '/notifications',
  selectedTplId: null,
};

const TARGET_INIT: TargetFields = {
  audience: 'all',
  userIds: [],
  selectAll: false,
};

export const useAdminNotifStore = create<AdminNotifStore>((set) => ({
  ...DRAFT_INIT,
  ...TARGET_INIT,
  patchDraft: (p) => set((s) => ({ ...s, ...p })),
  setTarget: (audience, userIds, selectAll) => set((s) => ({ ...s, audience, userIds, selectAll })),
  clearTarget: () => set(TARGET_INIT),
  resetDraft: () => set(DRAFT_INIT),
}));

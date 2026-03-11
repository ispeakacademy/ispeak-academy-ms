import type { SystemSetting } from '@/types/settings';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SettingsState {
  settings: SystemSetting | null;
  isLoading: boolean;
  setSettings: (settings: SystemSetting) => void;
  setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set) => ({
      settings: null,
      isLoading: false,
      setSettings: (settings) => set({ settings }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'settings-store',
    }
  )
);

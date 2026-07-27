import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  language: string;
  confirmBeforeDelete: boolean;
  showAttachments: boolean;
  autoSync: boolean;
  syncInterval: number;
  compactView: boolean;
  showPreview: boolean;
  keyboardShortcuts: boolean;

  setLanguage: (lang: string) => void;
  setConfirmBeforeDelete: (val: boolean) => void;
  setShowAttachments: (val: boolean) => void;
  setAutoSync: (val: boolean) => void;
  setSyncInterval: (val: number) => void;
  setCompactView: (val: boolean) => void;
  setShowPreview: (val: boolean) => void;
  setKeyboardShortcuts: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: "en",
      confirmBeforeDelete: true,
      showAttachments: true,
      autoSync: true,
      syncInterval: 60,
      compactView: false,
      showPreview: true,
      keyboardShortcuts: true,

      setLanguage: (language) => set({ language }),
      setConfirmBeforeDelete: (confirmBeforeDelete) => set({ confirmBeforeDelete }),
      setShowAttachments: (showAttachments) => set({ showAttachments }),
      setAutoSync: (autoSync) => set({ autoSync }),
      setSyncInterval: (syncInterval) => set({ syncInterval }),
      setCompactView: (compactView) => set({ compactView }),
      setShowPreview: (showPreview) => set({ showPreview }),
      setKeyboardShortcuts: (keyboardShortcuts) => set({ keyboardShortcuts }),
    }),
    {
      name: "mailguardian-settings",
    }
  )
);

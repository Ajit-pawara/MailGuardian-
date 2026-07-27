import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  theme: "light" | "dark" | "system";
  activeView: "inbox" | "analytics" | "search" | "settings";

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setActiveView: (view: "inbox" | "analytics" | "search" | "settings") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileMenuOpen: false,
      theme: "system",
      activeView: "inbox",

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      setTheme: (theme) => set({ theme }),
      setActiveView: (activeView) => set({ activeView }),
    }),
    {
      name: "mailguardian-ui",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

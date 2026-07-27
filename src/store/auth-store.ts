import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, MailAccount } from "@/types/auth";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeAccountId: string | null;

  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveAccount: (accountId: string | null) => void;
  addAccount: (account: MailAccount) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<MailAccount>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      activeAccountId: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setActiveAccount: (accountId) => set({ activeAccountId: accountId }),

      addAccount: (account) => {
        const user = get().user;
        if (!user) return;
        const exists = user.accounts.find((a) => a.id === account.id);
        if (!exists) {
          set({
            user: {
              ...user,
              accounts: [...user.accounts, account],
            },
          });
        }
      },

      removeAccount: (accountId) => {
        const user = get().user;
        if (!user) return;
        const activeId = get().activeAccountId;
        set({
          user: {
            ...user,
            accounts: user.accounts.filter((a) => a.id !== accountId),
          },
          activeAccountId: activeId === accountId ? null : activeId,
        });
      },

      updateAccount: (accountId, updates) => {
        const user = get().user;
        if (!user) return;
        set({
          user: {
            ...user,
            accounts: user.accounts.map((a) =>
              a.id === accountId ? { ...a, ...updates } : a
            ),
          },
        });
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          activeAccountId: null,
        }),
    }),
    {
      name: "mailguardian-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeAccountId: state.activeAccountId,
      }),
    }
  )
);

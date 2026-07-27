import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationPreferences, AppNotification, NotificationRule } from "@/types/notification";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  permission: NotificationPermission | "unsupported";

  addNotification: (notification: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  setPreferences: (prefs: Partial<NotificationPreferences>) => void;
  addRule: (rule: NotificationRule) => void;
  removeRule: (id: string) => void;
  updateRule: (id: string, updates: Partial<NotificationRule>) => void;
  setPermission: (permission: NotificationPermission | "unsupported") => void;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  importantOnly: true,
  minPriority: 60,
  soundEnabled: true,
  soundUrl: "/sounds/notification.wav",
  vibration: true,
  desktopEnabled: true,
  mobileEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  rules: [],
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      preferences: defaultPreferences,
      permission: "default",

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        })),

      markRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        }),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      addRule: (rule) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            rules: [...state.preferences.rules, rule],
          },
        })),

      removeRule: (id) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            rules: state.preferences.rules.filter((r) => r.id !== id),
          },
        })),

      updateRule: (id, updates) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            rules: state.preferences.rules.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          },
        })),

      setPermission: (permission) => set({ permission }),
    }),
    {
      name: "mailguardian-notifications",
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

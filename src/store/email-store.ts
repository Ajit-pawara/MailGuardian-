import { create } from "zustand";
import type { EmailMessage } from "@/types/email";

type ViewMode = "unified" | "single";
type SortField = "date" | "priority" | "from" | "subject";
type SortOrder = "asc" | "desc";
type FilterLabel = "all" | "unread" | "important" | "starred" | "archived" | string;

interface EmailState {
  emails: EmailMessage[];
  selectedIds: Set<string>;
  viewMode: ViewMode;
  sortField: SortField;
  sortOrder: SortOrder;
  filterLabel: FilterLabel;
  searchQuery: string;
  isSyncing: boolean;
  lastSync: Date | null;
  totalUnread: number;
  totalImportant: number;

  setEmails: (emails: EmailMessage[]) => void;
  addEmails: (emails: EmailMessage[]) => void;
  updateEmail: (id: string, updates: Partial<EmailMessage>) => void;
  removeEmails: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setFilterLabel: (label: FilterLabel) => void;
  setSearchQuery: (query: string) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSync: (date: Date) => void;
  setTotalUnread: (count: number) => void;
  setTotalImportant: (count: number) => void;

  getFilteredEmails: () => EmailMessage[];
  getEmailById: (id: string) => EmailMessage | undefined;
}

export const useEmailStore = create<EmailState>()((set, get) => ({
  emails: [],
  selectedIds: new Set(),
  viewMode: "unified",
  sortField: "date",
  sortOrder: "desc",
  filterLabel: "all",
  searchQuery: "",
  isSyncing: false,
  lastSync: null,
  totalUnread: 0,
  totalImportant: 0,

  setEmails: (emails) => set({ emails }),
  addEmails: (newEmails) =>
    set((state) => {
      const existing = new Map(state.emails.map((e) => [e.id, e]));
      for (const email of newEmails) existing.set(email.id, email);
      return { emails: Array.from(existing.values()) };
    }),

  updateEmail: (id, updates) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  removeEmails: (ids) =>
    set((state) => ({
      emails: state.emails.filter((e) => !ids.includes(e.id)),
    })),

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),

  setViewMode: (viewMode) => set({ viewMode }),
  setSortField: (sortField) => set({ sortField }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setFilterLabel: (filterLabel) => set({ filterLabel }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setLastSync: (lastSync) => set({ lastSync }),
  setTotalUnread: (totalUnread) => set({ totalUnread }),
  setTotalImportant: (totalImportant) => set({ totalImportant }),

  getFilteredEmails: () => {
    const state = get();
    let filtered = [...state.emails];

    if (state.filterLabel === "unread") filtered = filtered.filter((e) => e.labelIds.includes("UNREAD"));
    else if (state.filterLabel === "important") filtered = filtered.filter((e) => e.labelIds.includes("IMPORTANT"));
    else if (state.filterLabel === "starred") filtered = filtered.filter((e) => e.labelIds.includes("STARRED"));
    else if (state.filterLabel && state.filterLabel !== "all") filtered = filtered.filter((e) => e.labelIds.includes(state.filterLabel));

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.name.toLowerCase().includes(q) ||
          e.from.address.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      const mul = state.sortOrder === "asc" ? 1 : -1;
      if (state.sortField === "date") return mul * (new Date(b.date).getTime() - new Date(a.date).getTime());
      if (state.sortField === "priority") return mul * ((b as any).priority_score || 0) - ((a as any).priority_score || 0);
      if (state.sortField === "from") return mul * a.from.name.localeCompare(b.from.name);
      if (state.sortField === "subject") return mul * a.subject.localeCompare(b.subject);
      return 0;
    });

    return filtered;
  },

  getEmailById: (id) => get().emails.find((e) => e.id === id),
}));

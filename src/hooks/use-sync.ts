"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmailStore } from "@/store/email-store";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/services/supabase";

export function useSyncStatus() {
  const activeAccountId = useAuthStore((s) => s.activeAccountId);

  return useQuery({
    queryKey: ["sync-status", activeAccountId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeAccountId) params.set("accountId", activeAccountId);
      const res = await fetch(`/api/gmail/sync?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sync status");
      return res.json() as Promise<{
        status: string;
        lastSync: string | null;
        emailsSynced: number;
      }>;
    },
    refetchInterval: 30_000,
  });
}

export function usePeriodicSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { lastSync, setLastSync } = useEmailStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {};
        const res = await fetch("/api/gmail/sync", { method: "POST", headers });
        if (res.ok) {
          setLastSync(new Date());
          queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
      } catch {
        // Silently fail – next sync will retry
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [isAuthenticated, queryClient, setLastSync]);
}

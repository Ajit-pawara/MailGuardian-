"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsSummary } from "@/types/analytics";
import { useAuthStore } from "@/store/auth-store";

export function useAnalytics() {
  const activeAccountId = useAuthStore((s) => s.activeAccountId);

  return useQuery({
    queryKey: ["analytics", activeAccountId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeAccountId) params.set("accountId", activeAccountId);
      const res = await fetch(`/api/user?analytics=true&${params}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json() as Promise<AnalyticsSummary>;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60_000,
  });
}

export function useEmailStats() {
  return useQuery({
    queryKey: ["email-stats"],
    queryFn: async () => {
      const res = await fetch("/api/user?stats=true");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<{
        unread: number;
        important: number;
        today: number;
        week: number;
      }>;
    },
    refetchInterval: 60_000,
  });
}

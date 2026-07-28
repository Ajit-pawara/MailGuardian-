"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmailStore } from "@/store/email-store";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/services/supabase";
import type { EmailMessage, EmailAction } from "@/types/email";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function fetchEmailsApi(accountId?: string): Promise<EmailMessage[]> {
  const params = new URLSearchParams();
  if (accountId) params.set("accountId", accountId);
  const res = await fetch(`/api/gmail/emails?${params}`);
  if (!res.ok) throw new Error("Failed to fetch emails");
  const data = await res.json();
  return data.messages ?? [];
}

async function performActionApi(action: EmailAction): Promise<boolean> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/gmail/emails", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  if (!res.ok) throw new Error("Failed to perform action");
  return res.json();
}

export function useEmails() {
  const queryClient = useQueryClient();
  const setEmails = useEmailStore((s) => s.setEmails);
  const activeAccountId = useAuthStore((s) => s.activeAccountId);

  const query = useQuery({
    queryKey: ["emails", activeAccountId],
    queryFn: () => fetchEmailsApi(activeAccountId || undefined),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (query.data) {
    setEmails(query.data);
  }

  return query;
}

export function useEmailAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: performActionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useEmailDetail(id: string) {
  return useQuery({
    queryKey: ["email", id],
    queryFn: async () => {
      const res = await fetch(`/api/gmail/emails?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch email");
      return res.json() as Promise<EmailMessage>;
    },
    enabled: !!id,
  });
}

export function useSyncEmails() {
  const queryClient = useQueryClient();
  const setIsSyncing = useEmailStore((s) => s.setIsSyncing);

  return useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/gmail/sync", { method: "POST", headers });
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
    onMutate: () => setIsSyncing(true),
    onSettled: () => setIsSyncing(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./use-debounce";
import type { EmailMessage } from "@/types/email";

interface SearchParams {
  q: string;
  from?: string;
  to?: string;
  subject?: string;
  after?: string;
  before?: string;
  hasAttachment?: boolean;
  category?: string;
  account?: string;
  page?: number;
  limit?: number;
}

export function useSearch(params: SearchParams) {
  const debouncedQuery = useDebounce(params.q, 300);

  return useQuery({
    queryKey: ["search", { ...params, q: debouncedQuery }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (debouncedQuery) searchParams.set("q", debouncedQuery);
      if (params.from) searchParams.set("from", params.from);
      if (params.to) searchParams.set("to", params.to);
      if (params.subject) searchParams.set("subject", params.subject);
      if (params.after) searchParams.set("after", params.after);
      if (params.before) searchParams.set("before", params.before);
      if (params.hasAttachment) searchParams.set("hasAttachment", "true");
      if (params.category) searchParams.set("category", params.category);
      if (params.account) searchParams.set("account", params.account);
      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));

      const res = await fetch(`/api/gmail/emails?${searchParams}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<{
        messages: EmailMessage[];
        total: number;
        page: number;
        hasMore: boolean;
      }>;
    },
    enabled: !!debouncedQuery || !!params.from || !!params.category,
    staleTime: 30_000,
  });
}

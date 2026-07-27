"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClassificationResult } from "@/types/classification";

export function useClassification(emailId: string) {
  return useQuery({
    queryKey: ["classification", emailId],
    queryFn: async () => {
      const res = await fetch(`/api/classify?emailId=${emailId}`);
      if (!res.ok) throw new Error("Classification failed");
      return res.json() as Promise<ClassificationResult>;
    },
    enabled: !!emailId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBatchClassification(emailIds: string[]) {
  return useQuery({
    queryKey: ["classifications", emailIds],
    queryFn: async () => {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIds }),
      });
      if (!res.ok) throw new Error("Batch classification failed");
      return res.json() as Promise<Record<string, ClassificationResult>>;
    },
    enabled: emailIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EmailCard } from "./email-card";
import { EmailSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useEmailStore } from "@/store/email-store";
import type { EmailMessage } from "@/types/email";

interface EmailListProps {
  emails: EmailMessage[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function EmailList({
  emails,
  isLoading,
  hasMore,
  onLoadMore,
  emptyMessage = "No emails found",
  emptyIcon,
}: EmailListProps) {
  const router = useRouter();
  const { selectedIds, toggleSelect, clearSelection } = useEmailStore();
  const [selectMode, setSelectMode] = useState(false);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((m) => !m);
    if (selectMode) clearSelection();
  }, [selectMode, clearSelection]);

  const handleSelect = useCallback(
    (id: string) => (e?: React.MouseEvent) => {
      e?.stopPropagation();
      toggleSelect(id);
    },
    [toggleSelect]
  );

  if (isLoading && emails.length === 0) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <EmailSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        {emptyIcon || (
          <svg className="h-16 w-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
          </svg>
        )}
        <h3 className="text-lg font-semibold text-muted-foreground">{emptyMessage}</h3>
        <p className="mt-1 text-sm text-muted-foreground/60">
          Try adjusting your filters or sync your accounts
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-sm text-muted-foreground">
          {emails.length} email{emails.length !== 1 ? "s" : ""}
          {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
        </span>
        <div className="flex gap-1">
          <Button
            variant={selectMode ? "default" : "ghost"}
            size="sm"
            onClick={toggleSelectMode}
            className="text-xs"
          >
            {selectMode ? "Done" : "Select"}
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        {emails.map((email, idx) => (
          <motion.div
            key={email.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
          >
            <EmailCard
              email={email}
              selected={selectedIds.has(email.id)}
              onSelect={selectMode ? handleSelect(email.id) : undefined}
              onClick={() => router.push(`/email/${email.id}`)}
            />
          </motion.div>
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center py-6">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatEmailDate } from "@/utils/date";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/config/constants";
import type { EmailMessage } from "@/types/email";

interface EmailCardProps {
  email: EmailMessage;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  classification?: {
    category?: string;
    priorityScore?: number;
    categoryGroup?: string;
  };
}

export function EmailCard({ email, selected, onSelect, onClick, classification }: EmailCardProps) {
  const category = classification?.category || email.category;
  const categoryGroup = classification?.categoryGroup || email.categoryGroup;
  const priorityScore = classification?.priorityScore ?? email.priority_score ?? 0;
  const isUnread = email.labelIds?.includes("UNREAD") ?? true;
  const hasAttachments = email.attachments?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-2xl border border-transparent p-4 transition-all",
        "hover:bg-secondary/30 hover:border-border/50",
        selected && "bg-primary/5 border-primary/20",
        isUnread && "bg-primary/[0.02]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="mt-1 h-4 w-4 rounded border-gray-300"
        />
      </div>

      <Avatar
        src={email.from?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(email.from?.name || email.from?.address || '?')}&background=random`}
        alt={email.from?.name || email.from?.address}
        size="md"
        fallback={email.from?.name?.[0] || email.from?.address?.[0] || "?"}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm", isUnread && "font-semibold")}>
            {email.from?.name || email.from?.address}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatEmailDate(email.date || email.internalDate)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("truncate text-sm", isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
            {email.subject}
          </span>
          {hasAttachments && (
            <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
          )}
        </div>

        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {email.snippet}
        </p>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {category && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {CATEGORY_LABELS[category] || category}
            </Badge>
          )}
          {priorityScore >= 60 && (
            <Badge
              variant={priorityScore >= 80 ? "critical" : "warning"}
              className="text-[10px] px-1.5 py-0"
            >
              {priorityScore}%
            </Badge>
          )}
          {email.labelIds?.includes("STARRED") && (
            <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  );
}

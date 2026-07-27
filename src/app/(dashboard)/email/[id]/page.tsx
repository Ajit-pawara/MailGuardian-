"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEmailDetail } from "@/hooks/use-emails";
import { useClassification } from "@/hooks/use-classify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EmailDetailSkeleton } from "@/components/ui/skeleton";
import { formatFullDate } from "@/utils/date";
import { CATEGORY_LABELS } from "@/config/constants";

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: email, isLoading } = useEmailDetail(id);
  const { data: classification } = useClassification(id);

  if (isLoading) return <EmailDetailSkeleton />;
  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Email not found</p>
        <Button variant="link" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-4 lg:p-6 space-y-4"
    >
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Button>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold lg:text-2xl">{email.subject}</h1>
              <p className="text-sm text-muted-foreground">
                {formatFullDate(email.date || email.internalDate)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {classification && (
                <>
                  <Badge variant={classification.priorityScore >= 80 ? "critical" : classification.priorityScore >= 60 ? "warning" : "secondary"}>
                    {classification.priorityScore}% priority
                  </Badge>
                  {classification.category && (
                    <Badge variant="outline">
                      {CATEGORY_LABELS[classification.category] || classification.category}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 border-y py-4">
            <Avatar
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(email.from?.name || email.from?.address || '?')}&background=random`}
              alt={email.from?.name || email.from?.address}
              fallback={(email.from?.name || email.from?.address || "?")[0]}
            />
            <div>
              <p className="font-medium">{email.from?.name || email.from?.address}</p>
              <p className="text-sm text-muted-foreground">{email.from?.address}</p>
            </div>
          </div>

          {classification?.summary && (
            <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
              <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                AI Summary
              </div>
              <p className="text-sm leading-relaxed">{classification.summary}</p>
            </div>
          )}

          <div
            className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: email.bodyHtml || email.bodyText?.replace(/\n/g, "<br/>") || "<p>No content</p>",
            }}
          />

          {classification?.tasks && classification.tasks.length > 0 && (
            <div className="rounded-2xl border p-4 space-y-2">
              <h3 className="text-sm font-semibold">Extracted Tasks</h3>
              {classification.tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          )}

          {classification?.deadlines && classification.deadlines.length > 0 && (
            <div className="rounded-2xl border p-4 space-y-2">
              <h3 className="text-sm font-semibold">Deadlines</h3>
              {classification.deadlines.map((dl, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{dl.title}</span>
                  <span className="text-muted-foreground">– {new Date(dl.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}

          {email.attachments && email.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Attachments ({email.attachments.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {email.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`/api/gmail/attach/${email.id}?attachmentId=${att.id}`}
                    target="_blank"
                    className="flex items-center gap-2 rounded-xl border bg-secondary/30 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                    <span className="truncate max-w-[200px]">{att.filename}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({formatFileSize(att.size)})
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

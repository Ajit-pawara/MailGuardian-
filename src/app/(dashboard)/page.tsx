"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { EmailList } from "@/components/email/email-list";
import { StatsCardSkeleton, DashboardSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useEmails,
  useSyncEmails,
  useEmailAction,
} from "@/hooks/use-emails";
import { useEmailStats } from "@/hooks/use-analytics";
import { useEmailStore } from "@/store/email-store";
import { useAuthStore } from "@/store/auth-store";
import {
  formatRelativeDate,
  formatTimeAgo,
} from "@/utils/date";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const { data: emails, isLoading } = useEmails();
  const syncMutation = useSyncEmails();
  const emailAction = useEmailAction();
  const { data: stats, isLoading: statsLoading } = useEmailStats();
  const { user, isAuthenticated } = useAuthStore();

  const [filteredEmails, setFilteredEmails] = useState(emails || []);

  useEffect(() => {
    if (!emails) return;
    let filtered = [...emails];

    if (categoryFilter === "unread") {
      filtered = filtered.filter((e) => e.labelIds?.includes("UNREAD"));
    } else if (categoryFilter === "important") {
      filtered = filtered.filter((e) => e.labelIds?.includes("IMPORTANT"));
    } else if (categoryFilter === "starred") {
      filtered = filtered.filter((e) => e.labelIds?.includes("STARRED"));
    } else if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

    setFilteredEmails(filtered);
  }, [emails, categoryFilter]);

  const handleSync = useCallback(() => {
    syncMutation.mutate();
  }, [syncMutation]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))
        ) : (
          <>
            <StatCard
              title="Unread"
              value={stats?.unread ?? 0}
              icon={UnreadIcon}
              color="text-blue-500"
              delay={0}
            />
            <StatCard
              title="Important"
              value={stats?.important ?? 0}
              icon={ImportantIcon}
              color="text-amber-500"
              delay={0.05}
            />
            <StatCard
              title="Today"
              value={stats?.today ?? 0}
              icon={TodayIcon}
              color="text-emerald-500"
              delay={0.1}
            />
            <StatCard
              title="This Week"
              value={stats?.week ?? 0}
              icon={WeekIcon}
              color="text-purple-500"
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {categoryFilter
                ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Emails`
                : "Inbox"}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
              >
                <svg
                  className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                  />
                </svg>
                {syncMutation.isPending ? "Syncing..." : "Sync"}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <EmailList emails={filteredEmails} isLoading={isLoading} />
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <AIOverviewCard emails={emails || []} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user?.accounts?.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 rounded-xl bg-secondary/30 p-3"
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {account.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {account.lastSync
                          ? `Synced ${formatTimeAgo(account.lastSync)}`
                          : "Not synced yet"}
                      </p>
                    </div>
                  </div>
                ))}
                {(!user?.accounts || user.accounts.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No accounts connected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <QuickCategories emails={emails || []} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  delay,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold lg:text-3xl">{value}</p>
          </div>
          <div className={`rounded-2xl bg-background p-3 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function AIOverviewCard({ emails }: { emails: any[] }) {
  const unread = emails.filter((e) => e.is_unread).length;
  const important = emails.filter((e) => e.is_important_mail).length;
  const today = emails.filter(
    (e) =>
      e.internal_date &&
      new Date(e.internal_date).toDateString() === new Date().toDateString()
  ).length;
  const categories = new Set(emails.map((e) => e.category).filter(Boolean));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          AI Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Unread</span>
            <span className="font-medium">{unread}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Important</span>
            <span className="font-medium">{important}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today</span>
            <span className="font-medium">{today}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Categories</span>
            <span className="font-medium">{categories.size}</span>
          </div>
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground">
              {important > 0
                ? `${important} important email${important > 1 ? "s" : ""} need${important === 1 ? "s" : ""} your attention`
                : "No priority emails"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickCategories({ emails }: { emails: any[] }) {
  const categoryCount = new Map<string, number>();
  emails.forEach((e) => {
    if (e.category) {
      categoryCount.set(e.category, (categoryCount.get(e.category) || 0) + 1);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {Array.from(categoryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([cat, count]) => (
              <div
                key={cat}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/30 transition-colors"
              >
                <span className="capitalize">
                  {cat.replace(/_/g, " ")}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UnreadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}
function ImportantIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}
function TodayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function WeekIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

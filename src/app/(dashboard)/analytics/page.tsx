"use client";

import { motion } from "framer-motion";
import { useAnalytics } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { CategoryPieChart } from "@/components/dashboard/category-pie";
import { formatTimeAgo } from "@/utils/date";
import { CATEGORY_LABELS } from "@/config/constants";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) return <DashboardSkeleton />;

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-muted-foreground">No analytics data yet</h2>
        <p className="text-sm text-muted-foreground/60 mt-1">Sync your emails to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      >
        <StatCard label="Total Emails" value={analytics.totalEmails.toLocaleString()} />
        <StatCard label="Unread" value={analytics.unreadCount.toLocaleString()} />
        <StatCard label="Important" value={analytics.importantCount.toLocaleString()} />
        <StatCard label="Today" value={analytics.todayCount.toLocaleString()} />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={analytics.categoryDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Senders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topSenders.slice(0, 10).map((sender, i) => (
                <div
                  key={sender.email}
                  className="flex items-center justify-between rounded-xl bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground shrink-0 w-5">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sender.name || sender.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{sender.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary">{sender.count}</Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(sender.lastContact)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hourly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={analytics.hourlyActivity} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4 lg:p-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold lg:text-3xl mt-1">{value}</p>
      </Card>
    </motion.div>
  );
}

function ActivityHeatmap({
  data,
}: {
  data: { dayOfWeek: number; hour: number; count: number }[];
}) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const getIntensity = (day: number, hour: number) => {
    const entry = data.find((d) => d.dayOfWeek === day && d.hour === hour);
    if (!entry) return 0;
    return Math.round((entry.count / maxCount) * 4) + 1;
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[auto_repeat(24,minmax(0,1fr))] gap-1 text-xs">
        <div />
        {hours.map((h) => (
          <div key={h} className="text-center text-[10px] text-muted-foreground">
            {h.toString().padStart(2, "0")}
          </div>
        ))}
        {days.map((day, di) => (
          <>
            <div key={day} className="text-[10px] text-muted-foreground pr-1 flex items-center">
              {day}
            </div>
            {hours.map((h) => {
              const intensity = getIntensity(di, h);
              return (
                <div
                  key={`${di}-${h}`}
                  className="aspect-square rounded-sm transition-colors"
                  style={{
                    backgroundColor:
                      intensity === 0
                        ? "hsl(var(--muted) / 0.3)"
                        : `hsl(221, 83%, ${60 - intensity * 10}%)`,
                    opacity: intensity > 0 ? 0.4 + intensity * 0.15 : 0.3,
                  }}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

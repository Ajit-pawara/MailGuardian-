export interface DailyStats {
  date: string;
  received: number;
  read: number;
  important: number;
  sent: number;
}

export interface SenderStats {
  email: string;
  name: string;
  count: number;
  lastContact: Date;
}

export interface CategoryStats {
  category: string;
  label: string;
  count: number;
  color: string;
}

export interface HourlyActivity {
  hour: number;
  count: number;
  dayOfWeek: number;
}

export interface AnalyticsSummary {
  totalEmails: number;
  unreadCount: number;
  importantCount: number;
  todayCount: number;
  weekCount: number;
  dailyStats: DailyStats[];
  topSenders: SenderStats[];
  categoryDistribution: CategoryStats[];
  hourlyActivity: HourlyActivity[];
  mostActiveDay: string;
  averageResponseTime: number;
}

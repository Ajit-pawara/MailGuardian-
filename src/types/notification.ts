export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: NotificationCondition[];
  sound: string;
  vibration: boolean;
}

export interface NotificationCondition {
  field: "category" | "sender" | "subject" | "priority" | "hasAttachment" | "account";
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "is";
  value: string | number | boolean;
}

export interface AppNotification {
  id: string;
  emailId: string;
  accountEmail: string;
  subject: string;
  from: string;
  snippet: string;
  category: string;
  priorityScore: number;
  timestamp: Date;
  read: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  importantOnly: boolean;
  minPriority: number;
  soundEnabled: boolean;
  soundUrl: string;
  vibration: boolean;
  desktopEnabled: boolean;
  mobileEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  rules: NotificationRule[];
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
  createdAt: Date;
}

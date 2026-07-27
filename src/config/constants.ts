export const APP_NAME = "MailGuardian";
export const APP_TAGLINE = "Your Personal Email Command Center";
export const APP_DESCRIPTION =
  "Monitor multiple Gmail accounts, classify important emails, and get instant notifications.";

export const GMAIL_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export const SYNC_INTERVAL_MS = 60_000; // 1 minute
export const FULL_SYNC_INTERVAL_MS = 300_000; // 5 minutes
export const MAX_EMAILS_PER_SYNC = 50;
export const MAX_ATTACHMENT_SIZE_MB = 10;
export const RATE_LIMIT_REQUESTS = 60;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export const CATEGORIES = {
  critical: ["otp", "password_reset", "security_alert", "bank_transaction", "bug_bounty_response", "interview_invitation", "internship_acceptance"],
  important: ["professor", "assignment", "github", "invoice", "meeting", "recruiter", "college"],
  normal: ["friends", "general"],
  ignore: ["advertisement", "newsletter", "marketing", "shopping_promotion"],
  spam: ["spam"],
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  otp: "OTP",
  password_reset: "Password Reset",
  security_alert: "Security Alert",
  bank_transaction: "Bank Transaction",
  bug_bounty_response: "Bug Bounty",
  interview_invitation: "Interview",
  internship_acceptance: "Internship Accepted",
  professor: "Professor",
  assignment: "Assignment",
  github: "GitHub",
  invoice: "Invoice",
  meeting: "Meeting",
  recruiter: "Recruiter",
  college: "College",
  friends: "Friends",
  general: "General",
  advertisement: "Ad",
  newsletter: "Newsletter",
  marketing: "Marketing",
  shopping_promotion: "Shopping",
  spam: "Spam",
  critical: "Critical",
  important: "Important",
  normal: "Normal",
  ignore: "Ignore",
};

export const CATEGORY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  important: "#f97316",
  normal: "#22c55e",
  ignore: "#6b7280",
  spam: "#dc2626",
};

export const PRIORITY_THRESHOLDS = {
  critical: 80,
  important: 60,
  normal: 40,
  low: 20,
};

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिन्दी" },
  { code: "pt", label: "Português" },
] as const;

export const THEME_STORAGE_KEY = "mailguardian-theme";
export const ACCOUNTS_STORAGE_KEY = "mailguardian-accounts";
export const SETTINGS_STORAGE_KEY = "mailguardian-settings";
export const NOTIFICATION_RULES_KEY = "mailguardian-notification-rules";

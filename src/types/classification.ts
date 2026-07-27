export type Category =
  | "otp"
  | "password_reset"
  | "security_alert"
  | "bank_transaction"
  | "bug_bounty_response"
  | "interview_invitation"
  | "internship_acceptance"
  | "professor"
  | "assignment"
  | "github"
  | "invoice"
  | "meeting"
  | "recruiter"
  | "college"
  | "friends"
  | "general"
  | "advertisement"
  | "newsletter"
  | "marketing"
  | "shopping_promotion"
  | "spam";

export type CategoryGroup = "critical" | "important" | "normal" | "ignore" | "spam";

export interface ClassificationResult {
  category: Category;
  categoryGroup: CategoryGroup;
  priorityScore: number;
  isImportant: boolean;
  estimatedReadTimeSeconds: number;
  summary?: string;
  deadlines?: ExtractedDeadline[];
  tasks?: ExtractedTask[];
  people?: string[];
  links?: string[];
  meetingInfo?: MeetingInfo;
  confidence: number;
}

export interface ExtractedDeadline {
  title: string;
  date: Date;
  description?: string;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  assignee?: string;
}

export interface MeetingInfo {
  title?: string;
  date?: Date;
  time?: string;
  duration?: string;
  participants?: string[];
  location?: string;
  link?: string;
}

export interface ClassifyRequest {
  emailId: string;
  subject: string;
  bodyText: string;
  from: string;
  to: string[];
  date: string;
  attachments?: { filename: string; mimeType: string }[];
}

export interface ClassifyResponse {
  emailId: string;
  classification: ClassificationResult;
}

export type ClassifyMethod = "local" | "ai";

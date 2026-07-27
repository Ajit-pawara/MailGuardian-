export interface EmailAddress {
  name: string;
  address: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: string;
  headers?: Record<string, string>;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  accountId: string;
  accountEmail: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload?: EmailPayload;
  sizeEstimate: number;
  raw?: string;

  // Parsed fields
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  date: Date;
  bodyHtml?: string;
  bodyText?: string;
  attachments: EmailAttachment[];
  headers: Record<string, string>;
}

export interface EmailPayload {
  partId: string;
  mimeType: string;
  filename: string;
  headers: EmailHeader[];
  body: EmailBody;
  parts?: EmailPayload[];
}

export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailBody {
  size: number;
  data?: string;
  attachmentId?: string;
}

export interface EmailListParams {
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  q?: string;
  includeSpamTrash?: boolean;
}

export interface EmailListResponse {
  messages: EmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface EmailSyncState {
  lastSync: Date;
  historyId: string;
  accountId: string;
  status: "idle" | "syncing" | "error" | "success";
  error?: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

export interface EmailDraft {
  id: string;
  message: Partial<EmailMessage>;
}

export type EmailAction =
  | { type: "archive"; ids: string[] }
  | { type: "trash"; ids: string[] }
  | { type: "delete"; ids: string[] }
  | { type: "markRead"; ids: string[] }
  | { type: "markUnread"; ids: string[] }
  | { type: "star"; ids: string[] }
  | { type: "unstar"; ids: string[] }
  | { type: "addLabel"; ids: string[]; labelId: string }
  | { type: "removeLabel"; ids: string[]; labelId: string }
  | { type: "markImportant"; ids: string[] }
  | { type: "markNotImportant"; ids: string[] };

import { google } from "googleapis";
import type { EmailMessage, EmailListParams, EmailListResponse, EmailLabel, EmailAttachment } from "@/types/email";
import { parseEmailPayload, decodeBase64 } from "@/utils/email-helpers";

const gmail = google.gmail("v1");

export function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function fetchEmails(
  accessToken: string,
  accountId: string,
  accountEmail: string,
  params: EmailListParams = {}
): Promise<EmailListResponse> {
  const gmailClient = getGmailClient(accessToken);

  const response = await gmailClient.users.messages.list({
    userId: "me",
    maxResults: params.maxResults || 50,
    pageToken: params.pageToken,
    labelIds: params.labelIds,
    q: params.q,
    includeSpamTrash: params.includeSpamTrash,
  });

  const messagesList = response.data.messages || [];
  const messages: EmailMessage[] = [];

  for (const msg of messagesList) {
    try {
      const detail = await gmailClient.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });

      const payload = detail.data.payload;
      const parsed = parseEmailPayload(payload, accountId, accountEmail);

      const email: EmailMessage = {
        id: detail.data.id!,
        threadId: detail.data.threadId!,
        accountId,
        accountEmail,
        labelIds: detail.data.labelIds || [],
        snippet: detail.data.snippet || "",
        historyId: detail.data.historyId || "",
        internalDate: detail.data.internalDate || String(Date.now()),
        payload,
        sizeEstimate: detail.data.sizeEstimate || 0,
        ...parsed,
      };

      messages.push(email);
    } catch (err) {
      console.error(`Failed to fetch email ${msg.id}:`, err);
    }
  }

  return {
    messages,
    nextPageToken: response.data.nextPageToken || undefined,
    resultSizeEstimate: response.data.resultSizeEstimate || 0,
  };
}

export async function fetchEmailById(
  accessToken: string,
  accountId: string,
  accountEmail: string,
  emailId: string,
  format: "full" | "minimal" | "raw" | "metadata" = "full"
): Promise<EmailMessage | null> {
  const gmailClient = getGmailClient(accessToken);

  try {
    const response = await gmailClient.users.messages.get({
      userId: "me",
      id: emailId,
      format,
    });

    const payload = response.data.payload;
    const parsed = parseEmailPayload(payload, accountId, accountEmail);

    return {
      id: response.data.id!,
      threadId: response.data.threadId!,
      accountId,
      accountEmail,
      labelIds: response.data.labelIds || [],
      snippet: response.data.snippet || "",
      historyId: response.data.historyId || "",
      internalDate: response.data.internalDate || String(Date.now()),
      payload,
      sizeEstimate: response.data.sizeEstimate || 0,
      ...parsed,
    };
  } catch (err) {
    console.error(`Failed to fetch email ${emailId}:`, err);
    return null;
  }
}

export async function downloadAttachment(
  accessToken: string,
  emailId: string,
  attachmentId: string
): Promise<EmailAttachment | null> {
  const gmailClient = getGmailClient(accessToken);

  try {
    const response = await gmailClient.users.messages.attachments.get({
      userId: "me",
      messageId: emailId,
      id: attachmentId,
    });

    const data = response.data.data
      ? decodeBase64(response.data.data)
      : "";

    return {
      id: attachmentId,
      filename: response.data.filename || "attachment",
      mimeType: response.data.mimeType || "application/octet-stream",
      size: response.data.size || 0,
      data,
    };
  } catch (err) {
    console.error(`Failed to download attachment ${attachmentId}:`, err);
    return null;
  }
}

export async function modifyEmail(
  accessToken: string,
  emailId: string,
  modifications: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }
): Promise<boolean> {
  const gmailClient = getGmailClient(accessToken);

  try {
    await gmailClient.users.messages.modify({
      userId: "me",
      id: emailId,
      requestBody: modifications,
    });
    return true;
  } catch (err) {
    console.error(`Failed to modify email ${emailId}:`, err);
    return false;
  }
}

export async function batchModifyEmails(
  accessToken: string,
  emailIds: string[],
  modifications: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }
): Promise<boolean> {
  const gmailClient = getGmailClient(accessToken);

  try {
    await gmailClient.users.messages.batchModify({
      userId: "me",
      requestBody: {
        ids: emailIds,
        ...modifications,
      },
    });
    return true;
  } catch (err) {
    console.error("Failed to batch modify emails:", err);
    return false;
  }
}

export async function trashEmail(accessToken: string, emailId: string): Promise<boolean> {
  const gmailClient = getGmailClient(accessToken);
  try {
    await gmailClient.users.messages.trash({ userId: "me", id: emailId });
    return true;
  } catch (err) {
    console.error(`Failed to trash email ${emailId}:`, err);
    return false;
  }
}

export async function deleteEmail(accessToken: string, emailId: string): Promise<boolean> {
  const gmailClient = getGmailClient(accessToken);
  try {
    await gmailClient.users.messages.delete({ userId: "me", id: emailId });
    return true;
  } catch (err) {
    console.error(`Failed to delete email ${emailId}:`, err);
    return false;
  }
}

export async function fetchLabels(
  accessToken: string
): Promise<EmailLabel[]> {
  const gmailClient = getGmailClient(accessToken);

  try {
    const response = await gmailClient.users.labels.list({
      userId: "me",
    });
    return (response.data.labels || []).map((label) => ({
      id: label.id!,
      name: label.name!,
      type: (label.type as "system" | "user") || "user",
      color: label.color
        ? {
            textColor: label.color.textColor || "#000000",
            backgroundColor: label.color.backgroundColor || "#ffffff",
          }
        : undefined,
    }));
  } catch (err) {
    console.error("Failed to fetch labels:", err);
    return [];
  }
}

export async function fetchProfile(accessToken: string): Promise<{
  email: string;
  name: string;
  avatarUrl: string;
} | null> {
  const oauth2 = google.oauth2("v2");
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  try {
    const { data } = await oauth2.userinfo.get({ auth });
    return {
      email: data.email || "",
      name: data.name || data.email || "",
      avatarUrl: data.picture || "",
    };
  } catch {
    return null;
  }
}

export async function checkHistory(
  accessToken: string,
  historyId: string
): Promise<{ historyId: string; changes: number }> {
  const gmailClient = getGmailClient(accessToken);

  try {
    const response = await gmailClient.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded", "messageDeleted", "labelAdded", "labelRemoved"],
    });

    return {
      historyId: response.data.historyId || historyId,
      changes: response.data.history?.length || 0,
    };
  } catch {
    return { historyId, changes: 0 };
  }
}

export async function searchEmails(
  accessToken: string,
  accountId: string,
  accountEmail: string,
  query: string,
  pageToken?: string,
  maxResults: number = 20
): Promise<EmailListResponse> {
  return fetchEmails(accessToken, accountId, accountEmail, {
    q: query,
    pageToken,
    maxResults,
  });
}

export async function getUnreadCount(accessToken: string): Promise<number> {
  const gmailClient = getGmailClient(accessToken);

  try {
    const response = await gmailClient.users.messages.list({
      userId: "me",
      labelIds: ["UNREAD"],
      maxResults: 0,
    });
    return response.data.resultSizeEstimate || 0;
  } catch {
    return 0;
  }
}

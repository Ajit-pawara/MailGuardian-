import type { EmailMessage, EmailHeader, EmailAttachment, EmailAddress, EmailPayload } from "@/types/email";

export function parseEmailAddress(raw: string): EmailAddress {
  const match = raw.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (!match) {
    return { name: "", address: raw.trim() };
  }
  return {
    name: (match[1] || "").trim(),
    address: (match[2] || "").trim(),
  };
}

export function parseAddressList(raw: string): EmailAddress[] {
  if (!raw) return [];
  return raw.split(",").map((addr) => parseEmailAddress(addr.trim()));
}

export function getHeader(headers: EmailHeader[], name: string): string | undefined {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
}

export function decodeBase64(data: string): string {
  try {
    return Buffer.from(data, "base64").toString("utf-8");
  } catch {
    try {
      return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    } catch {
      return data;
    }
  }
}

export function parseEmailPayload(
  payload: EmailMessage["payload"],
  accountId: string,
  accountEmail: string
): Partial<EmailMessage> {
  if (!payload) return {};

  const headers = payload.headers;
  const subject = getHeader(headers, "subject") || "(no subject)";
  const from = parseEmailAddress(getHeader(headers, "from") || "");
  const to = parseAddressList(getHeader(headers, "to") || "");
  const cc = parseAddressList(getHeader(headers, "cc") || "");
  const date = new Date(parseInt(payload.headers.find((h) => h.name === "Date")?.value || "0") || getHeader(headers, "date") || "");

  const { html, text, attachments } = extractBodyAndAttachments(payload);

  return {
    accountId,
    accountEmail,
    subject,
    from,
    to,
    cc,
    date,
    bodyHtml: html,
    bodyText: text,
    attachments,
    headers: headers.reduce((acc, h) => {
      acc[h.name] = h.value;
      return acc;
    }, {} as Record<string, string>),
  };
}

function extractBodyAndAttachments(
  payload: EmailMessage["payload"]
): { html?: string; text?: string; attachments: EmailAttachment[] } {
  let html: string | undefined;
  let text: string | undefined;
  const attachments: EmailAttachment[] = [];

  if (!payload) return { attachments };

  function walk(part: EmailPayload) {
    if (part.mimeType === "text/plain" && part.body.data) {
      text = decodeBase64(part.body.data);
    } else if (part.mimeType === "text/html" && part.body.data) {
      html = decodeBase64(part.body.data);
    } else if (part.filename && part.body.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
      });
    }
    if (part.parts) {
      part.parts.forEach(walk);
    }
  }

  if (payload.parts) {
    payload.parts.forEach(walk);
  } else if (payload.body.data) {
    if (payload.mimeType === "text/html") {
      html = decodeBase64(payload.body.data);
    } else {
      text = decodeBase64(payload.body.data);
    }
  }

  return { html, text, attachments };
}

export function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export function extractDomain(email: string): string {
  return email.split("@")[1] || "";
}

export function isSameSender(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function groupEmailsByThread(emails: EmailMessage[]): Map<string, EmailMessage[]> {
  const threads = new Map<string, EmailMessage[]>();
  for (const email of emails) {
    const existing = threads.get(email.threadId) || [];
    existing.push(email);
    threads.set(email.threadId, existing);
  }
  return threads;
}

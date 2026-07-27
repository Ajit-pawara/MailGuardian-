import { getSupabaseAdmin } from "./supabase";
import { fetchEmails, checkHistory } from "./gmail";
import { batchClassify } from "./classify";
import { decryptToken } from "@/utils/crypto";
import { MAX_EMAILS_PER_SYNC, FULL_SYNC_INTERVAL_MS } from "@/config/constants";
import type { MailAccount } from "@/types/auth";
import type { ClassificationResult } from "@/types/classification";

export async function syncAccount(accountId: string): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const { data: account, error: acctErr } = await getSupabaseAdmin()
      .from("mail_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (acctErr || !account) {
      return { synced: 0, errors: [`Account not found: ${acctErr?.message}`] };
    }

    await updateSyncStatus(accountId, "syncing");

    let accessToken: string;
    try {
      accessToken = decryptToken(account.access_token);
    } catch {
      errors.push("Failed to decrypt access token");
      await updateSyncStatus(accountId, "error", errors[0]);
      return { synced: 0, errors };
    }

    const emailsResponse = await fetchEmails(accessToken, accountId, account.email, {
      maxResults: MAX_EMAILS_PER_SYNC,
    });

    let synced = 0;
    for (const email of emailsResponse.messages) {
      try {
        await upsertEmail(email);
        synced++;
      } catch (err) {
        errors.push(`Failed to sync email ${email.id}: ${err}`);
      }
    }

    // Classify emails
    if (synced > 0) {
      const { data: newEmails } = await getSupabaseAdmin()
        .from("emails")
        .select("id, subject, from_address, snippet, body_text, internal_date")
        .eq("account_id", accountId)
        .is("category", null)
        .limit(MAX_EMAILS_PER_SYNC);

      if (newEmails && newEmails.length > 0) {
        const classifyReqs = newEmails.map((e) => ({
          emailId: e.id,
          subject: e.subject,
          bodyText: (e.snippet || "") + "\n" + (e.body_text || ""),
          from: e.from_address,
          to: [],
          date: e.internal_date,
        }));

        const classifications = await batchClassify(classifyReqs);
        await updateClassifications(accountId, classifications);
      }
    }

    await getSupabaseAdmin()
      .from("mail_accounts")
      .update({
        last_sync: new Date().toISOString(),
        history_id: emailsResponse.messages[0]?.historyId || account.history_id,
      })
      .eq("id", accountId);

    await updateSyncStatus(accountId, "success", undefined, synced);

    return { synced, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    errors.push(msg);
    await updateSyncStatus(accountId, "error", msg);
    return { synced: 0, errors };
  }
}

async function upsertEmail(email: import("@/types/email").EmailMessage): Promise<void> {
  const { error } = await getSupabaseAdmin().from("emails").upsert(
    {
      id: email.id,
      account_id: email.accountId,
      thread_id: email.threadId,
      label_ids: email.labelIds,
      history_id: email.historyId,
      internal_date: new Date(parseInt(email.internalDate)).toISOString(),
      size_estimate: email.sizeEstimate,
      from_name: email.from.name,
      from_address: email.from.address,
      to_addresses: email.to.map((t) => t.address),
      cc_addresses: (email.cc || []).map((c) => c.address),
      subject: email.subject,
      snippet: email.snippet,
      body_text: email.bodyText,
      body_html: email.bodyHtml,
      headers: email.headers,
      is_unread: email.labelIds.includes("UNREAD"),
      is_starred: email.labelIds.includes("STARRED"),
      is_important_mail: email.labelIds.includes("IMPORTANT"),
      is_deleted: email.labelIds.includes("TRASH"),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id,account_id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    console.error(`Error upserting email ${email.id}:`, error);
    throw error;
  }

  // Insert attachments
  if (email.attachments.length > 0) {
    for (const att of email.attachments) {
      await getSupabaseAdmin().from("attachments").upsert(
        {
          email_id: email.id,
          attachment_id: att.id,
          filename: att.filename,
          mime_type: att.mimeType,
          size: att.size,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }
  }
}

async function updateClassifications(
  accountId: string,
  classifications: Map<string, ClassificationResult>
): Promise<void> {
  for (const [emailId, result] of classifications) {
    const { error } = await getSupabaseAdmin()
      .from("emails")
      .update({
        category: result.category,
        category_group: result.categoryGroup,
        priority_score: result.priorityScore,
        ai_summary: result.summary || null,
        estimated_read_time_seconds: result.estimatedReadTimeSeconds,
        classification_confidence: result.confidence,
        deadlines: result.deadlines ? JSON.stringify(result.deadlines) : null,
        tasks: result.tasks ? JSON.stringify(result.tasks) : null,
        people: result.people || [],
        links: result.links || [],
        meeting_info: result.meetingInfo ? JSON.stringify(result.meetingInfo) : null,
      })
      .eq("id", emailId)
      .eq("account_id", accountId);

    if (error) {
      console.error(`Error updating classification for ${emailId}:`, error);
    }
  }
}

async function updateSyncStatus(
  accountId: string,
  status: string,
  errorMessage?: string,
  emailsSynced?: number
): Promise<void> {
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (errorMessage) update.error_message = errorMessage;
  if (emailsSynced !== undefined) update.emails_synced = emailsSynced;
  if (status === "success") update.last_partial_sync = new Date().toISOString();

  await getSupabaseAdmin().from("sync_state").upsert(
    {
      account_id: accountId,
      ...update,
    },
    { onConflict: "account_id" }
  );
}

export async function syncAllAccounts(): Promise<{
  total: number;
  errors: string[];
}> {
  const { data: accounts } = await getSupabaseAdmin()
    .from("mail_accounts")
    .select("id")
    .eq("is_active", true);

  if (!accounts) return { total: 0, errors: [] };

  let total = 0;
  const errors: string[] = [];

  for (const account of accounts) {
    const result = await syncAccount(account.id);
    total += result.synced;
    errors.push(...result.errors);
  }

  return { total, errors };
}

export async function getSyncStatus(accountId: string) {
  const { data } = await getSupabaseAdmin()
    .from("sync_state")
    .select("*")
    .eq("account_id", accountId)
    .single();

  return data;
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase";
import { decryptToken } from "@/utils/crypto";
import { fetchEmails, fetchEmailById, modifyEmail, batchModifyEmails, trashEmail, deleteEmail } from "@/services/gmail";
import { rateLimit, getRateLimitKey } from "@/utils/rate-limit";
import type { EmailAction } from "@/types/email";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const emailId = searchParams.get("id");
    const query = searchParams.get("q");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    let dbQuery = getSupabaseAdmin()
      .from("emails")
      .select("*")
      .order("internal_date", { ascending: false });

    if (accountId) {
      dbQuery = dbQuery.eq("account_id", accountId);
    }

    if (emailId) {
      const { data } = await getSupabaseAdmin()
        .from("emails")
        .select("*")
        .eq("id", emailId)
        .single();
      return NextResponse.json(data || null);
    }

    if (query) {
      dbQuery = dbQuery.or(
        `subject.ilike.%${query}%,from_address.ilike.%${query}%,snippet.ilike.%${query}%`
      );
    }

    if (category) {
      dbQuery = dbQuery.eq("category", category);
    }

    const from = searchParams.get("from");
    if (from) dbQuery = dbQuery.ilike("from_address", `%${from}%`);

    const after = searchParams.get("after");
    if (after) dbQuery = dbQuery.gte("internal_date", after);

    const before = searchParams.get("before");
    if (before) dbQuery = dbQuery.lte("internal_date", before);

    const { data, count } = await dbQuery
      .range((page - 1) * limit, page * limit - 1);

    return NextResponse.json({
      messages: data || [],
      total: count || 0,
      page,
      hasMore: ((page) * limit) < (count || 0),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await rateLimit(getRateLimitKey(`email-action:${ip}`), 30, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const action: EmailAction = await req.json();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await getSupabaseAdmin().auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get accounts for the user
    const { data: accounts } = await getSupabaseAdmin()
      .from("mail_accounts")
      .select("id, access_token")
      .eq("user_id", user.id);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found" }, { status: 404 });
    }

    let success = false;

    for (const account of accounts) {
      const accessToken = decryptToken(account.access_token);

      switch (action.type) {
        case "archive":
          success = await batchModifyEmails(accessToken, action.ids, {
            removeLabelIds: ["INBOX"],
          });
          break;
        case "trash":
          for (const id of action.ids) {
            success = await trashEmail(accessToken, id);
            if (!success) break;
          }
          break;
        case "delete":
          for (const id of action.ids) {
            success = await deleteEmail(accessToken, id);
            if (!success) break;
          }
          break;
        case "markRead":
          success = await batchModifyEmails(accessToken, action.ids, {
            removeLabelIds: ["UNREAD"],
          });
          break;
        case "markUnread":
          success = await batchModifyEmails(accessToken, action.ids, {
            addLabelIds: ["UNREAD"],
          });
          break;
        case "star":
          success = await batchModifyEmails(accessToken, action.ids, {
            addLabelIds: ["STARRED"],
          });
          break;
        case "unstar":
          success = await batchModifyEmails(accessToken, action.ids, {
            removeLabelIds: ["STARRED"],
          });
          break;
        case "addLabel":
          success = await batchModifyEmails(accessToken, action.ids, {
            addLabelIds: [action.labelId],
          });
          break;
        case "removeLabel":
          success = await batchModifyEmails(accessToken, action.ids, {
            removeLabelIds: [action.labelId],
          });
          break;
        case "markImportant":
          success = await batchModifyEmails(accessToken, action.ids, {
            addLabelIds: ["IMPORTANT"],
          });
          break;
        case "markNotImportant":
          success = await batchModifyEmails(accessToken, action.ids, {
            removeLabelIds: ["IMPORTANT"],
          });
          break;
      }
    }

    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}

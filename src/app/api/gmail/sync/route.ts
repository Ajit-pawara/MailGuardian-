import { NextRequest, NextResponse } from "next/server";
import { syncAccount, syncAllAccounts, getSyncStatus } from "@/services/sync";
import { rateLimit, getRateLimitKey } from "@/utils/rate-limit";
import { getSupabaseAdmin } from "@/services/supabase";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await rateLimit(getRateLimitKey(`sync:${ip}`), 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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

    const body = await req.json().catch(() => ({}));
    const accountId = body.accountId;

    let synced = 0;
    let errors: string[] = [];

    if (accountId) {
      const { data: account } = await getSupabaseAdmin()
        .from("mail_accounts")
        .select("id")
        .eq("id", accountId)
        .eq("user_id", user.id)
        .single();

      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      const r = await syncAccount(accountId);
      synced = r.synced;
      errors = r.errors;
    } else {
      const r = await syncAllAccounts();
      synced = r.total;
      errors = r.errors;
    }

    return NextResponse.json({
      synced,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ status: "unknown" });
    }

    const status = await getSyncStatus(accountId);
    return NextResponse.json(status || { status: "not_found" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}

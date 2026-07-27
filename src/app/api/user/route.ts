import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase";

export async function GET(req: NextRequest) {
  try {
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

    const { searchParams } = new URL(req.url);

    // Analytics
    if (searchParams.get("analytics") === "true") {
      const accountId = searchParams.get("accountId");

      let query = getSupabaseAdmin().from("emails").select("*");
      if (accountId) query = query.eq("account_id", accountId);

      const { data: emails } = await query;

      if (!emails) {
        return NextResponse.json({ error: "No data" }, { status: 404 });
      }

      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const todayEmails = emails.filter((e) =>
        e.internal_date?.startsWith(today)
      );
      const weekEmails = emails.filter(
        (e) => e.internal_date && e.internal_date >= weekAgo
      );
      const unread = emails.filter((e) => e.is_unread);

      // Category distribution
      const categoryMap = new Map<string, number>();
      emails.forEach((e) => {
        const cat = e.category || "uncategorized";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });

      // Top senders
      const senderMap = new Map<string, { name: string; count: number; lastContact: string }>();
      emails.forEach((e) => {
        const existing = senderMap.get(e.from_address) || {
          name: e.from_name,
          count: 0,
          lastContact: e.internal_date,
        };
        existing.count++;
        if (e.internal_date > existing.lastContact) existing.lastContact = e.internal_date;
        senderMap.set(e.from_address, existing);
      });

      const topSenders = Array.from(senderMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([email, data]) => ({
          email,
          name: data.name,
          count: data.count,
          lastContact: new Date(data.lastContact),
        }));

      // Hourly activity
      const hourlyMap = new Map<string, number>();
      emails.forEach((e) => {
        if (e.internal_date) {
          const d = new Date(e.internal_date);
          const key = `${d.getDay()}-${d.getHours()}`;
          hourlyMap.set(key, (hourlyMap.get(key) || 0) + 1);
        }
      });

      return NextResponse.json({
        totalEmails: emails.length,
        unreadCount: unread.length,
        importantCount: emails.filter((e) => e.is_important_mail).length,
        todayCount: todayEmails.length,
        weekCount: weekEmails.length,
        categoryDistribution: Array.from(categoryMap.entries()).map(
          ([category, count]) => ({
            category,
            count,
          })
        ),
        topSenders,
        hourlyActivity: Array.from(hourlyMap.entries()).map(
          ([key, count]) => {
            const [dayOfWeek, hour] = key.split("-").map(Number);
            return { dayOfWeek, hour, count };
          }
        ),
      });
    }

    // Quick stats
    if (searchParams.get("stats") === "true") {
      const { data: accounts } = await getSupabaseAdmin()
        .from("mail_accounts")
        .select("id")
        .eq("user_id", user.id);

      if (!accounts || accounts.length === 0) {
        return NextResponse.json({ unread: 0, important: 0, today: 0, week: 0 });
      }

      const accountIds = accounts.map((a) => a.id);

      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [unreadRes, importantRes, todayRes, weekRes] = await Promise.all([
        getSupabaseAdmin()
          .from("emails")
          .select("id", { count: "exact", head: true })
          .in("account_id", accountIds)
          .eq("is_unread", true),
        getSupabaseAdmin()
          .from("emails")
          .select("id", { count: "exact", head: true })
          .in("account_id", accountIds)
          .eq("is_important_mail", true),
        getSupabaseAdmin()
          .from("emails")
          .select("id", { count: "exact", head: true })
          .in("account_id", accountIds)
          .gte("internal_date", today),
        getSupabaseAdmin()
          .from("emails")
          .select("id", { count: "exact", head: true })
          .in("account_id", accountIds)
          .gte("internal_date", weekAgo),
      ]);

      return NextResponse.json({
        unread: unreadRes.count || 0,
        important: importantRes.count || 0,
        today: todayRes.count || 0,
        week: weekRes.count || 0,
      });
    }

    // Profile
    const { data: accounts } = await getSupabaseAdmin()
      .from("mail_accounts")
      .select("id, email, name, avatar_url, is_active, last_sync, created_at")
      .eq("user_id", user.id);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      avatarUrl: user.user_metadata?.avatar_url || "",
      accounts: accounts || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
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

    const { data: accounts } = await getSupabaseAdmin()
      .from("mail_accounts")
      .select("id")
      .eq("user_id", user.id);

    if (accounts) {
      for (const account of accounts) {
        await getSupabaseAdmin().from("attachments").delete().eq(
          "email_id",
          getSupabaseAdmin().from("emails").select("id").eq("account_id", account.id) as any
        );
      }
    }

    await Promise.all([
      getSupabaseAdmin().from("push_subscriptions").delete().eq("user_id", user.id),
      getSupabaseAdmin().from("notification_log").delete().eq("user_id", user.id),
      getSupabaseAdmin().from("user_settings").delete().eq("user_id", user.id),
      getSupabaseAdmin().from("emails").delete().in(
        "account_id",
        (accounts || []).map((a) => a.id)
      ),
      getSupabaseAdmin().from("sync_state").delete().in(
        "account_id",
        (accounts || []).map((a) => a.id)
      ),
      getSupabaseAdmin().from("mail_accounts").delete().eq("user_id", user.id),
      getSupabaseAdmin().from("users").delete().eq("id", user.id),
    ]);

    await getSupabaseAdmin().auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

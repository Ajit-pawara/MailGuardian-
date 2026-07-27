import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase";
import { decryptToken } from "@/utils/crypto";
import { fetchLabels } from "@/services/gmail";

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

    const labelMap: Record<string, { id: string; name: string; type: string }[]> = {};

    const { data: accounts } = await getSupabaseAdmin()
      .from("mail_accounts")
      .select("id, access_token")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!accounts) {
      return NextResponse.json({ labels: [] });
    }

    for (const account of accounts) {
      try {
        const accessToken = decryptToken(account.access_token);
        const labels = await fetchLabels(accessToken);
        labelMap[account.id] = labels;
      } catch {
        continue;
      }
    }

    return NextResponse.json({ labels: labelMap });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}

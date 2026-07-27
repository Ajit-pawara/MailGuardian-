import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase";
import { subscribeUser } from "@/services/notifications";
import { pushSubscriptionSchema } from "@/utils/validation";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsed = pushSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid subscription", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const success = await subscribeUser(
      user.id,
      parsed.data,
      req.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

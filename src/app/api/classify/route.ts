import { NextRequest, NextResponse } from "next/server";
import { classifyEmail } from "@/services/classify";
import { getSupabaseAdmin } from "@/services/supabase";
import { rateLimit, getRateLimitKey } from "@/utils/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailId = searchParams.get("emailId");

    if (!emailId) {
      return NextResponse.json({ error: "emailId required" }, { status: 400 });
    }

    const { data: email } = await getSupabaseAdmin()
      .from("emails")
      .select("id, subject, from_address, snippet, body_text, internal_date, to_addresses")
      .eq("id", emailId)
      .single();

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const result = await classifyEmail({
      emailId: email.id,
      subject: email.subject,
      bodyText: (email.snippet || "") + "\n" + (email.body_text || ""),
      from: email.from_address,
      to: email.to_addresses || [],
      date: email.internal_date,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await rateLimit(getRateLimitKey(`classify:${ip}`), 20, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { emailId } = await req.json();

    if (!emailId) {
      return NextResponse.json({ error: "emailId required" }, { status: 400 });
    }

    const { data: email } = await getSupabaseAdmin()
      .from("emails")
      .select("id, subject, from_address, snippet, body_text, internal_date")
      .eq("id", emailId)
      .single();

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const result = await classifyEmail({
      emailId: email.id,
      subject: email.subject,
      bodyText: (email.snippet || "") + "\n" + (email.body_text || ""),
      from: email.from_address,
      to: [],
      date: email.internal_date,
    });

    // Store classification
    await getSupabaseAdmin()
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
      .eq("id", emailId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase";
import { decryptToken } from "@/utils/crypto";
import { downloadAttachment } from "@/services/gmail";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: emailId } = await params;
    const attachmentId = req.nextUrl.searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json(
        { error: "attachmentId required" },
        { status: 400 }
      );
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

    // Get account for this email
    const { data: email } = await getSupabaseAdmin()
      .from("emails")
      .select("account_id")
      .eq("id", emailId)
      .single();

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const { data: account } = await getSupabaseAdmin()
      .from("mail_accounts")
      .select("access_token")
      .eq("id", email.account_id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const accessToken = decryptToken(account.access_token);
    const attachment = await downloadAttachment(accessToken, emailId, attachmentId);

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    return new NextResponse(Buffer.from(attachment.data || "", "base64"), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
        "Content-Length": String(attachment.size),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to download attachment" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { google } from "googleapis";
import { env } from "@/config/env";
import { GMAIL_SCOPES } from "@/config/constants";

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.APP_URL}/api/auth/callback`
);

export async function GET() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
    include_granted_scopes: true,
  });

  return NextResponse.redirect(authUrl);
}

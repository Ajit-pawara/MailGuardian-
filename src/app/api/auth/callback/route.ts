import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { getSupabaseAdmin } from "@/services/supabase";
import { encryptToken } from "@/utils/crypto";

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.APP_URL}/api/auth/callback`
);

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", env.APP_URL));
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2("v2");
    const { data: profile } = await oauth2.userinfo.get({ auth: oauth2Client });

    if (!profile.email) {
      return NextResponse.redirect(new URL("/login?error=no_email", env.APP_URL));
    }

    // Sign in with Supabase using the Google ID token
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    if (tokens.id_token) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: tokens.id_token,
      });
      if (error) {
        console.error("Supabase signInWithIdToken error:", error);
      } else {
        accessToken = data.session?.access_token;
        refreshToken = data.session?.refresh_token;
      }
    }

    if (!accessToken) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", env.APP_URL));
    }

    const supabaseUserId = (await supabase.auth.getUser(accessToken)).data.user?.id;

    // Upsert user in our public table
    const { data: existingUser } = await getSupabaseAdmin()
      .from("users")
      .select("id")
      .eq("email", profile.email)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await getSupabaseAdmin()
        .from("users")
        .update({
          name: profile.name || profile.email,
          avatar_url: profile.picture,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } else {
      const { data: newUser } = await getSupabaseAdmin()
        .from("users")
        .insert({
          id: supabaseUserId,
          email: profile.email,
          name: profile.name || profile.email,
          avatar_url: profile.picture,
        })
        .select("id")
        .single();

      if (!newUser) throw new Error("Failed to create user");
      userId = newUser.id;
    }

    // Store mail account with encrypted tokens
    const encryptedAccess = encryptToken(tokens.access_token!);
    const encryptedRefresh = encryptToken(tokens.refresh_token || "");

    await getSupabaseAdmin().from("mail_accounts").upsert(
      {
        user_id: userId,
        email: profile.email,
        name: profile.name || profile.email,
        avatar_url: profile.picture,
        provider: "gmail",
        provider_account_id: profile.id || profile.email,
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        expires_at: tokens.expiry_date || Date.now() + 3600000,
        scope: tokens.scope || "",
        token_type: tokens.token_type || "Bearer",
        is_active: true,
      },
      {
        onConflict: "user_id,email",
        ignoreDuplicates: false,
      }
    );

    // Initialize sync state
    const { data: account } = await getSupabaseAdmin()
      .from("mail_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("email", profile.email)
      .single();

    if (account) {
      await getSupabaseAdmin().from("sync_state").upsert(
        {
          account_id: account.id,
          status: "pending",
        },
        { onConflict: "account_id" }
      );
    }

    // Initialize default settings
    await getSupabaseAdmin().from("user_settings").upsert(
      {
        user_id: userId,
      },
      { onConflict: "user_id" }
    );

    const redirectUrl = new URL("/", env.APP_URL);

    if (accessToken && refreshToken) {
      redirectUrl.searchParams.set("setup", "true");
      redirectUrl.searchParams.set("access_token", accessToken);
      redirectUrl.searchParams.set("refresh_token", refreshToken);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", env.APP_URL));
  }
}

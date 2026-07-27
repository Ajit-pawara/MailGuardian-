import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase";
import { env } from "@/config/env";
import type { PushSubscriptionData, AppNotification } from "@/types/notification";

let webPush: typeof import("web-push") | null = null;

async function getWebPush() {
  if (!webPush) {
    webPush = await import("web-push");
    webPush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
  }
  return webPush;
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  notification: AppNotification
): Promise<boolean> {
  try {
    const wp = await getWebPush();
    await wp.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      JSON.stringify({
        title: notification.from,
        body: notification.subject,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag: notification.emailId,
        data: {
          url: `/email/${notification.emailId}`,
          emailId: notification.emailId,
          accountEmail: notification.accountEmail,
          priorityScore: notification.priorityScore,
        },
        vibrate: [200, 100, 200],
        requireInteraction: true,
      })
    );
    return true;
  } catch (err) {
    console.error("Failed to send push notification:", err);
    return false;
  }
}

export async function notifyUser(
  userId: string,
  notification: AppNotification
): Promise<boolean> {
  const { data: prefs } = await getSupabaseAdmin()
    .from("user_settings")
    .select("notification_prefs")
    .eq("user_id", userId)
    .single();

  if (!prefs) return false;

  const nPrefs = prefs.notification_prefs as {
    enabled: boolean;
    importantOnly: boolean;
    minPriority: number;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };

  if (!nPrefs.enabled) return false;
  if (nPrefs.importantOnly && !notification.priorityScore) return false;
  if (notification.priorityScore < (nPrefs.minPriority || 60)) return false;

  if (nPrefs.quietHoursEnabled) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = (nPrefs.quietHoursStart || "22:00").split(":").map(Number);
    const [endH, endM] = (nPrefs.quietHoursEnd || "07:00").split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return false;
    } else {
      if (currentMinutes >= startMinutes || currentMinutes < endMinutes) return false;
    }
  }

  const { data: subscriptions } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return false;

  let delivered = false;
  for (const sub of subscriptions) {
    const ok = await sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      notification
    );
    if (ok) delivered = true;
  }

  // Log notification
  await getSupabaseAdmin().from("notification_log").insert({
    user_id: userId,
    email_id: notification.emailId,
    account_id: undefined,
    subject: notification.subject,
    from_address: notification.from,
    category: notification.category as never,
    priority_score: notification.priorityScore,
    sent_at: new Date().toISOString(),
    delivered,
  });

  return delivered;
}

export async function subscribeUser(
  userId: string,
  subscription: PushSubscriptionData,
  userAgent?: string
): Promise<boolean> {
  const { error } = await getSupabaseAdmin().from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent || null,
    },
    { onConflict: "endpoint" }
  );

  return !error;
}

export async function unsubscribeUser(endpoint: string): Promise<boolean> {
  const { error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  return !error;
}

export async function checkAndNotify(
  userId: string,
  accountEmail: string,
  emailId: string,
  subject: string,
  from: string,
  snippet: string,
  category: string,
  priorityScore: number
): Promise<void> {
  await notifyUser(userId, {
    id: randomUUID(),
    emailId,
    accountEmail,
    subject,
    from,
    snippet,
    category,
    priorityScore,
    timestamp: new Date(),
    read: false,
  });
}

export async function getVapidPublicKey(): Promise<string> {
  return env.VAPID_PUBLIC_KEY;
}

/**
 * POST /api/push/deliver
 * Sends a real Web Push notification to all subscriptions of the target users.
 *
 * Body: {
 *   userIds: string[]          — recipients (sender is excluded in caller)
 *   title: string
 *   body?: string
 *   data?: Record<string,unknown>  — forwarded to SW notificationclick handler
 * }
 *
 * Returns: { ok: true, sent: number }
 * Silently no-ops when VAPID keys are not configured.
 * Automatically prunes stale (410/404) subscriptions from the DB.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const vapidPublicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject    = process.env.VAPID_SUBJECT ?? "mailto:hallo@hesselmann-service.de";

  // Graceful disable — no-op when VAPID not configured
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ ok: true, sent: 0, reason: "vapid_not_configured" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userIds, title, body, data } = await req.json();
  if (!Array.isArray(userIds) || !userIds.length || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch all push subscriptions for the target users
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", userIds as string[]);

  if (subErr || !subs?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Dynamic import — keeps server startup clean even if web-push is absent
  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({ title, body: body ?? "", data: data ?? {} });
  let sent = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          {
            TTL: 86400, // 24h time-to-live
            urgency: "normal",
          }
        );
        sent++;
      } catch (err: any) {
        // 410 Gone / 404 Not Found → subscription is expired, remove it
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          stale.push(sub.endpoint);
        }
        // Other errors (429, 5xx) are transient — ignore silently
      }
    })
  );

  // Prune stale subscriptions so we don't waste resources next time
  if (stale.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", stale);
  }

  return NextResponse.json({ ok: true, sent, stale: stale.length });
}

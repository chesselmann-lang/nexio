"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications(userId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function subscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!userId) return;

    const reg = await navigator.serviceWorker.ready;

    // Request permission
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return;

    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
          ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer
          : undefined,
      });

      const subJSON = sub.toJSON();

      // Save subscription to Supabase
      await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth,
        updated_at: new Date().toISOString(),
      });

      setSubscribed(true);
    } catch (err) {
      console.warn("[Push] Subscription failed:", err);
    }
  }

  async function unsubscribe() {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      if (userId) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", sub.endpoint);
      }
    }
    setSubscribed(false);
  }

  return { permission, subscribed, subscribe, unsubscribe };
}

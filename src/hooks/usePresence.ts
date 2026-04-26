"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * usePresence
 *
 * Broadcasts the current user as "online" (and "offline" on unmount).
 * Subscribes to all users' status changes and returns a Set of user IDs
 * that are currently online.
 */
export function usePresence(currentUserId: string | null): Set<string> {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    if (!currentUserId) return;

    // Set self online immediately
    supabase.from("users").update({ status: "online", last_seen: new Date().toISOString() })
      .eq("id", currentUserId);

    // 60s heartbeat
    const heartbeat = setInterval(() => {
      supabase.from("users").update({ last_seen: new Date().toISOString() })
        .eq("id", currentUserId);
    }, 60_000);

    // Visibility change: away/online
    function onVisibility() {
      const status = document.hidden ? "away" : "online";
      supabase.from("users").update({ status, last_seen: new Date().toISOString() })
        .eq("id", currentUserId!);
    }
    document.addEventListener("visibilitychange", onVisibility);

    // Realtime: subscribe to all status changes
    const channel = supabase
      .channel("presence-global")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "users",
        // No filter — watch all user updates for online status
      }, (payload) => {
        const updated = payload.new as { id: string; status: string };
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (updated.status === "online") {
            next.add(updated.id);
          } else {
            next.delete(updated.id);
          }
          return next;
        });
      })
      .subscribe();

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.from("users").update({ status: "offline", last_seen: new Date().toISOString() })
        .eq("id", currentUserId);
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return onlineUsers;
}

/**
 * useUserStatus
 *
 * Returns the live status + last_seen for a single user.
 */
export function useUserStatus(userId: string | null): {
  status: "online" | "away" | "offline";
  last_seen: string;
} | null {
  const [status, setStatus] = useState<{ status: "online" | "away" | "offline"; last_seen: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    supabase.from("users").select("status, last_seen").eq("id", userId).maybeSingle()
      .then(({ data }) => {
        if (data) setStatus({ status: (data.status ?? "offline") as any, last_seen: data.last_seen ?? "" });
      });

    // Subscribe to changes for this user
    const channel = supabase
      .channel(`user-status-${userId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "users",
        filter: `id=eq.${userId}`,
      }, (payload) => {
        const u = payload.new as { status: string; last_seen: string };
        setStatus({ status: (u.status ?? "offline") as any, last_seen: u.last_seen ?? "" });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return status;
}

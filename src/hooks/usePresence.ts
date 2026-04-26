"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tracks online users via Supabase Realtime + users.status column.
 * - Sets own status to "online" on mount, "offline" on unmount
 * - Subscribes to realtime user status changes
 * - Returns Set<userId> of currently online users
 */
export function usePresence(currentUserId: string | null): Set<string> {
  const supabase = createClient();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUserId) return;

    // Mark self as online immediately
    supabase
      .from("users")
      .update({ status: "online", last_seen: new Date().toISOString() })
      .eq("id", currentUserId)
      .then(() => {});

    // Load current online users
    supabase
      .from("users")
      .select("id, status")
      .eq("status", "online")
      .then(({ data }) => {
        if (data) setOnlineUsers(new Set(data.map((u) => u.id)));
      });

    // Subscribe to status changes
    const channel = supabase
      .channel("presence-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
        (payload) => {
          const u = payload.new as { id: string; status: string };
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            if (u.status === "online") next.add(u.id);
            else next.delete(u.id);
            return next;
          });
        }
      )
      .subscribe();

    // Away when tab hidden, online when tab visible
    const onVisibility = () => {
      const status = document.hidden ? "away" : "online";
      supabase
        .from("users")
        .update({ status, last_seen: new Date().toISOString() })
        .eq("id", currentUserId)
        .then(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Heartbeat every 60s to keep last_seen fresh
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        supabase
          .from("users")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", currentUserId)
          .then(() => {});
      }
    }, 60_000);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(channel);
      // Mark offline on unmount (SPA navigation covers this)
      supabase
        .from("users")
        .update({ status: "offline", last_seen: new Date().toISOString() })
        .eq("id", currentUserId)
        .then(() => {});
    };
  }, [currentUserId]);

  return onlineUsers;
}

/**
 * Subscribe to a single user's status + last_seen.
 */
export function useUserStatus(userId: string | null) {
  const supabase = createClient();
  const [status, setStatus] = useState<{
    status: "online" | "away" | "offline";
    last_seen: string;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    supabase
      .from("users")
      .select("status, last_seen")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data) setStatus(data as any);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const u = payload.new as { status: string; last_seen: string };
          setStatus({ status: u.status as any, last_seen: u.last_seen });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return status;
}

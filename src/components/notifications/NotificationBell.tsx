"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BellIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  resource_url: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load unread count on mount
  useEffect(() => {
    let mounted = true;
    async function loadCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (mounted) setUnread(count ?? 0);
    }
    loadCount();

    // Realtime subscription for new notifications
    let channel: any;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel("notif-bell")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        }, () => {
          if (mounted) setUnread((n) => n + 1);
        })
        .subscribe();
    });

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function openPanel() {
    setOpen(true);
    if (notifs.length > 0) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);
    setNotifs((data ?? []) as Notif[]);
    setLoading(false);
    // Mark all as read
    await supabase.from("notifications").update({ is_read: true })
      .eq("user_id", user.id).eq("is_read", false);
    setUnread(0);
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true })
      .eq("user_id", user.id).eq("is_read", false);
    setUnread(0);
    setNotifs((n) => n.map((x) => ({ ...x, is_read: true })));
  }

  const NOTIF_ICONS: Record<string, string> = {
    message: "💬", reaction: "❤️", friend_request: "👤",
    system: "⚙️", payment: "💸", story_view: "👁️", mention: "@",
  };

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      <button
        onClick={open ? () => setOpen(false) : openPanel}
        className="w-9 h-9 flex items-center justify-center rounded-full"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--foreground-3)",
          cursor: "pointer",
          position: "relative",
        }}
        aria-label="Benachrichtigungen"
      >
        <BellIcon style={{ width: 20, height: 20 }} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--background)",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 420,
            borderRadius: 16,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            zIndex: 100,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              className="font-semibold text-sm"
              style={{ color: "var(--foreground)" }}
            >
              Benachrichtigungen
            </span>
            <button
              onClick={markAllRead}
              style={{
                fontSize: 12,
                color: "var(--nexio-indigo)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Alle gelesen
            </button>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--foreground-3)", fontSize: 13 }}>
                Lädt…
              </div>
            )}
            {!loading && notifs.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: "var(--foreground-3)", fontSize: 13 }}>
                Keine Benachrichtigungen
              </div>
            )}
            {!loading && notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setOpen(false);
                  if (n.resource_url) router.push(n.resource_url);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  background: n.is_read ? "transparent" : "rgba(124,92,252,0.07)",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {NOTIF_ICONS[n.type] ?? "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: "var(--foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p
                      className="text-xs"
                      style={{
                        color: "var(--foreground-3)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: 2,
                      }}
                    >
                      {n.body}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: "var(--foreground-3)", marginTop: 2 }}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                  </p>
                </div>
                {!n.is_read && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: "var(--nexio-indigo)",
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <button
            onClick={() => { setOpen(false); router.push("/notifications"); }}
            style={{
              padding: "11px 14px",
              borderTop: "1px solid var(--border)",
              background: "transparent",
              border: "none",
              borderTop: "1px solid var(--border)",
              color: "var(--nexio-indigo)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              textAlign: "center",
            }}
          >
            Alle Benachrichtigungen →
          </button>
        </div>
      )}
    </div>
  );
}

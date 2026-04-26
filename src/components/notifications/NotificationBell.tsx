"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  resource_id: string | null;
  resource_type: string | null;
  is_read: boolean;
  created_at: string;
  actor?: { display_name: string; avatar_url: string | null } | null;
}

const TYPE_ICON: Record<string, string> = {
  message:       "💬",
  reaction:      "❤️",
  story_view:    "👁️",
  channel_post:  "📢",
  contact_added: "👤",
  mention:       "🔔",
  system:        "ℹ️",
};

export default function NotificationBell() {
  const router    = useRouter();
  const supabase  = createClient();
  const [open, setOpen]   = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  // ── Initial badge count + realtime ────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => setUnread(count ?? 0));

    const ch = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        () => setUnread((n) => n + 1))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" },
        () =>
          supabase.from("notifications").select("id", { count: "exact", head: true })
            .eq("is_read", false)
            .then(({ count }) => setUnread(count ?? 0)))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Load recent notifs when panel opens ───────────────────────────────────
  async function openPanel() {
    setOpen(true);
    const { data } = await supabase
      .from("notifications")
      .select("*, actor:users!notifications_actor_id_fkey(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(8);
    setNotifs((data ?? []) as Notif[]);
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  function handleClick(n: Notif) {
    markRead(n.id);
    setOpen(false);
    if (n.resource_type === "conversation" && n.resource_id)
      router.push(`/chats/${n.resource_id}`);
    else if (n.resource_type === "channel" && n.resource_id)
      router.push(`/channels/${n.resource_id}`);
    else if (n.resource_type === "user" && n.resource_id)
      router.push(`/u/${n.resource_id}`);
  }

  return (
    <>
      {/* Bell button */}
      <button
        onClick={openPanel}
        className="w-9 h-9 flex items-center justify-center rounded-full relative"
        style={{ color: "var(--foreground-3)" }}
        aria-label="Benachrichtigungen"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5"
            style={{ background: "#ef4444" }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Slide-up overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl flex flex-col"
            style={{
              maxHeight: "75vh",
              background: "var(--surface)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
            }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-none"
              style={{ background: "var(--border)" }} />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-none border-b"
              style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
                Benachrichtigungen
                {unread > 0 && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ background: "var(--nexio-indigo)" }}>{unread}</span>
                )}
              </h2>
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="text-xs font-semibold"
                  style={{ color: "var(--nexio-indigo)" }}>
                  Alle gelesen
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2">
                  <span className="text-4xl">🔔</span>
                  <p className="text-sm" style={{ color: "var(--foreground-3)" }}>
                    Keine neuen Benachrichtigungen
                  </p>
                </div>
              ) : (
                notifs.map((n) => {
                  const actor = n.actor as any;
                  return (
                    <button key={n.id} onClick={() => handleClick(n)}
                      className="w-full flex items-start gap-3 px-4 py-3 border-b text-left active:opacity-70 transition-opacity"
                      style={{
                        background: n.is_read ? "var(--surface)" : "rgba(124,92,252,0.07)",
                        borderColor: "var(--border)",
                      }}>
                      {/* Actor / icon */}
                      <div className="flex-none relative mt-0.5">
                        {actor?.display_name ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: "var(--nexio-indigo)" }}>
                            {actor.avatar_url
                              ? <img src={actor.avatar_url} alt="" className="w-full h-full object-cover" />
                              : actor.display_name.slice(0, 1)}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ background: "var(--surface-2)" }}>
                            {TYPE_ICON[n.type] ?? "🔔"}
                          </div>
                        )}
                        {actor?.display_name && (
                          <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
                            {TYPE_ICON[n.type] ?? "🔔"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--foreground-2)" }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-3)" }}>
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>

                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full flex-none mt-2"
                          style={{ background: "var(--nexio-indigo)" }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer: view all */}
            <button
              onClick={() => { setOpen(false); router.push("/notifications"); }}
              className="flex-none w-full py-4 text-sm font-semibold border-t"
              style={{ color: "var(--nexio-indigo)", borderColor: "var(--border)" }}
            >
              Alle Benachrichtigungen anzeigen →
            </button>
          </div>
        </>
      )}
    </>
  );
}

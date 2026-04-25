"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  actor_id: string | null;
  resource_id: string | null;
  resource_type: string | null;
  is_read: boolean;
  created_at: string;
  actor?: { display_name: string; avatar_url: string | null } | null;
}

const TYPE_ICON: Record<string, string> = {
  message: "💬",
  reaction: "❤️",
  story_view: "👁️",
  channel_post: "📢",
  contact_added: "👤",
  mention: "🔔",
  system: "ℹ️",
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      }, (payload) => {
        setNotifs((prev) => [payload.new as Notification, ...prev]);
        setUnreadCount((n) => n + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*, actor:users!notifications_actor_id_fkey(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifs((data ?? []) as Notification[]);
    setUnreadCount((data ?? []).filter((n: any) => !n.is_read).length);
    setLoading(false);
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  function handleClick(n: Notification) {
    markRead(n.id);
    if (n.resource_type === "conversation" && n.resource_id) {
      router.push(`/chats/${n.resource_id}`);
    } else if (n.resource_type === "channel" && n.resource_id) {
      router.push(`/channels/${n.resource_id}`);
    } else if (n.resource_type === "user" && n.resource_id) {
      router.push(`/u/${n.resource_id}`);
    }
  }

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  function groupLabel(dateStr: string) {
    const d = new Date(dateStr).toDateString();
    if (d === today) return "Heute";
    if (d === yesterday) return "Gestern";
    return new Date(dateStr).toLocaleDateString("de-DE", { weekday: "long", month: "long", day: "numeric" });
  }

  const grouped: { label: string; items: Notification[] }[] = [];
  for (const n of notifs) {
    const label = groupLabel(n.created_at);
    const existing = grouped.find((g) => g.label === label);
    if (existing) existing.items.push(n);
    else grouped.push({ label, items: [n] });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold flex-1" style={{ color: "var(--foreground)" }}>
          Benachrichtigungen
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "var(--nexio-green)" }}>{unreadCount}</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="text-xs font-semibold" style={{ color: "var(--nexio-green)" }}>
            Alle lesen
          </button>
        )}
      </header>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--nexio-green)", borderTopColor: "transparent" }} />
        </div>
      )}

      {!loading && notifs.length === 0 && (
        <div className="flex flex-col items-center py-24 gap-3">
          <span className="text-5xl">🔔</span>
          <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Keine Benachrichtigungen</p>
          <p className="text-sm" style={{ color: "var(--foreground-3)" }}>Du bist auf dem neusten Stand.</p>
        </div>
      )}

      <div>
        {grouped.map((group) => (
          <div key={group.label}>
            <p className="px-4 py-2 text-xs font-semibold sticky top-[53px]"
              style={{ background: "var(--background)", color: "var(--foreground-3)" }}>
              {group.label}
            </p>
            {group.items.map((n) => {
              const actor = n.actor as any;
              return (
                <button key={n.id} onClick={() => handleClick(n)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 border-b text-left"
                  style={{
                    background: n.is_read ? "var(--surface)" : "rgba(7,193,96,0.06)",
                    borderColor: "var(--border)",
                  }}>
                  {/* Actor avatar or type icon */}
                  <div className="flex-none relative mt-0.5">
                    {actor?.display_name ? (
                      <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: "var(--nexio-green)" }}>
                        {actor.avatar_url
                          ? <img src={actor.avatar_url} alt="" className="w-full h-full object-cover" />
                          : actor.display_name.slice(0, 1)}
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-2xl"
                        style={{ background: "var(--background)" }}>
                        {TYPE_ICON[n.type] ?? "🔔"}
                      </div>
                    )}
                    {actor?.display_name && (
                      <span className="absolute -bottom-0.5 -right-0.5 text-base leading-none">
                        {TYPE_ICON[n.type] ?? "🔔"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{n.title}</p>
                    {n.body && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--foreground-3)" }}>{n.body}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-3)" }}>
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                    </p>
                  </div>

                  {!n.is_read && (
                    <div className="w-2.5 h-2.5 rounded-full flex-none mt-2"
                      style={{ background: "var(--nexio-green)" }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BlockedUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? "");
      if (data.user) loadBlocked(data.user.id);
    });
  }, []);

  async function loadBlocked(uid: string) {
    setLoading(true);
    const { data } = await supabase
      .from("blocks")
      .select("blocked_id, users!blocks_blocked_id_fkey(id, display_name, username, avatar_url)")
      .eq("user_id", uid);
    setBlocked(data ?? []);
    setLoading(false);
  }

  async function unblock(blockedId: string) {
    await supabase.from("blocks").delete().eq("user_id", userId).eq("blocked_id", blockedId);
    setBlocked((prev) => prev.filter((b) => b.blocked_id !== blockedId));
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      <div className="flex-none flex items-center gap-3 px-4 border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Blockierliste
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--nexio-green)", borderTopColor: "transparent" }} />
          </div>
        ) : blocked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Keine blockierten Nutzer</p>
            <p className="text-xs mt-1" style={{ color: "var(--foreground-3)" }}>
              Blockierte Nutzer können dir keine Nachrichten senden.
            </p>
          </div>
        ) : (
          blocked.map((b) => {
            const u = (b.users as any);
            return (
              <div key={b.blocked_id} className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-none"
                  style={{ background: "#6b7280" }}>
                  {u?.display_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {u?.display_name ?? "Unbekannt"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-3)" }}>@{u?.username}</p>
                </div>
                <button onClick={() => unblock(b.blocked_id)}
                  className="text-xs px-3 py-1.5 rounded-xl font-medium"
                  style={{ background: "var(--surface-2)", color: "var(--nexio-green)" }}>
                  Entsperren
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

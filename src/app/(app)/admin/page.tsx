import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ModerationQueue, UserManagement, BusinessVerification } from "./AdminModeration";

// Only this user ID can access admin
const ADMIN_USER_ID = "152f5271-385e-40f5-8d9e-ecedee59525b";

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { count: userCount },
    { count: messageCount },
    { count: aiSessionCount },
    { count: channelCount },
    { count: storyCount },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("ai_sessions").select("*", { count: "exact", head: true }),
    supabase.from("channels").select("*", { count: "exact", head: true }),
    supabase.from("stories").select("*", { count: "exact", head: true }),
  ]);
  return { userCount, messageCount, aiSessionCount, channelCount, storyCount };
}

const FEATURES = [
  {
    name: "Messaging & Realtime",
    key: "NEXT_PUBLIC_SUPABASE_URL",
    check: () => !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    activateHint: "Bereits aktiv — Supabase ist konfiguriert.",
    icon: "💬",
  },
  {
    name: "KI-Assistent (Claude)",
    key: "ANTHROPIC_API_KEY",
    check: () => !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("...")),
    activateHint: "API-Key unter console.anthropic.com erstellen → ANTHROPIC_API_KEY in Vercel setzen.",
    icon: "🤖",
  },
  {
    name: "Zahlungen (Stripe)",
    key: "STRIPE_SECRET_KEY",
    check: () => {
      const k = process.env.STRIPE_SECRET_KEY ?? "";
      return k.startsWith("sk_") && k !== "sk_test_...";
    },
    activateHint: "Stripe-Konto erstellen → API-Keys unter dashboard.stripe.com/apikeys → STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel setzen.",
    icon: "💳",
  },
  {
    name: "Video/Audio-Calls (LiveKit)",
    key: "LIVEKIT_API_KEY",
    check: () => !!(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.NEXT_PUBLIC_LIVEKIT_URL),
    activateHint: "LiveKit Cloud-Projekt erstellen unter livekit.io → LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL in Vercel setzen.",
    icon: "📞",
  },
  {
    name: "E-Mail-Versand (Resend)",
    key: "RESEND_API_KEY",
    check: () => !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== ""),
    activateHint: "Resend-Konto unter resend.com erstellen → API-Key → RESEND_API_KEY in Vercel setzen.",
    icon: "✉️",
  },
  {
    name: "Web Push (VAPID)",
    key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    check: () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.includes("...")),
    activateHint: "Bereits konfiguriert — VAPID-Keys sind gesetzt.",
    icon: "🔔",
  },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) redirect("/chats");

  const stats = await getStats(supabase);
  const features = FEATURES.map((f) => ({ ...f, active: f.check() }));

  // Recent users
  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, display_name, username, created_at, status")
    .order("created_at", { ascending: false })
    .limit(10);

  // Recent AI sessions
  const { data: recentSessions } = await supabase
    .from("ai_sessions")
    .select("id, title, message_count, last_message_at, user_id")
    .order("last_message_at", { ascending: false })
    .limit(5);

  // Pending reports
  const { data: pendingReports } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, detail, created_at, reporter:users!reports_reporter_id_fkey(username)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  // All users for management
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, display_name, username, created_at, is_banned, status")
    .order("created_at", { ascending: false })
    .limit(50);

  // Channels pending business verification
  const { data: pendingBusiness } = await supabase
    .from("channels")
    .select("id, name, business_type, website, is_business, created_at")
    .eq("is_business", false)
    .not("business_type", "is", null)
    .limit(10);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <h1 className="text-base font-bold" style={{ color: "var(--foreground)" }}>Admin Dashboard</h1>
            <p className="text-xs" style={{ color: "var(--foreground-3)" }}>Nexio — nur für Administratoren</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-3)" }}>Statistiken</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Nutzer", value: stats.userCount ?? 0, icon: "👥" },
              { label: "Nachrichten", value: stats.messageCount ?? 0, icon: "💬" },
              { label: "AI-Sessions", value: stats.aiSessionCount ?? 0, icon: "🤖" },
              { label: "Channels", value: stats.channelCount ?? 0, icon: "📢" },
              { label: "Stories", value: stats.storyCount ?? 0, icon: "⚡" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: "var(--surface)" }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{s.value.toLocaleString("de-DE")}</div>
                <div className="text-xs" style={{ color: "var(--foreground-3)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Flags */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-3)" }}>Feature-Status</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {features.map((f, i) => (
              <div
                key={f.key}
                className="flex items-start gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? `1px solid var(--border)` : undefined }}
              >
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{f.name}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={f.active
                        ? { background: "#07c16020", color: "#07c160" }
                        : { background: "#f59e0b20", color: "#f59e0b" }
                      }
                    >
                      {f.active ? "Aktiv" : "Deaktiviert"}
                    </span>
                  </div>
                  {!f.active && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>{f.activateHint}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Moderation Queue */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: "var(--foreground-3)" }}>
            Meldungen
            {(pendingReports?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] text-white font-bold"
                style={{ background: "#ef4444" }}>
                {pendingReports?.length}
              </span>
            )}
          </h2>
          <ModerationQueue reports={pendingReports ?? []} />
        </section>

        {/* Business Verification */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: "var(--foreground-3)" }}>
            Business-Verifizierung
            {(pendingBusiness?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] text-white font-bold"
                style={{ background: "#1677ff" }}>
                {pendingBusiness?.length}
              </span>
            )}
          </h2>
          <BusinessVerification channels={pendingBusiness ?? []} />
        </section>

        {/* User Management */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--foreground-3)" }}>
            Nutzerverwaltung ({allUsers?.length ?? 0})
          </h2>
          <UserManagement users={allUsers ?? []} />
        </section>

        {/* Recent Users */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-3)" }}>Letzte Nutzer</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {(recentUsers ?? []).map((u: any, i: number) => (
              <div
                key={u.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? `1px solid var(--border)` : undefined }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "var(--nexio-green)" }}
                >
                  {(u.display_name || u.username || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {u.display_name || u.username || "Unbekannt"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
                    @{u.username} · {new Date(u.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: u.status === "online" ? "#07c160" : "#d1d5db" }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Recent AI Sessions */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-3)" }}>Letzte KI-Sessions</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {(recentSessions ?? []).map((s: any, i: number) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? `1px solid var(--border)` : undefined }}
              >
                <span className="text-xl">🤖</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{s.title}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
                    {s.message_count} Nachrichten · {new Date(s.last_message_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deployment Info */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-3)" }}>Deployment</h2>
          <div className="rounded-2xl px-4 py-3 space-y-2 text-sm" style={{ background: "var(--surface)" }}>
            {[
              ["URL", "https://nexio-jet.vercel.app"],
              ["Hosting", "Vercel (Frankfurt → Washington, D.C.)"],
              ["Datenbank", "Supabase eu-central-1 (Frankfurt)"],
              ["KI-Modell", "claude-haiku-4-5-20251001"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="w-24 flex-shrink-0" style={{ color: "var(--foreground-3)" }}>{k}</span>
                <span className="font-medium truncate" style={{ color: "var(--foreground)" }}>{v}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-center pb-4" style={{ color: "var(--foreground-3)" }}>
          Nexio Admin · Stand {new Date().toLocaleDateString("de-DE")}
        </p>
      </div>
    </div>
  );
}

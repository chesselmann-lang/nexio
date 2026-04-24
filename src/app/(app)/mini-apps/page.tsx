import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  government: "🏛 Behörden",
  health: "🏥 Gesundheit",
  transport: "🚂 Mobilität",
  finance: "💰 Finanzen",
  utilities: "⚡ Nützliches",
  shopping: "🛒 Shopping",
  food: "🍔 Essen",
  entertainment: "🎮 Entertainment",
  other: "🔧 Sonstiges",
};

const CATEGORY_ORDER = ["government", "health", "transport", "finance", "utilities", "food", "shopping", "entertainment", "other"];

export default async function MiniAppsPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("mini_programs")
    .select("*")
    .eq("is_active", true)
    .order("usage_count", { ascending: false });

  // Group by category
  const grouped: Record<string, any[]> = {};
  for (const p of programs ?? []) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  const APP_ICONS: Record<string, string> = {
    "Bürgeramt-Termin": "🏛",
    "eRezept Scanner": "💊",
    "DB Verbindungen": "🚂",
    "Elster Lite": "📋",
    "Wetter & Klima": "🌤",
    "Splittr": "💸",
    "Mini-Umfrage": "📊",
    "Essen bestellen": "🍔",
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex-none px-4 border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Mini-Programme</h1>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--nexio-green-light)", color: "var(--nexio-green)" }}>
          Beta
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Featured strip */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-3)" }}>
            Häufig genutzt
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {(programs ?? []).slice(0, 5).map((p) => (
              <Link key={p.id} href={`/mini-apps/${p.id}`}
                className="flex-none flex flex-col items-center gap-1.5 w-16">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ background: "var(--surface)" }}>
                  {APP_ICONS[p.name] ?? "🔧"}
                </div>
                <span className="text-[10px] text-center leading-tight" style={{ color: "var(--foreground-2)" }}>
                  {p.name.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* By category */}
        {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
          <div key={cat} className="mt-4">
            <p className="px-4 text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--foreground-3)" }}>
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="space-y-0">
              {grouped[cat].map((p, i) => (
                <Link key={p.id} href={`/mini-apps/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-none shadow-sm"
                    style={{ background: "var(--surface-2)" }}>
                    {APP_ICONS[p.name] ?? "🔧"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.name}</p>
                      {p.is_verified && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-semibold"
                          style={{ background: "#1677ff", fontSize: 9 }}>✓</span>
                      )}
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--foreground-3)" }}>
                      {p.description}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>
                      {p.developer} · {p.usage_count.toLocaleString("de-DE")} Aufrufe
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ color: "var(--foreground-3)", flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Dev info */}
        <div className="mx-4 my-6 rounded-2xl p-4" style={{ background: "var(--surface)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            🔧 Eigenes Mini-Programm entwickeln
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-3)" }}>
            Baue Apps mit der Nexio API und erreiche Millionen Nutzer.
          </p>
          <Link href="/business"
            className="inline-block text-xs font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: "var(--nexio-green)" }}>
            Entwickler werden →
          </Link>
        </div>
      </div>
    </div>
  );
}

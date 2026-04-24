"use client";
import { useState } from "react";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam", harassment: "Belästigung", fake_account: "Gefälschtes Konto",
  inappropriate_content: "Unangemessene Inhalte", scam: "Betrug", other: "Sonstiges",
};

export function ModerationQueue({ reports: initialReports }: { reports: any[] }) {
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState<string | null>(null);

  async function act(reportId: string, action: "reviewed" | "dismissed") {
    setLoading(reportId);
    const res = await fetch("/api/admin/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    if (res.ok) setReports((r) => r.filter((x) => x.id !== reportId));
    setLoading(null);
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl px-4 py-8 text-center" style={{ background: "var(--surface)" }}>
        <div className="text-3xl mb-2">✅</div>
        <p className="text-sm" style={{ color: "var(--foreground-3)" }}>Keine offenen Meldungen</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
      {reports.map((r: any, i: number) => (
        <div key={r.id} className="px-4 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
          <div className="flex items-start gap-2 mb-2">
            <span className="text-sm font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#fee2e2", color: "#ef4444", fontSize: 11 }}>
              {REASON_LABELS[r.reason] ?? r.reason}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--foreground-3)" }}>
              {new Date(r.created_at).toLocaleDateString("de-DE")}
            </span>
          </div>
          <p className="text-xs mb-1" style={{ color: "var(--foreground-3)" }}>
            Gemeldet: {r.target_type}/{r.target_id?.slice(0, 8)}
          </p>
          {r.reporter && (
            <p className="text-xs mb-2" style={{ color: "var(--foreground-3)" }}>
              Von: @{r.reporter?.username ?? "—"}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={() => act(r.id, "reviewed")} disabled={loading === r.id}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white"
              style={{ background: "#07c160" }}>
              {loading === r.id ? "…" : "✓ Verarbeitet"}
            </button>
            <button onClick={() => act(r.id, "dismissed")} disabled={loading === r.id}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "var(--surface-2)", color: "var(--foreground-3)" }}>
              Ablehnen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserManagement({ users: initialUsers }: { users: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");

  async function toggleBan(u: any) {
    setLoading(u.id);
    const action = u.is_banned ? "unban" : "ban";
    const res = await fetch("/api/admin/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: u.id, action, reason: banReason || "Admin-Entscheidung" }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_banned: !x.is_banned } : x));
    }
    setBanReason("");
    setLoading(null);
  }

  const filtered = search.length >= 2
    ? users.filter((u) => u.display_name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div>
      <div className="rounded-2xl px-3 py-2 mb-3 flex items-center gap-2" style={{ background: "var(--surface)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: "var(--foreground-3)", flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nutzer suchen…"
          className="flex-1 text-sm bg-transparent focus:outline-none"
          style={{ color: "var(--foreground)" }}
        />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
        {filtered.slice(0, 15).map((u: any, i: number) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: u.is_banned ? "#9ca3af" : "#07c160" }}>
              {(u.display_name || u.username || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                {u.display_name || u.username}
                {u.is_banned && <span className="ml-1 text-[10px] px-1 rounded" style={{ background: "#fee2e2", color: "#ef4444" }}>gesperrt</span>}
              </p>
              <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
                @{u.username} · {new Date(u.created_at).toLocaleDateString("de-DE")}
              </p>
            </div>
            <button
              onClick={() => toggleBan(u)}
              disabled={loading === u.id}
              className="text-xs px-2.5 py-1 rounded-xl font-semibold"
              style={{ background: u.is_banned ? "#dcfce7" : "#fee2e2", color: u.is_banned ? "#16a34a" : "#ef4444" }}
            >
              {loading === u.id ? "…" : u.is_banned ? "Entsperren" : "Sperren"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BusinessVerification({ channels: initialChannels }: { channels: any[] }) {
  const [channels, setChannels] = useState(initialChannels);
  const [loading, setLoading] = useState<string | null>(null);

  async function act(channelId: string, action: "verify" | "reject") {
    setLoading(channelId);
    const res = await fetch("/api/admin/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, action }),
    });
    if (res.ok) setChannels((c) => c.filter((x) => x.id !== channelId));
    setLoading(null);
  }

  if (channels.length === 0) {
    return (
      <div className="rounded-2xl px-4 py-8 text-center" style={{ background: "var(--surface)" }}>
        <div className="text-3xl mb-2">✅</div>
        <p className="text-sm" style={{ color: "var(--foreground-3)" }}>Keine ausstehenden Verifizierungen</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
      {channels.map((ch: any, i: number) => (
        <div key={ch.id} className="px-4 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{ch.name}</p>
            {ch.is_business && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: "#1677ff" }}>✓</span>
            )}
          </div>
          <p className="text-xs mb-2" style={{ color: "var(--foreground-3)" }}>
            {ch.business_type ?? "Keine Kategorie"} · {ch.website ?? "Keine Website"}
          </p>
          <div className="flex gap-2">
            <button onClick={() => act(ch.id, "verify")} disabled={loading === ch.id}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white"
              style={{ background: "#1677ff" }}>
              {loading === ch.id ? "…" : "✓ Verifizieren"}
            </button>
            <button onClick={() => act(ch.id, "reject")} disabled={loading === ch.id}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "var(--surface-2)", color: "#ef4444" }}>
              Ablehnen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

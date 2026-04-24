"use client";
import { useState } from "react";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Belästigung / Mobbing" },
  { value: "fake_account", label: "Gefälschtes Konto" },
  { value: "inappropriate_content", label: "Unangemessene Inhalte" },
  { value: "scam", label: "Betrug / Phishing" },
  { value: "other", label: "Sonstiges" },
];

export default function UserActionsMenu({
  targetUserId,
  targetName,
  currentUserId,
  isBlocked = false,
}: {
  targetUserId: string;
  targetName: string;
  currentUserId: string;
  isBlocked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [blocked, setBlocked] = useState(isBlocked);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (targetUserId === currentUserId) return null;

  async function toggleBlock() {
    setLoading(true);
    const res = await fetch("/api/user/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, action: blocked ? "unblock" : "block" }),
    });
    if (res.ok) {
      setBlocked(!blocked);
      setDone(blocked ? `${targetName} entsperrt` : `${targetName} blockiert`);
    }
    setOpen(false);
    setLoading(false);
    setTimeout(() => setDone(null), 3000);
  }

  async function submitReport() {
    if (!reason) return;
    setLoading(true);
    await fetch("/api/user/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "user", targetId: targetUserId, reason, detail }),
    });
    setShowReport(false);
    setOpen(false);
    setDone("Meldung eingereicht. Danke!");
    setLoading(false);
    setTimeout(() => setDone(null), 3000);
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-full"
        style={{ color: "var(--foreground-3)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Toast */}
      {done && (
        <div className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 text-center text-sm font-medium text-white"
          style={{ background: "var(--nexio-green)" }}>
          {done}
        </div>
      )}

      {/* Dropdown */}
      {open && !showReport && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div
            className="absolute right-4 rounded-2xl overflow-hidden shadow-xl"
            style={{ top: "auto", bottom: 80, background: "var(--surface)", minWidth: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-4 py-3 text-xs font-semibold border-b" style={{ color: "var(--foreground-3)", borderColor: "var(--border)" }}>
              {targetName}
            </p>
            <button
              onClick={toggleBlock}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 border-b text-left"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-lg">{blocked ? "✅" : "🚫"}</span>
              <span className="text-sm font-medium" style={{ color: blocked ? "var(--nexio-green)" : "#ef4444" }}>
                {blocked ? "Entsperren" : "Blockieren"}
              </span>
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <span className="text-lg">⚑</span>
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Melden</span>
            </button>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowReport(false)}>
          <div
            className="w-full rounded-t-3xl pb-safe"
            style={{ background: "var(--surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "var(--border)" }} />
            <p className="px-4 pb-3 text-base font-bold" style={{ color: "var(--foreground)" }}>
              {targetName} melden
            </p>
            <div className="px-4 space-y-2 max-h-64 overflow-y-auto">
              {REPORT_REASONS.map((r) => (
                <button key={r.value} onClick={() => setReason(r.value)}
                  className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
                  style={{ background: reason === r.value ? "var(--nexio-green)" : "var(--surface-2)" }}>
                  <span className="text-sm font-medium" style={{ color: reason === r.value ? "white" : "var(--foreground)" }}>
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
            {reason === "other" && (
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Beschreibe das Problem…"
                rows={3}
                className="mx-4 mt-3 w-[calc(100%-2rem)] rounded-2xl px-3 py-2 text-sm resize-none focus:outline-none"
                style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              />
            )}
            <div className="flex gap-3 px-4 py-4">
              <button onClick={() => setShowReport(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-medium"
                style={{ background: "var(--surface-2)", color: "var(--foreground-3)" }}>
                Abbrechen
              </button>
              <button onClick={submitReport} disabled={!reason || loading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#ef4444" }}>
                {loading ? "Sende…" : "Melden"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

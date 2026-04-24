"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Transaction {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  note: string | null;
  created_at: string;
  sender?: { display_name: string; username: string };
  recipient?: { display_name: string; username: string };
}

interface Contact {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

function formatAmount(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(cents / 100);
}

export default function NexioPayPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"wallet" | "send" | "qr">("wallet");
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Send form
  const [recipient, setRecipient] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  // QR
  const [qrAmount, setQrAmount] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      loadTransactions(data.user.id);
    });
  }, []);

  async function loadTransactions(uid: string) {
    const { data } = await supabase
      .from("pay_transactions")
      .select(`
        *,
        sender:users!pay_transactions_sender_id_fkey(display_name, username),
        recipient:users!pay_transactions_recipient_id_fkey(display_name, username)
      `)
      .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
      .order("created_at", { ascending: false })
      .limit(20);
    setTransactions((data ?? []) as any);
    setLoading(false);
  }

  async function searchUsers(q: string) {
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("users")
      .select("id, display_name, username, avatar_url")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq("id", userId ?? "")
      .limit(8);
    setSearchResults((data ?? []) as Contact[]);
  }

  async function sendPayment() {
    if (!recipient || !amount || !userId) return;
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) { setSendMsg("Ungültiger Betrag"); return; }
    setSending(true);
    setSendMsg(null);
    const res = await fetch("/api/pay/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: recipient.id, amountCents: cents, note }),
    });
    const data = await res.json();
    if (res.ok && data.checkoutUrl) {
      // Open Stripe checkout
      window.open(data.checkoutUrl, "_blank");
      setSendMsg("✅ Zahlung gestartet — Fenster geöffnet");
      setAmount(""); setNote(""); setRecipient(null);
      setTimeout(() => loadTransactions(userId), 3000);
    } else if (res.ok && data.disabled) {
      // Demo mode: record transaction directly
      const { data: tx } = await supabase.from("pay_transactions").insert({
        sender_id: userId,
        recipient_id: recipient.id,
        amount_cents: cents,
        note,
        status: "completed",
        completed_at: new Date().toISOString(),
      }).select().single();
      if (tx) setTransactions((prev) => [tx as any, ...prev]);
      setSendMsg(`✅ ${formatAmount(cents)} an @${recipient.username} gesendet (Demo)`);
      setAmount(""); setNote(""); setRecipient(null);
    } else {
      setSendMsg("❌ Fehler: " + (data.error ?? "Unbekannt"));
    }
    setSending(false);
  }

  function generateQR() {
    const cents = Math.round(parseFloat(qrAmount) * 100);
    if (isNaN(cents) || cents <= 0) return;
    const payload = JSON.stringify({ type: "nexio_pay", userId, amount: cents, currency: "EUR" });
    setQrCode(payload);
    // Draw simple QR placeholder on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = "#000000";
    // Finder pattern TL
    ctx.fillRect(10, 10, 50, 50);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(17, 17, 36, 36);
    ctx.fillStyle = "#000000";
    ctx.fillRect(24, 24, 22, 22);
    // Finder pattern TR
    ctx.fillStyle = "#000000";
    ctx.fillRect(140, 10, 50, 50);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(147, 17, 36, 36);
    ctx.fillStyle = "#000000";
    ctx.fillRect(154, 24, 22, 22);
    // Finder pattern BL
    ctx.fillStyle = "#000000";
    ctx.fillRect(10, 140, 50, 50);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(17, 147, 36, 36);
    ctx.fillStyle = "#000000";
    ctx.fillRect(24, 154, 22, 22);
    // Data modules (random dots for visual representation)
    ctx.fillStyle = "#000000";
    const seed = cents;
    for (let i = 0; i < 60; i++) {
      const x = (((seed * (i + 1) * 17) % 100) + 70) % 130;
      const y = (((seed * (i + 2) * 31) % 100) + 70) % 130;
      if (x > 65 && y > 65) ctx.fillRect(x, y, 7, 7);
    }
    // Amount label
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#07c160";
    ctx.textAlign = "center";
    ctx.fillText(formatAmount(cents), 100, 185);
  }

  const balance = transactions.reduce((sum, tx) => {
    if (tx.status !== "completed") return sum;
    if (tx.recipient_id === userId) return sum + tx.amount_cents;
    if (tx.sender_id === userId) return sum - tx.amount_cents;
    return sum;
  }, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} className="p-1" style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-xl">💰</span>
        <h1 className="text-base font-semibold flex-1" style={{ color: "var(--foreground)" }}>Nexio Pay</h1>
      </header>

      {/* Balance Card */}
      <div className="mx-4 mt-4 rounded-2xl p-5 text-center text-white"
        style={{ background: "linear-gradient(135deg, #07c160 0%, #0099ff 100%)" }}>
        <p className="text-xs font-semibold opacity-75 mb-1">Guthaben (Demo)</p>
        <p className="text-4xl font-bold tracking-tight">{formatAmount(Math.max(0, balance))}</p>
        <p className="text-xs opacity-60 mt-1">Nexio Pay · EUR</p>
      </div>

      {/* Tab Bar */}
      <div className="flex mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
        {[
          { id: "wallet", label: "Verlauf", icon: "📋" },
          { id: "send", label: "Senden", icon: "💸" },
          { id: "qr", label: "QR-Code", icon: "📱" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-0.5"
            style={{ color: tab === t.id ? "var(--nexio-green)" : "var(--foreground-3)",
              borderBottom: tab === t.id ? "2px solid var(--nexio-green)" : "2px solid transparent" }}>
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {/* Wallet / History */}
        {tab === "wallet" && (
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: "var(--border)", borderTopColor: "var(--nexio-green)" }} />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💸</div>
                <p className="text-sm" style={{ color: "var(--foreground-3)" }}>Noch keine Transaktionen</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
                {transactions.map((tx, i) => {
                  const isIncoming = tx.recipient_id === userId;
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3"
                      style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: isIncoming ? "#07c16020" : "#ef444420" }}>
                        {isIncoming ? "⬇️" : "⬆️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                          {isIncoming
                            ? `Von @${(tx.sender as any)?.username ?? "?"}`
                            : `An @${(tx.recipient as any)?.username ?? "?"}`}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
                          {tx.note ?? "Keine Notiz"} · {new Date(tx.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold"
                          style={{ color: isIncoming ? "#07c160" : "#ef4444" }}>
                          {isIncoming ? "+" : "-"}{formatAmount(tx.amount_cents)}
                        </p>
                        <p className="text-[10px]"
                          style={{ color: tx.status === "completed" ? "#07c160" : "#f59e0b" }}>
                          {tx.status === "completed" ? "✓" : "⏳"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Send */}
        {tab === "send" && (
          <div className="space-y-4">
            {/* Recipient search */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--foreground-3)" }}>Empfänger</p>
              {recipient ? (
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "var(--surface)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: "var(--nexio-green)" }}>
                    {recipient.display_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{recipient.display_name}</p>
                    <p className="text-xs" style={{ color: "var(--foreground-3)" }}>@{recipient.username}</p>
                  </div>
                  <button onClick={() => setRecipient(null)} style={{ color: "var(--foreground-3)" }}>✕</button>
                </div>
              ) : (
                <div>
                  <div className="rounded-2xl px-3 py-2 flex items-center gap-2 mb-2"
                    style={{ background: "var(--surface)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ color: "var(--foreground-3)" }}>
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
                      placeholder="Name oder @username suchen…"
                      className="flex-1 text-sm bg-transparent focus:outline-none"
                      style={{ color: "var(--foreground)" }}
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
                      {searchResults.map((u, i) => (
                        <button key={u.id} onClick={() => { setRecipient(u); setSearchQuery(""); setSearchResults([]); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                          style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: "var(--nexio-green)" }}>
                            {u.display_name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{u.display_name}</p>
                            <p className="text-xs" style={{ color: "var(--foreground-3)" }}>@{u.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--foreground-3)" }}>Betrag (€)</p>
              <div className="rounded-2xl px-4 py-3" style={{ background: "var(--surface)" }}>
                <input
                  type="number" min="0.01" step="0.01"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full text-2xl font-bold bg-transparent focus:outline-none text-center"
                  style={{ color: "var(--foreground)" }}
                />
              </div>
              {/* Quick amounts */}
              <div className="flex gap-2 mt-2">
                {["5", "10", "20", "50"].map((a) => (
                  <button key={a} onClick={() => setAmount(a)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: "var(--surface)", color: "var(--foreground-2)" }}>
                    €{a}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="rounded-2xl px-4 py-3" style={{ background: "var(--surface)" }}>
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Notiz (optional)"
                className="w-full text-sm bg-transparent focus:outline-none"
                style={{ color: "var(--foreground)" }}
              />
            </div>

            {sendMsg && (
              <p className="text-xs text-center py-2 px-4 rounded-xl"
                style={{ background: "var(--surface)", color: sendMsg.startsWith("✅") ? "#07c160" : "#ef4444" }}>
                {sendMsg}
              </p>
            )}

            <button onClick={sendPayment} disabled={!recipient || !amount || sending}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white"
              style={{ background: (!recipient || !amount || sending) ? "#9ca3af" : "var(--nexio-green)" }}>
              {sending ? "Sende…" : `💸 Jetzt senden${amount && !isNaN(parseFloat(amount)) ? ` · €${parseFloat(amount).toFixed(2)}` : ""}`}
            </button>
          </div>
        )}

        {/* QR Code */}
        {tab === "qr" && (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3" style={{ background: "var(--surface)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--foreground-3)" }}>Betrag für QR-Code (€)</p>
              <div className="flex gap-2">
                <input type="number" min="0.01" step="0.01" value={qrAmount}
                  onChange={(e) => setQrAmount(e.target.value)}
                  placeholder="Betrag eingeben…"
                  className="flex-1 text-lg font-bold bg-transparent focus:outline-none"
                  style={{ color: "var(--foreground)" }}
                />
                <button onClick={generateQR}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "var(--nexio-green)" }}>
                  Generieren
                </button>
              </div>
            </div>

            {qrCode && (
              <div className="rounded-2xl p-6 flex flex-col items-center gap-4"
                style={{ background: "var(--surface)" }}>
                <canvas ref={canvasRef} width={200} height={200}
                  className="rounded-xl" style={{ imageRendering: "pixelated" }} />
                <p className="text-xs text-center" style={{ color: "var(--foreground-3)" }}>
                  QR-Code scannen zum Bezahlen
                  <br />Gültig für: {qrAmount && formatAmount(Math.round(parseFloat(qrAmount) * 100))}
                </p>
                <p className="text-[10px] px-3 py-1.5 rounded-full"
                  style={{ background: "#f59e0b20", color: "#f59e0b" }}>
                  Demo — Live-Stripe wird mit STRIPE_SECRET_KEY aktiviert
                </p>
              </div>
            )}

            <div className="rounded-2xl px-4 py-4" style={{ background: "var(--surface)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Meine Zahlungsadresse</p>
              <p className="text-xs font-mono p-2 rounded-lg break-all"
                style={{ background: "var(--background)", color: "var(--foreground-3)" }}>
                nexio://pay/{userId?.slice(0, 16)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

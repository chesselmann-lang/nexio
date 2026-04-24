"use client";
import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Transaction {
  id: string;
  amount_cents: number;
  currency: string;
  note: string | null;
  status: string;
  created_at: string;
  sender: { id: string; display_name: string } | null;
  receiver: { id: string; display_name: string } | null;
}

export default function PaymentsClient({
  currentUserId,
  displayName,
  transactions,
}: {
  currentUserId: string;
  displayName: string;
  transactions: Transaction[];
}) {
  const [tab, setTab] = useState<"home" | "send" | "history">("home");

  const totalSent = transactions
    .filter((t) => t.sender?.id === currentUserId && t.status === "completed")
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const totalReceived = transactions
    .filter((t) => t.receiver?.id === currentUserId && t.status === "completed")
    .reduce((sum, t) => sum + t.amount_cents, 0);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex-none px-4 pt-safe border-b flex items-center justify-between"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Nexio Pay</h1>
        <button className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: "var(--nexio-green)", color: "white" }}>
          + IBAN verbinden
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Balance Card */}
        <div className="mx-4 mt-4 rounded-2xl p-5 text-white"
          style={{ background: "linear-gradient(135deg, #1677ff 0%, #0051cc 100%)" }}>
          <p className="text-sm opacity-80 mb-1">Guthaben</p>
          <p className="text-4xl font-bold mb-4">
            {((totalReceived - totalSent) / 100).toFixed(2)} €
          </p>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="opacity-70">Empfangen</p>
              <p className="font-semibold">+{(totalReceived / 100).toFixed(2)} €</p>
            </div>
            <div>
              <p className="opacity-70">Gesendet</p>
              <p className="font-semibold">-{(totalSent / 100).toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 px-4 mt-4">
          {[
            { icon: "💸", label: "Senden", action: () => {} },
            { icon: "🔗", label: "Link", action: () => {} },
            { icon: "📷", label: "QR-Code", action: () => {} },
            { icon: "🏦", label: "SEPA", action: () => {} },
          ].map(({ icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-medium" style={{ color: "var(--foreground-2)" }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div className="px-4 mt-6">
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground-2)" }}>
            Letzte Transaktionen
          </p>

          {transactions.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-3"
              style={{ color: "var(--foreground-3)" }}>
              <span className="text-4xl">💳</span>
              <p className="text-sm">Noch keine Transaktionen</p>
              <p className="text-xs text-center">Sende oder empfange deine erste Zahlung</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {transactions.map((t) => {
              const isSent = t.sender?.id === currentUserId;
              const other = isSent ? t.receiver : t.sender;
              const sign = isSent ? "-" : "+";
              const color = isSent ? "var(--foreground)" : "#07c160";

              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-none"
                    style={{ background: isSent ? "#fee2e2" : "#dcfce7" }}
                  >
                    {isSent ? "↑" : "↓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>
                      {other?.display_name ?? "Unbekannt"}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
                      {t.note ?? (isSent ? "Gesendet" : "Empfangen")} ·{" "}
                      {format(new Date(t.created_at), "d. MMM", { locale: de })}
                    </p>
                  </div>
                  <div className="text-right flex-none">
                    <p className="font-bold text-sm" style={{ color }}>
                      {sign}{(t.amount_cents / 100).toFixed(2)} €
                    </p>
                    <p className="text-xs capitalize" style={{
                      color: t.status === "completed" ? "#07c160" : t.status === "failed" ? "#ef4444" : "#f59e0b"
                    }}>
                      {t.status === "completed" ? "✓" : t.status === "failed" ? "✗" : "⏳"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEPA + Stripe Notice */}
        <div className="mx-4 mt-4 mb-6 p-4 rounded-2xl border"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground-2)" }}>🔒 Sicher & reguliert</p>
          <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
            Nexio Pay verwendet Stripe für die Zahlungsabwicklung. Alle Transaktionen sind
            verschlüsselt und DSGVO-konform. Konto reguliert nach EU PSD2.
          </p>
        </div>
      </div>
    </div>
  );
}

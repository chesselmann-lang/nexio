"use client";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: "💸", title: "Geld senden & empfangen", desc: "Überweise in Sekunden an jeden Nexio-Kontakt — kostenlos." },
  { icon: "🏦", title: "Virtuelles Wallet", desc: "Dein Guthaben immer griffbereit, sicher hinter Biometrie." },
  { icon: "🧾", title: "Splitten & Anfordern", desc: "Teile Rechnungen auf und fordere Geld von Gruppen an." },
  { icon: "🌍", title: "Multi-Währung", desc: "EUR, USD, GBP und mehr — automatische Umrechnung." },
  { icon: "🔒", title: "DSGVO & PSD2-konform", desc: "Bankgradsicherheit, Ende-zu-Ende verschlüsselt." },
  { icon: "🤝", title: "Business-Zahlungen", desc: "Rechnungen, Abonnements und Team-Budgets verwalten." },
];

export default function NexioPayComingSoonPage() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center -ml-1"
          style={{ color: "var(--foreground-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Nexio Pay</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-6 py-10 text-center"
          style={{ background: "linear-gradient(135deg, #07c16015 0%, #07c16005 100%)" }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg"
            style={{ background: "var(--nexio-green)" }}>
            💳
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: "#07c16020", color: "#07c160" }}>
            ✨ Demnächst verfügbar
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
            Bezahlen so einfach wie chatten
          </h2>
          <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "var(--foreground-3)" }}>
            Nexio Pay verwandelt jeden Chat in einen Zahlungsraum.
            Sende Geld, teile Kosten, verwalte dein Budget — alles direkt in Nexio.
          </p>
        </div>

        {/* Features */}
        <div className="px-4 py-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider px-1 mb-3"
            style={{ color: "var(--foreground-3)" }}>Was Nexio Pay kann</p>
          {FEATURES.map((f) => (
            <div key={f.title}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: "var(--surface)" }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-none"
                style={{ background: "#07c16015" }}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{f.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Waitlist CTA */}
        <div className="px-4 py-4 mb-8">
          <div className="rounded-3xl p-5 text-center" style={{ background: "var(--surface)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              Als Erster dabei sein?
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--foreground-3)" }}>
              Trag dich auf die Warteliste ein und erhalte Early Access.
            </p>
            <button
              onClick={() => {
                const subject = encodeURIComponent("Nexio Pay Early Access");
                const body = encodeURIComponent("Hallo,\n\nIch möchte mich für den Early Access zu Nexio Pay anmelden.");
                window.open(`mailto:hallo@hesselmann-service.de?subject=${subject}&body=${body}`);
              }}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: "var(--nexio-green)" }}>
              Zum Early Access anmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

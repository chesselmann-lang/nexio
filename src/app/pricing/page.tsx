import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "0 €",
    period: "für immer",
    color: "#6b7280",
    bg: "#6b728012",
    badge: null,
    features: [
      "✅ 1:1 Chats & Gruppen (bis 20 Mitglieder)",
      "✅ Sprach- & Videonachrichten",
      "✅ Fotos & Dateien (max. 20 MB)",
      "✅ Momente (24h Stories)",
      "✅ KI-Assistent (5 Nachrichten/Tag)",
      "✅ 5 GB Speicher",
      "❌ Ende-zu-Ende-Verschlüsselung",
      "❌ Prioritäts-Support",
    ],
    cta: "Kostenlos starten",
    ctaHref: "/login",
    highlight: false,
  },
  {
    name: "Pro",
    price: "9,99 €",
    period: "pro Monat",
    color: "#07c160",
    bg: "#07c16012",
    badge: "Beliebt",
    features: [
      "✅ Gruppen bis 500 Mitglieder",
      "✅ Ende-zu-Ende-Verschlüsselung",
      "✅ Unbegrenzte KI-Gespräche",
      "✅ Dateien bis 2 GB",
      "✅ 100 GB Speicher",
      "✅ Permanente Momente",
      "✅ Prioritäts-Support",
      "✅ Nexio Pay (unbegrenzt)",
    ],
    cta: "Pro aktivieren",
    ctaHref: "/payments",
    highlight: true,
  },
  {
    name: "Business",
    price: "29,99 €",
    period: "pro Monat",
    color: "#1677ff",
    bg: "#1677ff12",
    badge: "Unternehmen",
    features: [
      "✅ Alles aus Pro",
      "✅ Verifiziertes Business-Konto ✓",
      "✅ Bezahlte Channel-Abonnements",
      "✅ Mini-Programme veröffentlichen",
      "✅ API-Zugang & Webhooks",
      "✅ Analytics & Einblicke",
      "✅ Bis 10 Mitarbeiter-Konten",
      "✅ Dedizierter Account-Manager",
    ],
    cta: "Business anfragen",
    ctaHref: "mailto:hallo@hesselmann-service.de?subject=Nexio Business",
    highlight: false,
  },
];

const FAQ = [
  { q: "Kann ich jederzeit kündigen?", a: "Ja. Du kannst dein Abonnement jederzeit zum Ende des Abrechnungszeitraums kündigen. Deine Daten bleiben erhalten." },
  { q: "Wie funktioniert die Abrechnung?", a: "Die Abrechnung erfolgt monatlich über Nexio Pay (Stripe). Du erhältst eine Rechnung per E-Mail." },
  { q: "Gibt es einen Jahrestarif?", a: "Ja — bei jährlicher Zahlung sparst du 2 Monate: Pro für 99 €/Jahr, Business für 299 €/Jahr." },
  { q: "Was passiert mit meinen Daten beim Downgrade?", a: "Deine Nachrichten und Medien bleiben gespeichert, aber neue Uploads sind auf das Free-Limit beschränkt." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <Link href="/login" className="text-sm font-semibold" style={{ color: "var(--nexio-green)" }}>
          ← Nexio
        </Link>
        <h1 className="flex-1 text-center text-base font-bold" style={{ color: "var(--foreground)" }}>
          Preise
        </h1>
        <div className="w-16" />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Wähle deinen Plan
          </h2>
          <p className="text-sm" style={{ color: "var(--foreground-3)" }}>
            Nexio ist kostenlos nutzbar. Upgrade für mehr Power.
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--surface)",
                border: plan.highlight ? `2px solid ${plan.color}` : "1px solid var(--border)",
              }}
            >
              {/* Plan header */}
              <div className="px-5 pt-5 pb-4" style={{ background: plan.bg }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-lg" style={{ color: plan.color }}>
                    {plan.name}
                  </span>
                  {plan.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                      style={{ background: plan.color }}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: "var(--foreground-3)" }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="px-5 py-4 space-y-2">
                {plan.features.map((f) => (
                  <p key={f} className="text-sm" style={{ color: f.startsWith("❌") ? "var(--foreground-3)" : "var(--foreground)" }}>
                    {f}
                  </p>
                ))}
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <a
                  href={plan.ctaHref}
                  className="block w-full py-3 rounded-2xl text-center text-sm font-semibold text-white"
                  style={{ background: plan.highlight ? plan.color : "var(--surface-2)", color: plan.highlight ? "white" : plan.color }}
                >
                  {plan.cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table teaser */}
        <div className="rounded-2xl p-4 text-center" style={{ background: "var(--surface)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            🇩🇪 DSGVO-konform · Hosting in Deutschland · Keine Werbung
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--foreground-3)" }}>
            Betrieben von Hesselmann Beratung UG · Duisburg
          </p>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-3)" }}>
            Häufige Fragen
          </h3>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl px-4 py-3" style={{ background: "var(--surface)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>{item.q}</p>
                <p className="text-xs" style={{ color: "var(--foreground-3)" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-center pb-6" style={{ color: "var(--foreground-3)" }}>
          Alle Preise inkl. MwSt. ·{" "}
          <Link href="/agb" style={{ color: "var(--nexio-green)" }}>AGB</Link>
          {" · "}
          <Link href="/datenschutz" style={{ color: "var(--nexio-green)" }}>Datenschutz</Link>
        </p>
      </div>
    </div>
  );
}

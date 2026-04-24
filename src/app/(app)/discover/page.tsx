"use client";

const MINI_APP_CATEGORIES = [
  {
    title: "🏪 Alltag",
    apps: [
      { name: "Restaurants", icon: "🍽️", desc: "Tisch reservieren & bestellen" },
      { name: "Supermarkt", icon: "🛒", desc: "Einkaufen & liefern lassen" },
      { name: "Apotheke", icon: "💊", desc: "Rezepte & Medikamente" },
    ],
  },
  {
    title: "🏛️ Behörden",
    apps: [
      { name: "Ummeldung", icon: "📋", desc: "Adresse ummelden digital" },
      { name: "KFZ-Zulassung", icon: "🚗", desc: "Auto an- & ummelden" },
      { name: "Finanzamt", icon: "📊", desc: "Steuererklärung digital" },
    ],
  },
  {
    title: "💼 Business",
    apps: [
      { name: "Rechnungen", icon: "🧾", desc: "Rechnungen erstellen & senden" },
      { name: "CRM", icon: "👥", desc: "Kunden & Leads verwalten" },
      { name: "Chatifyx Inbox", icon: "📥", desc: "Business-Posteingang" },
    ],
  },
  {
    title: "❤️ Gesundheit",
    apps: [
      { name: "Arzt-Termine", icon: "🩺", desc: "Termine buchen & verwalten" },
      { name: "E-Rezept", icon: "💉", desc: "Digitale Rezepte" },
      { name: "Patientenakte", icon: "📁", desc: "EPA-Integration" },
    ],
  },
];

export default function DiscoverPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-4 flex items-center border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Entdecken</h1>
        </div>
        <button className="w-8 h-8 flex items-center justify-center" style={{ color: "var(--foreground-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search bar */}
        <div className="px-4 py-3">
          <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
            style={{ background: "var(--surface-2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: "var(--foreground-3)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-sm" style={{ color: "var(--foreground-3)" }}>Mini-Apps suchen…</span>
          </div>
        </div>

        {/* Coming Soon banner */}
        <div className="mx-4 mb-4 rounded-2xl p-4 text-white"
          style={{ background: "linear-gradient(135deg, var(--nexio-green), #059850)" }}>
          <p className="font-bold text-base">Mini-App-Plattform</p>
          <p className="text-sm opacity-90 mt-0.5">
            Drittanbieter-Apps direkt in Nexio — ohne App-Store, ohne zusätzlichen Login.
          </p>
          <button className="mt-3 bg-white text-sm font-semibold px-4 py-1.5 rounded-full"
            style={{ color: "var(--nexio-green)" }}>
            Als Entwickler registrieren
          </button>
        </div>

        {/* Categories */}
        {MINI_APP_CATEGORIES.map((cat) => (
          <div key={cat.title} className="mb-4">
            <p className="px-4 py-2 text-sm font-semibold" style={{ color: "var(--foreground-2)" }}>
              {cat.title}
            </p>
            <div className="space-y-0">
              {cat.apps.map((app) => (
                <button
                  key={app.name}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-b"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-none"
                    style={{ background: "var(--surface-2)" }}>
                    {app.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{app.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>{app.desc}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--nexio-green-light)", color: "var(--nexio-green)" }}>
                      Bald
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

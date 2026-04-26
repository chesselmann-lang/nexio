import Link from "next/link";

export const metadata = {
  title: "DSA-Transparenz & Meldestelle | Nexio",
  description: "Informationen gemäß Digital Services Act (DSA) — Meldestelle für illegale Inhalte, Moderationsrichtlinien und Kontaktpunkte.",
};

export default function TransparenzPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm mb-8 inline-flex items-center gap-1" style={{ color: "var(--foreground-3)" }}>
          ← Zurück
        </Link>

        <h1 className="text-2xl font-bold mb-2">DSA-Transparenz & Meldestelle</h1>
        <p className="text-sm mb-8" style={{ color: "var(--foreground-3)" }}>
          Gemäß Verordnung (EU) 2022/2065 (Digital Services Act), gültig ab Februar 2024
        </p>

        {/* Kontaktpunkt Art. 11 DSA */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Elektronischer Kontaktpunkt (Art. 11 DSA)</h2>
          <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-sm mb-3" style={{ color: "var(--foreground-2)" }}>
              Für Anfragen von Behörden, Nutzern und der Europäischen Kommission steht folgender
              Kontaktpunkt zur Verfügung:
            </p>
            <div className="space-y-1 text-sm">
              <p><strong>Verantwortlich:</strong> Hesselmann Beratung UG (haftungsbeschränkt)</p>
              <p><strong>E-Mail:</strong>{" "}
                <a href="mailto:dsa@supachat.de" style={{ color: "var(--nexio-indigo)" }}>dsa@supachat.de</a>
                {" "}(alternativ:{" "}
                <a href="mailto:hallo@hesselmann-service.de" style={{ color: "var(--nexio-indigo)" }}>
                  hallo@hesselmann-service.de
                </a>)
              </p>
              <p><strong>Sprachen:</strong> Deutsch, Englisch</p>
              <p><strong>Antwortzeit:</strong> In der Regel innerhalb von 5 Werktagen</p>
            </div>
          </div>
        </section>

        {/* Meldestelle Art. 16 DSA */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Meldestelle für illegale Inhalte (Art. 16 DSA)</h2>
          <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-sm mb-4" style={{ color: "var(--foreground-2)" }}>
              Nutzer können rechtswidrige Inhalte über folgende Wege melden:
            </p>
            <ul className="text-sm space-y-2" style={{ color: "var(--foreground-2)" }}>
              <li>• <strong>In der App:</strong> Lang-Press auf eine Nachricht → „Melden" → Kategorie wählen</li>
              <li>• <strong>Profilmeldung:</strong> Nutzerprofil öffnen → ⋯ → „Nutzer melden"</li>
              <li>• <strong>Per E-Mail:</strong>{" "}
                <a href="mailto:melden@supachat.de" style={{ color: "var(--nexio-indigo)" }}>melden@supachat.de</a>
                {" "}mit Betreff „DSA-Meldung"
              </li>
            </ul>
            <div className="mt-4 rounded-xl p-3 text-xs" style={{ background: "var(--surface-2)", color: "var(--foreground-3)" }}>
              Meldungen werden innerhalb von <strong>24 Stunden</strong> gesichtet. Bei bestätigten Verstößen
              erfolgt die Entfernung und Benachrichtigung des Meldenden gemäß Art. 17 DSA.
            </div>
          </div>
        </section>

        {/* Inhaltsmoderation */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Inhaltsmoderation & Gemeinschaftsstandards</h2>
          <div className="rounded-2xl p-5 space-y-3 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground-2)" }}>
            <p><strong>Nicht erlaubte Inhalte:</strong></p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Darstellung von Kindesmissbrauch (CSAM) — sofortige Meldung an BKA/Clearingstelle</li>
              <li>Terroristische oder extremistische Inhalte</li>
              <li>Nicht-einvernehmliche intime Bilder (NCII)</li>
              <li>Hassrede, Diskriminierung nach § 130 StGB</li>
              <li>Betrug, Phishing, Malware-Verbreitung</li>
            </ul>
            <p className="mt-2"><strong>Moderationsverfahren:</strong> Automatische NSFW-Erkennung + manuelle Prüfung durch Administratoren. Bei Entfernung von Inhalten erfolgt eine Begründung (Art. 17 DSA).</p>
          </div>
        </section>

        {/* Beschwerdemechanismus Art. 20 DSA */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Beschwerdemechanismus (Art. 20 DSA)</h2>
          <div className="rounded-2xl p-5 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground-2)" }}>
            <p className="mb-2">
              Wenn du der Ansicht bist, dass eine Inhaltsentscheidung (Entfernung, Sperrung) ungerechtfertigt war,
              kannst du innerhalb von <strong>14 Tagen</strong> Beschwerde einlegen:
            </p>
            <p>
              <a href="mailto:beschwerde@supachat.de" style={{ color: "var(--nexio-indigo)" }}>
                beschwerde@supachat.de
              </a>{" "}mit deiner Nutzungs-ID und einer Beschreibung des Vorgangs.
            </p>
            <p className="mt-2">
              Für unabhängige außergerichtliche Streitbeilegung (Art. 21 DSA) kann die{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--nexio-indigo)" }}>
                EU-OS-Plattform
              </a>{" "}genutzt werden.
            </p>
          </div>
        </section>

        {/* Jugendschutz */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Jugendschutz</h2>
          <div className="rounded-2xl p-5 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground-2)" }}>
            <p className="mb-2">
              Nexio richtet sich an Nutzer ab <strong>16 Jahren</strong> (Art. 28 DSA — Schutz Minderjähriger).
              Maßnahmen:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Altersbestätigung bei Registrierung</li>
              <li>Automatische NSFW-Erkennung und Altersgating für explizite Inhalte</li>
              <li>Meldeoption für unangemessene Kontaktversuche</li>
              <li>Jugendschutzfilter für Medieninhalte</li>
            </ul>
          </div>
        </section>

        {/* Links */}
        <div className="text-sm pt-4" style={{ borderTop: "1px solid var(--border)", color: "var(--foreground-3)" }}>
          <p>Weitere rechtliche Dokumente:</p>
          <div className="flex gap-4 mt-2 flex-wrap">
            {[
              ["/impressum", "Impressum"],
              ["/datenschutz", "Datenschutz"],
              ["/agb", "AGB"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="underline" style={{ color: "var(--nexio-indigo)" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jugendschutz | Nexio",
  description: "Informationen zum Jugendschutz und zu Sicherheitsmaßnahmen für Minderjährige auf Nexio",
};

export default function JugendschutzPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-10 px-4 py-3 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/profile" style={{ color: "var(--foreground-3)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Jugendschutz bei Nexio
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6" style={{ color: "var(--foreground)" }}>

        {/* Intro */}
        <div className="rounded-2xl p-5" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🛡️</span>
            <h2 className="text-lg font-bold">Schutz von Minderjährigen</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-2)" }}>
            Nexio nimmt den Schutz von Kindern und Jugendlichen sehr ernst. Diese Seite erklärt,
            welche Maßnahmen wir treffen und welche Einstellungen Eltern und Minderjährige nutzen können.
          </p>
        </div>

        {/* Mindestalter */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--surface)" }}>
          <h3 className="font-bold text-base">Mindestalter &amp; Registrierung</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-2)" }}>
            Nexio richtet sich an Nutzer ab 13 Jahren. Für Nutzer unter 16 Jahren ist gemäß DSGVO
            Art. 8 die Zustimmung eines Erziehungsberechtigten erforderlich. Bei der Registrierung
            erfassen wir optional das Geburtsjahr, um altersangemessene Inhalte sicherzustellen.
          </p>
          <ul className="text-sm space-y-1" style={{ color: "var(--foreground-2)" }}>
            <li>• Mindestalter: 13 Jahre</li>
            <li>• Unter 16 Jahren: Elterliche Zustimmung erforderlich</li>
            <li>• Konten von Minderjährigen werden bei Bekanntwerden gesperrt, wenn keine Einwilligung vorliegt</li>
          </ul>
        </div>

        {/* Jugendschutzfilter */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--surface)" }}>
          <h3 className="font-bold text-base">Jugendschutzfilter</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-2)" }}>
            Der Jugendschutzfilter kann in den Einstellungen unter
            <strong style={{ color: "var(--foreground)" }}> Datenschutz &amp; Sicherheit</strong> aktiviert werden.
            Bei aktiviertem Filter werden:
          </p>
          <ul className="text-sm space-y-1.5" style={{ color: "var(--foreground-2)" }}>
            <li>✅ Als jugendunangemessen markierte Momente (Bilder, Videos) unkenntlich gemacht</li>
            <li>✅ Explizite Inhalte in Kanälen hinter einer Altersabfrage versteckt</li>
            <li>✅ Nutzer, die wiederholt gemeldeten NSFW-Content posten, eingeschränkt angezeigt</li>
          </ul>
        </div>

        {/* Meldesystem */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--surface)" }}>
          <h3 className="font-bold text-base">Meldesystem (DSA Art. 16)</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-2)" }}>
            Gemäß Digital Services Act (EU) 2022/2065 stellen wir ein einfach zugängliches
            Meldesystem bereit. Jeder Inhalt kann direkt über das ••• Menü gemeldet werden.
            Meldekategorien umfassen:
          </p>
          <ul className="text-sm space-y-1" style={{ color: "var(--foreground-2)" }}>
            <li>• Jugendgefährdende Inhalte</li>
            <li>• Belästigung / Cybermobbing</li>
            <li>• CSAM (wird unverzüglich an zuständige Behörden weitergegeben)</li>
            <li>• Hassrede, Spam, Falschinformationen</li>
          </ul>
          <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
            ⚠️ Hinweise auf Kindesmissbrauchsmaterial (CSAM) werden ohne Verzögerung an das BKA
            und das NCMEC gemeldet.
          </p>
        </div>

        {/* Eltern-Tools */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--surface)" }}>
          <h3 className="font-bold text-base">Tools für Eltern &amp; Erziehungsberechtigte</h3>
          <ul className="text-sm space-y-2" style={{ color: "var(--foreground-2)" }}>
            <li>🔒 <strong style={{ color: "var(--foreground)" }}>Jugendschutzfilter</strong> — unter Einstellungen → Datenschutz aktivierbar</li>
            <li>🚫 <strong style={{ color: "var(--foreground)" }}>Blockieren &amp; Melden</strong> — jede Person kann blockiert und gemeldet werden</li>
            <li>👁 <strong style={{ color: "var(--foreground)" }}>Datenschutz-Einstellungen</strong> — Kontrolle darüber, wer das Profil sehen kann</li>
            <li>📧 <strong style={{ color: "var(--foreground)" }}>Elternkontakt</strong> — bei Fragen: <a href="mailto:jugendschutz@nexio.app" style={{ color: "var(--nexio-green)" }}>jugendschutz@nexio.app</a></li>
          </ul>
        </div>

        {/* Ansprechpartner */}
        <div className="rounded-2xl p-5 space-y-2" style={{ background: "var(--surface)" }}>
          <h3 className="font-bold text-base">Beauftragter für Jugendschutz</h3>
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Gemäß § 7 JMStV hat Nexio einen Jugendschutzbeauftragten benannt:
          </p>
          <div className="text-sm space-y-1" style={{ color: "var(--foreground-2)" }}>
            <p><strong style={{ color: "var(--foreground)" }}>Hesselmann Beratung UG</strong></p>
            <p>Jugendschutzbeauftragter: Christian Hesselmann</p>
            <p>E-Mail: <a href="mailto:jugendschutz@nexio.app" style={{ color: "var(--nexio-green)" }}>jugendschutz@nexio.app</a></p>
          </div>
        </div>

        {/* Rechtsgrundlagen */}
        <div className="rounded-2xl p-5 space-y-2" style={{ background: "var(--surface)" }}>
          <h3 className="font-bold text-base">Rechtsgrundlagen</h3>
          <ul className="text-sm space-y-1" style={{ color: "var(--foreground-2)" }}>
            <li>• JuSchG (Jugendschutzgesetz)</li>
            <li>• JMStV (Jugendmedienschutz-Staatsvertrag)</li>
            <li>• DSGVO Art. 8 (Einwilligung von Kindern)</li>
            <li>• DSA (EU) 2022/2065 Art. 16, 28, 34</li>
            <li>• NetzDG (bei ≥2 Mio. Nutzer/DE — Vorsorge getroffen)</li>
          </ul>
        </div>

        <p className="text-xs text-center pb-8" style={{ color: "var(--foreground-3)" }}>
          Stand: April 2026 · Nexio / Hesselmann Beratung UG
        </p>
      </div>
    </div>
  );
}

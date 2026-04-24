import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DSA – Digital Services Act | Nexio",
  description: "Informationen gemäß Digital Services Act (EU) 2022/2065 für Nexio",
};

export default function DSAPage() {
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
            Digital Services Act (DSA)
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6" style={{ color: "var(--foreground)" }}>
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--surface)" }}>
          <h2 className="text-lg font-bold">Transparenzbericht gemäß DSA (EU) 2022/2065</h2>
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Nexio ist ein sozialer Messaging-Dienst. Gemäß der Verordnung (EU) 2022/2065 über einen
            Binnenmarkt für digitale Dienste (Digital Services Act) stellen wir folgende Informationen bereit.
          </p>
        </div>

        {/* Anbieter */}
        <Section title="1. Anbieter">
          <Row label="Dienst" value="Nexio – Messenger & Social Platform" />
          <Row label="Betreiber" value="Hesselmann Beratung UG (haftungsbeschränkt)" />
          <Row label="Anschrift" value="Musterstraße 1, 12345 Musterstadt, Deutschland" />
          <Row label="E-Mail" value="dsa@nexio.app" />
          <Row label="Handelsregister" value="HRB 123456 Amtsgericht Musterstadt" />
          <Row label="USt-IdNr." value="DE123456789" />
        </Section>

        {/* Nutzer */}
        <Section title="2. Nutzerzahlen">
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Nexio ist ein kleiner Dienst mit derzeit unter 45 Millionen durchschnittlichen monatlichen
            Nutzern in der EU. Nexio gilt daher nicht als „sehr große Online-Plattform" (VLOP) im
            Sinne des DSA.
          </p>
        </Section>

        {/* Meldung rechtswidriger Inhalte */}
        <Section title="3. Meldung rechtswidriger Inhalte">
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Nutzer können rechtswidrige Inhalte direkt in der App melden:
          </p>
          <ul className="text-sm mt-2 space-y-1" style={{ color: "var(--foreground-2)" }}>
            <li>• In jedem Chat: Nachricht gedrückt halten → „Melden"</li>
            <li>• Für Nutzerprofile: Profil aufrufen → „Melden"</li>
            <li>• Per E-Mail: abuse@nexio.app</li>
          </ul>
          <p className="text-sm mt-3" style={{ color: "var(--foreground-2)" }}>
            Meldungen werden von unserem Moderationsteam innerhalb von 72 Stunden bearbeitet.
            Bei strafbaren Inhalten erfolgt eine unverzügliche Weiterleitung an die zuständigen Behörden.
          </p>
        </Section>

        {/* Moderationspolitik */}
        <Section title="4. Moderationspolitik">
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Nexio setzt automatisierte und manuelle Moderationsmaßnahmen ein, um rechtswidrige
            und schädliche Inhalte zu erkennen und zu entfernen. Moderationsentscheidungen können
            umfassen:
          </p>
          <ul className="text-sm mt-2 space-y-1" style={{ color: "var(--foreground-2)" }}>
            <li>• Entfernung einzelner Nachrichten oder Inhalte</li>
            <li>• Temporäre oder permanente Kontosperrung</li>
            <li>• Benachrichtigung der zuständigen Behörden</li>
          </ul>
        </Section>

        {/* Beschwerde */}
        <Section title="5. Beschwerdemöglichkeiten">
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Nutzer können gegen Moderationsentscheidungen innerhalb von 14 Tagen Beschwerde
            einlegen. Die Beschwerde ist zu richten an:
          </p>
          <p className="text-sm mt-2 font-mono" style={{ color: "var(--foreground-2)" }}>
            beschwerde@nexio.app
          </p>
          <p className="text-sm mt-3" style={{ color: "var(--foreground-2)" }}>
            Alternativ können Nutzer die außergerichtliche Streitbeilegung über eine von der
            Europäischen Kommission zertifizierte Stelle in Anspruch nehmen oder sich an die
            zuständige nationale Behörde wenden.
          </p>
        </Section>

        {/* Koordinator für digitale Dienste */}
        <Section title="6. Koordinator für digitale Dienste">
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Die zuständige Koordinierungsstelle für digitale Dienste in Deutschland ist die
            Bundesnetzagentur (www.bundesnetzagentur.de).
          </p>
        </Section>

        {/* Werbung */}
        <Section title="7. Werbung">
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Nexio zeigt derzeit keine personalisierte Werbung. Sollte dies in Zukunft geändert
            werden, werden Nutzer entsprechend informiert und es werden die Anforderungen des
            DSA für Werbetransparenz eingehalten.
          </p>
        </Section>

        {/* Empfehlungssysteme */}
        <Section title="8. Empfehlungssysteme">
          <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
            Nexio verwendet algorithmische Empfehlungen für die Anzeige von öffentlichen
            Kanälen und Momenten-Inhalten. Nutzer können in den Einstellungen ihre
            Datenschutzpräferenzen anpassen.
          </p>
        </Section>

        {/* Stand */}
        <div className="text-xs text-center py-4" style={{ color: "var(--foreground-3)" }}>
          Stand: April 2026 · Nexio DSA-Beauftragter: dsa@nexio.app
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--surface)" }}>
      <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-36 flex-none font-medium" style={{ color: "var(--foreground-3)" }}>{label}</span>
      <span style={{ color: "var(--foreground-2)" }}>{value}</span>
    </div>
  );
}
